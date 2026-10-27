# PRD-01: voice/tts_elevenlabs.py (ElevenLabs voiceover with word timestamps)

## Goal
A drop-in alternative to voice/tts.py that uses ElevenLabs instead of edge-tts. Its out-dir must contain vo.mp3, words.json and sentences.json in exactly the format voice/tts.py writes, so video-01/tools/build_v3.mjs and lint_v3.mjs consume them unchanged.

## Read first
- voice/tts.py (whole file; you will reuse its functions).
- video-01/tools/lint_v3.mjs lines 31-35: the script's word count is the whitespace-token count of vo_text and must equal len(words.json).
- voice/samples/v3/v2/words.json and sentences.json: the target format. Word texts have no trailing punctuation ("tertinggi", "follow") but keep internal hyphens ("rata-ratanya", "UMP-nya").

## Hard rules
- API key: os.environ["ELEVENLABS_API_KEY"]. If missing, exit with a clear message. NEVER print, log, write to disk, or put in an error message the key or the request headers. Never use `set -x`.
- Speech is never stretched or sped up in post; only silence is cut (same as tts.py).
- Do not invent API behaviour. Where this PRD says "verify", check against the real response and report what you saw.

## Change 1: voice/tts.py (minimal, no behaviour change)
1. Move `import edge_tts` from the module top into `_synthesize()`, so `import tts` works without edge_tts installed (it is NOT installed in this container).
2. Add a keyword parameter `sr: int = SR` to decode_pcm, _slice, edit_timeline and write_wav, and pass it through wherever they call each other. Defaults keep today's behaviour exactly. Change nothing else.

## Change 2: new file voice/tts_elevenlabs.py
Match tts.py's style: module docstring with usage, argparse, small functions, same comment density.

CLI:
  python3 voice/tts_elevenlabs.py INPUT --voice-id ID --out-dir DIR
    [--model eleven_multilingual_v2] [--stability F] [--similarity F] [--style F] [--speed F]
    [--speaker-boost | --no-speaker-boost] [--seed N] [--language-code CODE]
    [--max-pause SEC] [--tail-pad SEC (default 0.2)] [--lead-keep SEC] [--force-api]
INPUT: .txt or .json, read with tts.load_text.
Import helpers from tts.py (sys.path insert of the script's own folder, then `import tts`).

Request:
- POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128
- JSON body: {"text", "model_id"} plus "voice_settings" containing ONLY the settings the user passed (stability, similarity_boost, style, speed, use_speaker_boost), plus "seed" and "language_code" only if passed.
- Use `requests` (it honours HTTPS_PROXY and REQUESTS_CA_BUNDLE, both set here). Timeout 120 s. On non-2xx: exit with the status code and the response body (the body never contains the key).
- Expected response (verify): JSON with audio_base64, alignment {characters, character_start_times_seconds, character_end_times_seconds}, normalized_alignment. Use `alignment` (it should match the input text). If alignment is missing, or "".join(characters) != text, exit with an error naming the first mismatching index. Do not guess or repair.

Raw cache (saves credits):
- After a successful call write DIR/raw/request.json (the full request: text, voice_id, model_id, output_format, voice_settings, seed, language_code; never the key), DIR/raw/audio.mp3, DIR/raw/alignment.json (alignment and normalized_alignment).
- On a later run, if DIR/raw/request.json equals the current request, reuse the raw files and make NO API call (print that 0 credits were used). --force-api always calls the API. --max-pause, --tail-pad and --lead-keep are post-processing only and are NOT part of request.json.
- Put the request-building in one function (e.g. build_request(args, text) -> dict) so a test can create matching fixtures.

Alignment to words:
- Walk the characters; a token is a maximal run of non-whitespace characters.
- Keep tokens that contain a \w character (tts.WORD_RE).
- Word text = token with leading and trailing characters that are not letters or digits removed (internal hyphens stay).
- start = start time of the first kept character, end = end time of the last kept character.
- Then follow tts.main exactly: tts.group_sentences, tts.edit_timeline(..., sr=44100), tts.retime, tts.write_wav(..., sr=44100), and the TP_TARGETS loop with tts.loudnorm_to_mp3 and tts.measure_loudness (target -14 LUFS, true peak <= -1 dBTP). Decode raw audio with tts.decode_pcm(path, sr=44100).
- Before writing outputs, exit non-zero if: any word start < previous word start, any end < start, or last word end > raw audio duration + 0.05 s.

Credit tracking (only when the API is actually called):
- GET https://api.elevenlabs.io/v1/user/subscription before and after the TTS call; credits_used = after.character_count - before.character_count. If the delta is 0, wait 2 s and read once more.
- Also record any TTS response header whose lowercase name contains "character" or "cost" (name and value). Never record auth headers.
- Append one row to voice/elevenlabs_usage.csv (create it with a header row if missing): utc_time,out_dir,voice_id,model_id,text_chars,credits_before,credits_after,credits_used,cost_headers
- Reused-raw runs append nothing.

Printed summary (JSON, like tts.py): engine "elevenlabs", voice_id, model_id, voice_settings, max_pause, lead_keep, words, sentences, raw_seconds, removed_pause_seconds, pauses_shortened, vo_seconds, last_word_end, integrated_lufs, true_peak_dbtp, tp_target_used, text_chars, reused_raw (bool), credits_used (0 when reused), credits_remaining (character_limit - character_count, or null when reused).

## Acceptance (run all, report results verbatim)
A1. `cd /home/user/sosialogi-video/voice && python3 -c "import tts; print('ok')"` prints ok without edge_tts installed.
A2. `git diff voice/tts.py` shows only the lazy import and the sr parameters.
A3. Offline test, no API, no credits: write a test script in S (not in the repo) that imports tts_elevenlabs, builds the request for the text "UMP Jakarta tertinggi. Tapi rata-ratanya di bawah UMP-nya, yuk." via build_request, writes S/offline/raw/{request.json, alignment.json, audio.mp3} by hand (synthetic per-character times with a 0.6 s gap after "tertinggi."; audio = ffmpeg lavfi sine 220 Hz of matching length), then runs tts_elevenlabs.py on that out-dir with --max-pause 0.16 (and a fake ELEVENLABS_API_KEY=dummy so no real key is involved). Check and report: words.json texts == ["UMP","Jakarta","tertinggi","Tapi","rata-ratanya","di","bawah","UMP-nya","yuk"]; 2 sentences; the gap between "tertinggi" end and "Tapi" start is 0.16 +/- 0.01 s; summary says reused_raw true and credits_used 0; integrated LUFS -14 +/- 0.5 and true peak <= -1.0 (measure the output with ffmpeg ebur128 yourself, independently of the script).
A4. One real smoke call (about 54 credits; do NOT make more than 2 real TTS calls in total for this task, and never with long text): pick any voice with category "premade" from GET /v2/voices; run with text "UMP Jakarta tertinggi. Tapi rata-ratanya di bawah UMP." (write it to S/smoke.txt), --model eleven_multilingual_v2, --max-pause 0.16 --lead-keep 0.05, --out-dir S/smoke. Report the printed summary, the first 2 entries of the real alignment (characters + times), the cost headers seen, and the elevenlabs_usage.csv row. Then run the identical command again: it must reuse raw, make no API call, and subscription character_count must be unchanged (check it).
A5. Key leak check: `grep -rF -c "$ELEVENLABS_API_KEY" voice/ docs/ S/ | grep -v ':0$'` must print nothing. Report the output (do not print the key).
A6. `git status --short` output.

FINAL MESSAGE: list the files changed, paste `git diff voice/tts.py`, and the A1-A6 results verbatim. Clearly say anything you could not verify or any deviation from this PRD and why.

## Revision 1 (after review of the first smoke run)
Finding: the subscription counter lags. On the smoke call it still read 0 two seconds after the call, while the API's own `character-cost` response header said 54, and a later read showed 54. So the logged credits_used of 0 was wrong.
1. credits_used comes from the `character-cost` response header (case-insensitive name, integer value) when present. Fallback when it is absent or not an integer: the subscription delta, reading the subscription every 3 s for up to 30 s until it changes. The summary gains "credits_source": "character-cost header" | "subscription delta" | "unknown" (unknown = no header and the counter never moved; then credits_used is null).
2. credits_remaining = character_limit - (subscription_before + credits_used), or null when credits_used is null.
3. voice/elevenlabs_usage.csv columns become: utc_time,out_dir,voice_id,model_id,text_chars,credits_used,credits_source,subscription_before,subscription_after_read,cost_headers. subscription_after_read is the value actually read after the call (it may lag). out_dir is written relative to the repo root when it is inside the repo, otherwise absolute.
4. The POST body omits "voice_settings" entirely when no setting was passed, so the voice's own defaults apply. raw/request.json is unchanged (it may still hold "voice_settings": {}), so existing caches stay valid.
5. The existing smoke row is rewritten in the new columns from facts already measured: credits_used 54, credits_source "character-cost header", subscription_before 0, subscription_after_read 0, cost_headers "character-cost=54". No new call is made for this.

Revision 2 (PRD-03a): loudness now uses gain + 192 kHz limiter at -2 dBFS before MP3 encoding, target -14 +/- 0.3 LUFS, true peak <= -1.5 dBTP; tts.py is unchanged.

Revision 3 (PRD-04a): splice mode. --splice-base DIR --splice-at TEXT re-voices only the input from TEXT on (TEXT must occur exactly once) and sends the text before it as previous_text, so the new speech follows on from it. The new audio is level-matched to the base audio in DIR (gain clamped to +/-3 dB) and joined at the middle of the silence before TEXT, so the words before TEXT keep their base times; the joined alignment is kept in raw/combined_alignment.json. Without these options the script behaves as before.

Revision 4 (PRD-04c): a spliced take can be a splice base; its raw audio and alignment are rebuilt from its splice chain, with no stored copy.
