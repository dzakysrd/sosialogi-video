#!/usr/bin/env python3
"""Indonesian voiceover with per-word timestamps, built on edge-tts.

Usage:
  python3 tts.py narration.txt --out-dir out/
  python3 tts.py narration.json --voice id-ID-GadisNeural --rate +5% --pitch +2Hz --max-pause 0.25

Input: a .txt file (plain text) or a .json file holding a string, a list of
strings, or {"text": "..."}.

Writes to --out-dir:
  vo.mp3          narration, loudness-normalised to -14 LUFS, true peak <= -1 dBTP
  words.json      [{"text", "start", "end"}, ...]  every word, seconds
  sentences.json  [{"text", "start", "end"}, ...]  every sentence, seconds

Timing comes from edge-tts WordBoundary events (offset/duration in 100-ns ticks).
--max-pause shortens silence between sentences to at most that many seconds by
cutting it out of the PCM (speech is never stretched or sped up) and shifts the
word times to match. Silence after the last word is trimmed to --tail-pad.
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import edge_tts

SR = 24000  # edge-tts MP3 is 24 kHz mono; decode to this rate
TICKS_PER_SEC = 10_000_000
LOUD_I, LOUD_LRA = -14.0, 11.0
TP_TARGETS = (-1.0, -1.5)  # -1.5 is only tried if MP3 encoding pushes true peak above -1.0
WORD_RE = re.compile(r"\w")


def load_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        data = json.loads(raw)
        if isinstance(data, dict):
            data = data.get("text")
        if isinstance(data, list):
            data = " ".join(str(x) for x in data)
        if not isinstance(data, str):
            sys.exit('JSON input must be a string, a list of strings, or {"text": "..."}')
        raw = data
    text = " ".join(raw.split())
    if not text:
        sys.exit("narration is empty")
    return text


async def _synthesize(text: str, voice: str, rate: str, pitch: str, proxy: str | None):
    comm = edge_tts.Communicate(
        text, voice, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=proxy
    )
    audio = bytearray()
    words = []
    async for msg in comm.stream():
        if msg["type"] == "audio":
            audio += msg["data"]
        elif msg["type"] == "WordBoundary":
            words.append(
                {
                    "text": msg["text"],
                    "start": msg["offset"] / TICKS_PER_SEC,
                    "end": (msg["offset"] + msg["duration"]) / TICKS_PER_SEC,
                }
            )
    if not words:
        sys.exit("edge-tts returned no WordBoundary events")
    return bytes(audio), words


def _ffmpeg(args: list[str]) -> str:
    r = subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-nostats", *args],
        check=True, capture_output=True, text=True,
    )
    return r.stderr


def decode_pcm(mp3: Path) -> bytes:
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(SR),
         "-f", "s16le", "-"],
        check=True, capture_output=True,
    )
    return r.stdout


def duration_of(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def group_sentences(text: str, words: list[dict]) -> list[dict]:
    """Split the source text into sentences and assign the TTS words to them in order."""
    pieces = [p for p in re.split(r"(?<=[.!?])\s+", text) if p]
    counts = [sum(1 for t in p.split() if WORD_RE.search(t)) for p in pieces]
    if sum(counts) != len(words):
        sys.exit(
            f"word count mismatch: text has {sum(counts)} words but TTS returned "
            f"{len(words)}. Check the text for digits or symbols the voice reads differently."
        )
    sentences: list[dict] = []
    pending = ""
    i = 0
    for piece, n in zip(pieces, counts):
        if n == 0:  # punctuation-only fragment: attach to a neighbour
            pending = (pending + " " + piece).strip()
            continue
        sentences.append({"text": (pending + " " + piece).strip(), "words": words[i:i + n]})
        pending = ""
        i += n
    if pending and sentences:
        sentences[-1]["text"] += " " + pending
    return sentences


def _slice(pcm: bytes, a: float, b: float) -> bytes:
    lo = max(0, round(a * SR)) * 2
    hi = max(lo, round(b * SR) * 2)
    return pcm[lo:hi]


def edit_timeline(pcm: bytes, sentences: list[dict], max_pause: float | None,
                  tail_pad: float, lead_keep: float | None = None):
    """Remove over-long inter-sentence silence and trailing silence.

    Returns (new_pcm, cuts) where cuts is a list of removed (start, end) spans
    in original seconds. Each gap longer than max_pause keeps max_pause/2 of
    silence on each side of the removed span, so the new gap is exactly max_pause.
    """
    dur = len(pcm) / 2 / SR
    cuts: list[tuple[float, float]] = []
    if lead_keep is not None:
        first = sentences[0]["words"][0]["start"]
        if first > lead_keep:
            cuts.append((0.0, first - lead_keep))  # silence before the first word
    if max_pause is not None:
        half = max_pause / 2
        for a, b in zip(sentences, sentences[1:]):
            gap_start = a["words"][-1]["end"]
            gap_end = b["words"][0]["start"]
            if gap_end - gap_start > max_pause:
                cuts.append((gap_start + half, gap_end - half))
    keep_until = min(dur, sentences[-1]["words"][-1]["end"] + tail_pad)

    segments, pos = [], 0.0
    for cs, ce in cuts:
        segments.append((pos, cs))
        pos = ce
    segments.append((pos, keep_until))
    new_pcm = b"".join(_slice(pcm, a, b) for a, b in segments)
    return new_pcm, cuts


def _shift(t: float, cuts: list[tuple[float, float]]) -> float:
    return t - sum(ce - cs for cs, ce in cuts if ce <= t)


def retime(sentences: list[dict], cuts: list[tuple[float, float]]):
    words_out, sents_out = [], []
    for s in sentences:
        ws = [
            {
                "text": w["text"],
                "start": round(_shift(w["start"], cuts), 3),
                "end": round(_shift(w["end"], cuts), 3),
            }
            for w in s["words"]
        ]
        words_out += ws
        sents_out.append({"text": s["text"], "start": ws[0]["start"], "end": ws[-1]["end"]})
    return words_out, sents_out


def write_wav(path: Path, pcm: bytes) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)


def loudnorm_to_mp3(wav: Path, out_mp3: Path, tp: float) -> dict:
    """Two-pass ffmpeg loudnorm: measure, then apply linearly and encode to MP3."""
    base = f"I={LOUD_I}:TP={tp}:LRA={LOUD_LRA}"
    err = _ffmpeg(["-i", str(wav), "-af", f"loudnorm={base}:print_format=json",
                   "-f", "null", "-"])
    m = json.loads(re.findall(r"\{[^{}]*\}", err)[-1])
    chain = (
        f"loudnorm={base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true:print_format=summary"
    )
    # 128 kbps measurably shifts the loudness (about -0.4 LU); 256 kbps does not.
    _ffmpeg(["-i", str(wav), "-af", chain, "-c:a", "libmp3lame", "-b:a", "256k",
             str(out_mp3)])
    return m


def measure_loudness(path: Path) -> tuple[float, float]:
    """Integrated loudness (EBU R128 meter) and true peak of a finished file.

    The integrated value comes from ebur128, the standard meter. loudnorm's own
    input_i reads about 0.2 LU differently on the same file, so it is not used here.
    The true peak uses loudnorm's two-decimal reading, which matches ebur128.
    """
    err = _ffmpeg(["-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    integrated = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
    err = _ffmpeg(["-i", str(path), "-af", f"loudnorm=I={LOUD_I}:TP=-1.0:LRA={LOUD_LRA}:print_format=json",
                   "-f", "null", "-"])
    m = json.loads(re.findall(r"\{[^{}]*\}", err)[-1])
    return integrated, float(m["input_tp"])


def main() -> None:
    ap = argparse.ArgumentParser(description="Indonesian TTS with word timestamps (edge-tts).")
    ap.add_argument("input", type=Path, help="narration .txt or .json")
    ap.add_argument("--voice", default="id-ID-ArdiNeural")
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--pitch", default="+0Hz", metavar="HZ",
                    help="edge-tts pitch, e.g. +2Hz or -4Hz (default +0Hz)")
    ap.add_argument("--out-dir", type=Path, default=Path("."))
    ap.add_argument("--max-pause", type=float, default=None, metavar="SEC",
                    help="shorten silences between sentences to at most SEC seconds")
    ap.add_argument("--tail-pad", type=float, default=0.2, metavar="SEC",
                    help="silence kept after the last word (default 0.2)")
    ap.add_argument("--lead-keep", type=float, default=None, metavar="SEC",
                    help="trim silence before the first word, keeping SEC of it (off by default)")
    args = ap.parse_args()

    text = load_text(args.input)
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    mp3_raw, words_raw = asyncio.run(_synthesize(text, args.voice, args.rate, args.pitch, proxy))
    words_raw = [w for w in words_raw if WORD_RE.search(w["text"])]

    out = args.out_dir
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        raw_mp3 = Path(tmp) / "raw.mp3"
        raw_mp3.write_bytes(mp3_raw)
        pcm = decode_pcm(raw_mp3)
        raw_seconds = len(pcm) / 2 / SR

        sentences = group_sentences(text, words_raw)
        pcm_out, cuts = edit_timeline(pcm, sentences, args.max_pause, args.tail_pad, args.lead_keep)
        words, sents = retime(sentences, cuts)

        wav = Path(tmp) / "edited.wav"
        write_wav(wav, pcm_out)
        tp_used = None
        for tp in TP_TARGETS:
            loudnorm_to_mp3(wav, out / "vo.mp3", tp)
            i_lufs, tp_db = measure_loudness(out / "vo.mp3")
            tp_used = tp
            if tp_db <= -1.0:
                break

    (out / "words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n",
                                    encoding="utf-8")
    (out / "sentences.json").write_text(json.dumps(sents, ensure_ascii=False, indent=2) + "\n",
                                        encoding="utf-8")

    summary = {
        "voice": args.voice,
        "rate": args.rate,
        "pitch": args.pitch,
        "max_pause": args.max_pause,
        "lead_keep": args.lead_keep,
        "words": len(words),
        "sentences": len(sents),
        "raw_seconds": round(raw_seconds, 3),
        "removed_pause_seconds": round(sum(ce - cs for cs, ce in cuts), 3),
        "pauses_shortened": len(cuts),
        "vo_seconds": round(duration_of(out / "vo.mp3"), 3),
        "last_word_end": words[-1]["end"],
        "integrated_lufs": round(i_lufs, 2),
        "true_peak_dbtp": round(tp_db, 2),
        "tp_target_used": tp_used,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
