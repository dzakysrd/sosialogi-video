#!/usr/bin/env python3
"""Indonesian voiceover with per-word timestamps, built on the ElevenLabs API.

Drop-in alternative to tts.py (edge-tts): same outputs, same timing rules.

Usage:
  export ELEVENLABS_API_KEY=...   # read from the environment only, never a flag
  python3 tts_elevenlabs.py narration.txt --voice-id VOICE_ID --out-dir out/
  python3 tts_elevenlabs.py narration.json --voice-id VOICE_ID --out-dir out/ \
      --stability 0.5 --similarity 0.8 --max-pause 0.25
  python3 tts_elevenlabs.py narration.txt --voice-id VOICE_ID --out-dir out/ \
      --splice-base BASE_DIR --splice-at TEXT

Input: a .txt file (plain text) or a .json file holding a string, a list of
strings, or {"text": "..."}.

Writes to --out-dir:
  vo.mp3          narration, gain to -14 LUFS (+/- 0.3), 192 kHz limiter at -2 dBFS,
                  true peak <= -1.5 dBTP
  words.json      [{"text", "start", "end"}, ...]  every word, seconds
  sentences.json  [{"text", "start", "end"}, ...]  every sentence, seconds
  raw/            the API response and the request it answers (a cache)

If raw/request.json matches the request being made, the cached response is
reused and the API is not called (0 credits). --force-api always calls it.
Each real call appends a row to voice/elevenlabs_usage.csv.

Timing comes from the /with-timestamps character alignment. --max-pause shortens
silence between sentences to at most that many seconds by cutting it out of the
PCM (speech is never stretched or sped up). Silence after the last word is
trimmed to --tail-pad.

Splice mode (--splice-base DIR --splice-at TEXT) re-voices only the input from TEXT on
(TEXT must occur exactly once) and joins it onto an existing take in DIR, whose raw/
holds the full-text response for the same voice and model. Only the part from TEXT on
is sent, with the text before it as previous_text, so the new speech follows on from it.
The base audio is kept up to the middle of the silence before TEXT, the new audio is
level-matched to the base (gain clamped to +/-3 dB) and joined there, so the words
before TEXT keep their times. The joined alignment is kept in raw/combined_alignment.json.
DIR may itself be a splice take: load_take rebuilds its raw audio and alignment from its own
splice chain, so no copy of them is stored.
The outputs are the same as for any take.
"""

import argparse
import base64
import csv
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from array import array
from datetime import datetime, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tts  # voice/tts.py, next to this file

API = "https://api.elevenlabs.io"
OUTPUT_FORMAT = "mp3_44100_128"
SR = 44100  # ElevenLabs MP3 is 44.1 kHz; decode to this rate
TIMEOUT = 120  # seconds, for the TTS call
SUB_POLL_EVERY = 3  # seconds between subscription reads when there is no character-cost header
SUB_POLL_MAX = 30  # stop polling the subscription after this many seconds
REPO_ROOT = Path(__file__).resolve().parent.parent
USAGE_CSV = Path(__file__).resolve().parent / "elevenlabs_usage.csv"
USAGE_HEADER = ["utc_time", "out_dir", "voice_id", "model_id", "text_chars", "credits_used",
                "credits_source", "subscription_before", "subscription_after_read", "cost_headers"]
LOUD_TOL = 0.3  # accepted |integrated loudness - (-14 LUFS)|, LU
TP_MAX = -1.5  # accepted true peak, dBTP (headroom for the linear loudnorm in render_v3.sh)
LIMIT_START = -2.0  # first limiter ceiling, dBFS
LIMIT_STEP = 0.5  # dB the ceiling is lowered when the true peak is over TP_MAX
MAX_ENCODES = 4  # MP3 encodes allowed in normalize_to_mp3, the first one included
SPLICE_FADE_OUT = 0.010  # s, linear fade-out at the end of the base audio kept (at the cut)
SPLICE_FADE_IN = 0.005  # s, linear fade-in at the start of the re-voiced audio
SPLICE_LOUD_WINDOW = 10.0  # s of base audio before the cut that set the level
SPLICE_GAIN_MAX = 3.0  # dB, clamp on the level-match gain of the re-voiced audio


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set. Export it in this shell and run again.")
    return key


def build_request(args, text: str) -> dict:
    """The request as cached in raw/request.json. Only the settings that were passed appear."""
    settings = {}
    for arg, api_name in (("stability", "stability"), ("similarity", "similarity_boost"),
                          ("style", "style"), ("speed", "speed"),
                          ("speaker_boost", "use_speaker_boost")):
        value = getattr(args, arg)
        if value is not None:
            settings[api_name] = value
    req = {
        "text": text,
        "voice_id": args.voice_id,
        "model_id": args.model,
        "output_format": OUTPUT_FORMAT,
        "voice_settings": settings,
    }
    if args.seed is not None:
        req["seed"] = args.seed
    if args.language_code is not None:
        req["language_code"] = args.language_code
    return req


def request_body(req: dict) -> dict:
    """JSON body of the POST: the request without the parts that go in the URL, and the
    splice_base and splice_at keys, which are kept in raw/request.json only.
    An empty voice_settings is left out, so the voice's own defaults apply."""
    body = {k: v for k, v in req.items()
            if k not in ("voice_id", "output_format", "splice_base", "splice_at")}
    if not body.get("voice_settings"):
        body.pop("voice_settings", None)
    return body


def load_cache(raw: Path, req: dict):
    """(audio, alignment doc) from raw/ if it was made by exactly this request, else None."""
    try:
        if json.loads((raw / "request.json").read_text(encoding="utf-8")) != req:
            return None
        audio = (raw / "audio.mp3").read_bytes()
        doc = json.loads((raw / "alignment.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(doc, dict) or not isinstance(doc.get("alignment"), dict):
        return None
    return audio, doc


def write_raw(raw: Path, req: dict, audio: bytes, doc: dict) -> None:
    raw.mkdir(parents=True, exist_ok=True)
    # Drop the old request first, so a crash mid-write cannot pair it with new audio.
    (raw / "request.json").unlink(missing_ok=True)
    (raw / "audio.mp3").write_bytes(audio)
    (raw / "alignment.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n",
                                        encoding="utf-8")
    (raw / "request.json").write_text(json.dumps(req, ensure_ascii=False, indent=2) + "\n",
                                     encoding="utf-8")


def cost_headers(headers) -> dict:
    """Response headers that report characters or cost. Auth headers are never kept."""
    kept = {}
    for name, value in headers.items():
        low = name.lower()
        if ("character" in low or "cost" in low) and "api-key" not in low and "auth" not in low:
            kept[name] = value
    return kept


def tts_call(key: str, req: dict):
    """POST to /with-timestamps. Returns (audio bytes, alignment doc, cost headers)."""
    url = f"{API}/v1/text-to-speech/{req['voice_id']}/with-timestamps?output_format={OUTPUT_FORMAT}"
    try:
        r = requests.post(url, headers={"xi-api-key": key}, json=request_body(req),
                          timeout=TIMEOUT)
    except requests.RequestException as e:
        sys.exit(f"ElevenLabs request failed: {e}")
    if not 200 <= r.status_code < 300:
        sys.exit(f"ElevenLabs TTS failed: HTTP {r.status_code}\n{r.text}")
    try:
        data = r.json()
    except ValueError:
        sys.exit("ElevenLabs returned a body that is not JSON")
    if not isinstance(data, dict) or not data.get("audio_base64") \
            or not isinstance(data.get("alignment"), dict):
        keys = sorted(data) if isinstance(data, dict) else type(data).__name__
        sys.exit(f"ElevenLabs response has no audio_base64 or alignment (keys: {keys})")
    audio = base64.b64decode(data["audio_base64"])
    doc = {"alignment": data["alignment"], "normalized_alignment": data.get("normalized_alignment")}
    return audio, doc, cost_headers(r.headers)


def subscription(key: str) -> dict:
    try:
        r = requests.get(f"{API}/v1/user/subscription", headers={"xi-api-key": key}, timeout=30)
    except requests.RequestException as e:
        sys.exit(f"ElevenLabs subscription check failed: {e}")
    if not 200 <= r.status_code < 300:
        sys.exit(f"ElevenLabs subscription check failed: HTTP {r.status_code}\n{r.text}")
    try:
        d = r.json()
        return {"character_count": int(d["character_count"]),
                "character_limit": int(d["character_limit"])}
    except (ValueError, KeyError, TypeError):
        sys.exit("ElevenLabs subscription response has no character_count or character_limit")


def header_credits(headers: dict):
    """credits_used from the character-cost response header (any letter case), or None if the
    header is absent or its value is not an integer."""
    for name, value in headers.items():
        if name.lower() == "character-cost":
            try:
                return int(str(value).strip())
            except ValueError:
                return None
    return None


def read_credits(key: str, before: dict, header_used):
    """Subscription read after the call. Returns (after, credits_used, credits_source).

    With the character-cost header its value is the charge, and one read is enough (the
    counter may lag). Without it, the subscription is polled every SUB_POLL_EVERY s for up
    to SUB_POLL_MAX s until it changes, and the delta is the charge. If it never moves, the
    charge is unknown (None).
    """
    after = subscription(key)
    if header_used is not None:
        return after, header_used, "character-cost header"
    waited = 0
    while after["character_count"] == before["character_count"] and waited < SUB_POLL_MAX:
        time.sleep(SUB_POLL_EVERY)
        waited += SUB_POLL_EVERY
        after = subscription(key)
    delta = after["character_count"] - before["character_count"]
    if delta > 0:
        return after, delta, "subscription delta"
    return after, None, "unknown"


def repo_relative(p: Path) -> str:
    """p relative to the repo root if inside the repo, else absolute."""
    p = p.resolve()
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


def usage_out_dir(out: Path) -> str:
    """out_dir for the usage log: relative to the repo root if inside the repo, else absolute."""
    return repo_relative(out)


def check_usage_log() -> None:
    """Refuse a paid call if the usage log has other columns, so no spend goes unlogged."""
    if USAGE_CSV.exists() and USAGE_CSV.stat().st_size > 0:
        with USAGE_CSV.open(newline="", encoding="utf-8") as f:
            header = next(csv.reader(f), None)
        if header != USAGE_HEADER:
            sys.exit(f"{USAGE_CSV} has other columns than this script writes; "
                     "migrate or move it before a paid call")


def log_usage(out: Path, args, text: str, before: dict, after: dict, used, source: str,
              headers: dict) -> None:
    fresh = not USAGE_CSV.exists() or USAGE_CSV.stat().st_size == 0
    with USAGE_CSV.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if fresh:
            w.writerow(USAGE_HEADER)
        w.writerow([
            datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            usage_out_dir(out), args.voice_id, args.model, len(text),
            "" if used is None else used, source,
            before["character_count"], after["character_count"],
            "; ".join(f"{k}={v}" for k, v in headers.items()),
        ])


def check_alignment(alignment: dict, text: str) -> None:
    """The character alignment must spell the input text exactly. Nothing is repaired."""
    chars = alignment.get("characters")
    starts = alignment.get("character_start_times_seconds")
    ends = alignment.get("character_end_times_seconds")
    if not all(isinstance(x, list) for x in (chars, starts, ends)):
        sys.exit("alignment is missing characters or per-character times")
    if not all(isinstance(c, str) for c in chars):
        sys.exit("alignment characters are not all strings")
    if not len(chars) == len(starts) == len(ends):
        sys.exit(f"alignment lengths differ: {len(chars)} characters, {len(starts)} starts, "
                 f"{len(ends)} ends")
    joined = "".join(chars)
    if joined != text:
        i = next((k for k, (a, b) in enumerate(zip(joined, text)) if a != b),
                 min(len(joined), len(text)))
        sys.exit(f"alignment does not match the input text at index {i}: "
                 f"got {joined[i:i + 20]!r}, expected {text[i:i + 20]!r}")


def alignment_words(alignment: dict) -> list[dict]:
    """Group the character alignment into words, with the same text rules as tts.py."""
    chars = alignment["characters"]
    starts = alignment["character_start_times_seconds"]
    ends = alignment["character_end_times_seconds"]
    tokens, cur = [], []  # a token is a run of non-whitespace characters
    for i, ch in enumerate(chars):
        if ch.strip():
            cur.append(i)
        elif cur:
            tokens.append(cur)
            cur = []
    if cur:
        tokens.append(cur)
    words = []
    for idx in tokens:
        pairs = [(c, i) for i in idx for c in chars[i]]
        if not tts.WORD_RE.search("".join(c for c, _ in pairs)):
            continue  # punctuation-only token, dropped as in tts.py
        kept = [k for k, (c, _) in enumerate(pairs) if c.isalnum()]
        if not kept:
            sys.exit(f"token {''.join(c for c, _ in pairs)!r} has no letter or digit; "
                     "check the input text")
        lo, hi = kept[0], kept[-1]  # strip leading and trailing non-letters and digits
        words.append({
            "text": "".join(c for c, _ in pairs[lo:hi + 1]),
            "start": starts[pairs[lo][1]],
            "end": ends[pairs[hi][1]],
        })
    return words


def check_timing(words: list[dict], raw_seconds: float) -> None:
    if not words:
        sys.exit("alignment has no words")
    for i, w in enumerate(words):
        if w["end"] < w["start"]:
            sys.exit(f"word {i} {w['text']!r}: ends at {w['end']} before it starts at {w['start']}")
        if i and w["start"] < words[i - 1]["start"]:
            sys.exit(f"word {i} {w['text']!r}: starts at {w['start']}, before the previous word "
                     f"at {words[i - 1]['start']}")
    if words[-1]["end"] > raw_seconds + 0.05:
        sys.exit(f"last word ends at {words[-1]['end']} s but the raw audio is "
                 f"{raw_seconds:.3f} s long")


def limiter_chain(gain_db: float, limit_db: float) -> str:
    """Gain, then a lookahead limiter at 192 kHz so inter-sample peaks are seen, then 48 kHz.
    latency=1 makes alimiter compensate its lookahead, so the audio is not shifted in time."""
    limit = 10 ** (limit_db / 20)  # alimiter takes a linear ceiling
    return (f"volume={gain_db:.3f}dB,aresample=192000,"
            f"alimiter=limit={limit:.6f}:attack=1:release=50:level=0:latency=1,"
            "aresample=48000")


def normalize_to_mp3(wav: Path, out_mp3: Path) -> dict:
    """Level the edited wav to -14 LUFS and encode it to MP3, limiting peaks on the way.

    Raw ElevenLabs audio sits about 8 to 10 dB under -14 LUFS with peaky transients, so a
    linear loudnorm cannot reach the target without the true peak going over. Here a fixed
    gain is applied, then a limiter. Only level and peaks change; speech is never stretched.
    The MP3 is measured and the gain or the limiter ceiling corrected, with at most
    MAX_ENCODES encodes in all. If that is not enough, exits non-zero with the values.
    """
    i0, _ = tts.measure_loudness(wav)
    gain, limit = tts.LOUD_I - i0, LIMIT_START
    for encodes in range(1, MAX_ENCODES + 1):
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-i", str(wav),
                        "-af", limiter_chain(gain, limit), "-c:a", "libmp3lame", "-b:a", "256k",
                        str(out_mp3)], check=True, capture_output=True, text=True)
        i_lufs, tp = tts.measure_loudness(out_mp3)
        ok_i = abs(i_lufs - tts.LOUD_I) <= LOUD_TOL
        ok_tp = tp <= TP_MAX
        if ok_i and ok_tp:
            return {"integrated_lufs": i_lufs, "true_peak_dbtp": tp, "limiter_db": limit,
                    "gain_db": gain, "encodes": encodes}
        if encodes == MAX_ENCODES:
            break
        if not ok_i:
            gain += tts.LOUD_I - i_lufs
        if not ok_tp:
            limit -= LIMIT_STEP
    sys.exit(f"loudness out of range after {MAX_ENCODES} encodes: integrated {i_lufs:.2f} LUFS "
             f"(target {tts.LOUD_I} +/- {LOUD_TOL}), true peak {tp:.2f} dBTP (max {TP_MAX}), "
             f"limiter {limit:.2f} dBFS, gain {gain:.2f} dB")


def splice_plan(args, text: str) -> dict:
    """Check --splice-base and --splice-at against the input and the base take. Nothing is sent
    to the API here. Returns the parts needed for the request and for the join. The base is
    read with load_take, so a base that is itself a splice take is rebuilt in full."""
    n = text.count(args.splice_at)
    if n != 1:
        sys.exit(f"--splice-at text must occur exactly once in the input; it occurs {n} times")
    k = text.index(args.splice_at)
    if not text[:k].strip():
        sys.exit("--splice-at must come after some text")
    try:
        base_req = json.loads((args.splice_base / "raw" / "request.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        sys.exit(f"--splice-base {args.splice_base}: cannot read raw/request.json ({e})")
    base_text, base_pcm, base_alignment = load_take(args.splice_base)
    if not base_text.startswith(text[:k]) \
            or base_text[k:k + len(args.splice_at)] != args.splice_at:
        sys.exit(f"--splice-base {args.splice_base}: its text does not start with the input before "
                 f"--splice-at, or does not continue with {args.splice_at!r} at index {k}")
    if base_req.get("voice_id") != args.voice_id or base_req.get("model_id") != args.model:
        sys.exit(f"--splice-base {args.splice_base}: made with voice {base_req.get('voice_id')!r} "
                 f"and model {base_req.get('model_id')!r}, not {args.voice_id!r} and {args.model!r}")
    return {"k": k, "prefix": text[:k], "suffix": text[k:],
            "base": repo_relative(args.splice_base), "base_pcm": base_pcm,
            "base_alignment": base_alignment}


def _samples(pcm: bytes) -> array:
    """16-bit little-endian mono PCM as a list of ints."""
    a = array("h")
    a.frombytes(pcm)
    if sys.byteorder == "big":
        a.byteswap()
    return a


def _pcm(a: array) -> bytes:
    if sys.byteorder == "big":
        a = array("h", a)  # a copy, so the caller's array is not changed
        a.byteswap()
    return a.tobytes()


def pcm_lufs(pcm: bytes, sr: int) -> float:
    """Integrated loudness (EBU R128, ffmpeg ebur128) of 16-bit mono PCM."""
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "segment.wav"
        tts.write_wav(wav, pcm, sr=sr)
        err = tts._ffmpeg(["-i", str(wav), "-af", "ebur128", "-f", "null", "-"])
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def splice_join(base_pcm: bytes, base_alignment: dict, k: int, text: str,
                new_pcm: bytes, new_alignment: dict):
    """Join the base take up to the cut onto the re-voiced part. Returns (pcm, alignment, info).

    Both alignments are in raw time, before silence editing. The cut is the middle of the gap
    between the last non-whitespace character before index k and character k. The base is kept
    up to the cut and the new audio starts there, so the base words before index k keep their
    times. The new audio is gained to the base level (clamped) and faded in at the cut.
    """
    chars = base_alignment["characters"]
    starts = base_alignment["character_start_times_seconds"]
    ends = base_alignment["character_end_times_seconds"]
    if "".join(chars[:k]) != text[:k]:
        sys.exit("base alignment does not spell the input text before --splice-at")
    last = next((j for j in range(k - 1, -1, -1) if chars[j].strip()), None)
    if last is None:
        sys.exit("nothing before --splice-at to join onto")
    prev_end, next_start = ends[last], starts[k]
    t_cut = (prev_end + next_start) / 2
    cut = round(t_cut * SR)  # sample index of the cut in the base PCM

    head = _samples(base_pcm[:2 * cut])
    n_out = round(SPLICE_FADE_OUT * SR)
    if len(head) < n_out:
        sys.exit("base audio is too short for the splice")
    lo = max(0, round((t_cut - SPLICE_LOUD_WINDOW) * SR))
    base_tail_lufs = pcm_lufs(base_pcm[2 * lo:2 * cut], SR)
    new_lufs = pcm_lufs(new_pcm, SR)
    gain_db = max(-SPLICE_GAIN_MAX, min(SPLICE_GAIN_MAX, base_tail_lufs - new_lufs))

    for i in range(n_out):  # linear fade-out to silence at the cut
        j = len(head) - n_out + i
        head[j] = round(head[j] * (n_out - 1 - i) / n_out)
    tail = _samples(new_pcm)
    g = 10 ** (gain_db / 20)
    n_in = round(SPLICE_FADE_IN * SR)
    for i in range(len(tail)):  # gain, then linear fade-in from silence
        tail[i] = max(-32768, min(32767, round(tail[i] * g * min(1.0, i / n_in))))
    pcm = _pcm(head) + _pcm(tail)

    alignment = {
        "characters": list(chars[:k]) + list(new_alignment["characters"]),
        "character_start_times_seconds": [float(s) for s in starts[:k]]
            + [s + t_cut for s in new_alignment["character_start_times_seconds"]],
        "character_end_times_seconds": [min(float(e), t_cut) for e in ends[:k]]
            + [e + t_cut for e in new_alignment["character_end_times_seconds"]],
    }
    info = {"t_cut": round(t_cut, 4), "prev_end": round(prev_end, 4),
            "next_start": round(next_start, 4), "base_tail_lufs": round(base_tail_lufs, 2),
            "new_lufs": round(new_lufs, 2), "gain_db": round(gain_db, 3)}
    return pcm, alignment, info


def load_take(take: Path):
    """(full_text, pcm, alignment) of a take's raw (pre-edit) audio, read from take/raw/.

    A take made without splice mode holds all of it: text, audio and alignment. A take made
    with splice mode (raw/request.json has "splice_base") is rebuilt: its base is loaded the
    same way, then joined as splice mode joins it, with the same cut point. The cut and the
    gain must match the splice block in raw/combined_alignment.json (within 1e-3). Nothing is
    sent to the API and nothing is written.
    """
    raw = take / "raw"
    where = repo_relative(take)
    try:
        req = json.loads((raw / "request.json").read_text(encoding="utf-8"))
        doc = json.loads((raw / "alignment.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        sys.exit(f"{where}: cannot read raw/request.json and raw/alignment.json ({e})")
    if not isinstance(req.get("text"), str) or not isinstance(doc, dict) \
            or not isinstance(doc.get("alignment"), dict):
        sys.exit(f"{where}: raw/request.json has no text, or raw/alignment.json has no alignment")
    own_pcm = tts.decode_pcm(raw / "audio.mp3", sr=SR)
    if "splice_base" not in req:
        check_alignment(doc["alignment"], req["text"])
        return req["text"], own_pcm, doc["alignment"]

    prefix, splice_at = req.get("previous_text"), req.get("splice_at")
    if not isinstance(prefix, str) or not isinstance(splice_at, str) \
            or not req["text"].startswith(splice_at):
        sys.exit(f"{where}: raw/request.json needs a previous_text, and its text must start "
                 "with splice_at")
    base_text, base_pcm, base_alignment = load_take(REPO_ROOT / req["splice_base"])
    full_text = prefix + req["text"]
    k = len(prefix)
    pcm, alignment, info = splice_join(base_pcm, base_alignment, k, full_text,
                                       own_pcm, doc["alignment"])
    check_alignment(alignment, full_text)
    try:
        stored = json.loads((raw / "combined_alignment.json").read_text(encoding="utf-8"))["splice"]
    except (OSError, ValueError, KeyError, TypeError) as e:
        sys.exit(f"{where}: cannot read the splice block of raw/combined_alignment.json ({e})")
    for key in ("t_cut", "gain_db"):
        s = stored.get(key) if isinstance(stored, dict) else None
        if not isinstance(s, (int, float)) or abs(info[key] - s) > 1e-3:
            sys.exit(f"{where}: rebuilt {key} {info[key]} does not match the stored {s!r}")
    return full_text, pcm, alignment


def main() -> None:
    ap = argparse.ArgumentParser(description="Indonesian TTS with word timestamps (ElevenLabs).")
    ap.add_argument("input", type=Path, help="narration .txt or .json")
    ap.add_argument("--voice-id", required=True, help="ElevenLabs voice ID")
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--model", default="eleven_multilingual_v2", help="model_id")
    ap.add_argument("--stability", type=float, metavar="F", help="voice setting, sent only if given")
    ap.add_argument("--similarity", type=float, metavar="F",
                    help="voice setting, sent as similarity_boost, only if given")
    ap.add_argument("--style", type=float, metavar="F", help="voice setting, sent only if given")
    ap.add_argument("--speed", type=float, metavar="F", help="voice setting, sent only if given")
    ap.add_argument("--speaker-boost", action=argparse.BooleanOptionalAction, default=None,
                    help="voice setting use_speaker_boost, sent only if given")
    ap.add_argument("--seed", type=int, metavar="N", help="sent only if given")
    ap.add_argument("--language-code", metavar="CODE", help="sent only if given")
    ap.add_argument("--max-pause", type=float, default=None, metavar="SEC",
                    help="shorten silences between sentences to at most SEC seconds")
    ap.add_argument("--tail-pad", type=float, default=0.2, metavar="SEC",
                    help="silence kept after the last word (default 0.2)")
    ap.add_argument("--lead-keep", type=float, default=None, metavar="SEC",
                    help="trim silence before the first word, keeping SEC of it (off by default)")
    ap.add_argument("--force-api", action="store_true",
                    help="call the API even if raw/ holds this request")
    ap.add_argument("--splice-base", type=Path, metavar="DIR",
                    help="join the re-voiced part onto this existing take (DIR/raw/ must hold "
                         "request.json, alignment.json and audio.mp3)")
    ap.add_argument("--splice-at", metavar="TEXT",
                    help="where the re-voiced part starts in the input text (must occur once)")
    args = ap.parse_args()
    if (args.splice_base is None) != (args.splice_at is None):
        ap.error("--splice-base and --splice-at must be given together")

    key = api_key()
    text = tts.load_text(args.input)
    plan = splice_plan(args, text) if args.splice_base is not None else None
    api_text = plan["suffix"] if plan else text  # the text sent to the API
    req = build_request(args, api_text)
    if plan:
        req["previous_text"] = plan["prefix"]
        req["splice_base"] = plan["base"]  # raw/ only, see request_body
        req["splice_at"] = args.splice_at
    out = args.out_dir
    out.mkdir(parents=True, exist_ok=True)
    raw = out / "raw"

    cached = None if args.force_api else load_cache(raw, req)
    if cached:
        audio, doc = cached
        reused, before, after, used, source = True, None, None, 0, None
        print("raw/ matches this request: reusing it, no API call, 0 credits used",
              file=sys.stderr)
    else:
        check_usage_log()  # before any paid call
        print(f"calling ElevenLabs: {len(api_text)} characters, model {args.model}", file=sys.stderr)
        before = subscription(key)
        audio, doc, headers = tts_call(key, req)
        write_raw(raw, req, audio, doc)  # kept even if the checks below fail, so a retry costs nothing
        after, used, source = read_credits(key, before, header_credits(headers))
        log_usage(out, args, api_text, before, after, used, source, headers)
        reused = False
    check_alignment(doc["alignment"], api_text)

    with tempfile.TemporaryDirectory() as tmp:
        raw_mp3 = Path(tmp) / "raw.mp3"
        raw_mp3.write_bytes(audio)
        pcm = tts.decode_pcm(raw_mp3, sr=SR)
        alignment, splice = doc["alignment"], None
        if plan:
            pcm, alignment, info = splice_join(plan["base_pcm"], plan["base_alignment"], plan["k"],
                                               text, pcm, alignment)
            check_alignment(alignment, text)
            splice = {"base": plan["base"], "at": args.splice_at, **info}
            combined = {"alignment": alignment, "splice": splice}
            (raw / "combined_alignment.json").write_text(
                json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        raw_seconds = len(pcm) / 2 / SR

        words_raw = alignment_words(alignment)
        check_timing(words_raw, raw_seconds)
        sentences = tts.group_sentences(text, words_raw)
        pcm_out, cuts = tts.edit_timeline(pcm, sentences, args.max_pause, args.tail_pad,
                                          args.lead_keep, sr=SR)
        words, sents = tts.retime(sentences, cuts)

        wav = Path(tmp) / "edited.wav"
        tts.write_wav(wav, pcm_out, sr=SR)
        norm = normalize_to_mp3(wav, out / "vo.mp3")

    (out / "words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n",
                                    encoding="utf-8")
    (out / "sentences.json").write_text(json.dumps(sents, ensure_ascii=False, indent=2) + "\n",
                                        encoding="utf-8")

    summary = {
        "engine": "elevenlabs",
        "voice_id": args.voice_id,
        "model_id": args.model,
        "voice_settings": req["voice_settings"],
        "max_pause": args.max_pause,
        "lead_keep": args.lead_keep,
        "words": len(words),
        "sentences": len(sents),
        "raw_seconds": round(raw_seconds, 3),
        "removed_pause_seconds": round(sum(ce - cs for cs, ce in cuts), 3),
        "pauses_shortened": len(cuts),
        "vo_seconds": round(tts.duration_of(out / "vo.mp3"), 3),
        "last_word_end": words[-1]["end"],
        "integrated_lufs": round(norm["integrated_lufs"], 2),
        "true_peak_dbtp": round(norm["true_peak_dbtp"], 2),
        "limiter_db": round(norm["limiter_db"], 2),
        "gain_db": round(norm["gain_db"], 2),
        "encodes": norm["encodes"],
        "text_chars": len(api_text),
        "reused_raw": reused,
        "credits_used": used,
        "credits_source": source,
        "credits_remaining": None if reused or used is None
                             else after["character_limit"] - (before["character_count"] + used),
    }
    if splice is not None:
        summary["splice"] = splice
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
