# PRD-20: video-03 voice take (ElevenLabs Liam)

## Context
- Script: `research/video-03/script_v1.json` (PRD-19), 106 words, 653 characters when the scenes' `vo_text` are joined with one space. Scene word counts in order: 10, 24, 13, 21, 22, 16. Sentences: 11.
- The user approved one paid call of about 653 credits on 2026-10-28 ("ok lanjut"). Usage log before the call: 2,258 of 10,000 this period (`voice/elevenlabs_usage.csv`, last row 2072 + earlier; account not re-checked).
- Voice and settings as video-02 (PRD-10): Liam `TX3LPaxmHKxFdv7VOQHJ`, `eleven_multilingual_v2`, `--max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2`.
- Gates (video-02 `video.config.json`): hook 3.5 s, close 7.2 s, total 45 s, tail 0.25 s.
- The main agent cannot hear audio; the user judges the voice, including how "NEET" is pronounced.

## Goal
One full take in `voice/samples/video-03/el_liam/`, measured against the gates.

## Changes allowed
- `docs/prd/20-video03-voice-take.md` (this PRD).
- `voice/samples/video-03/narration_v1.txt`.
- `voice/samples/video-03/el_liam/**` (written by the script).
- `voice/elevenlabs_usage.csv` (one row appended by the script).

## Steps
1. Save this PRD verbatim.
2. Write `voice/samples/video-03/narration_v1.txt`: the six `vo_text` values of `research/video-03/script_v1.json` in scene order joined with one space, plus a trailing newline (python3 -I, `" ".join`). Print `wc -c` and the character count without the newline (expected 653).
3. `test -n "$ELEVENLABS_API_KEY" && echo set`. If not set, STOP.
4. Run once from the repo root:
   `python3 voice/tts_elevenlabs.py voice/samples/video-03/narration_v1.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/video-03/el_liam`
   Paste its full output. STOP on any error; do not retry.
5. `tail -1 voice/elevenlabs_usage.csv`.
6. Measurements (scripts in scratch, `python3 -I`):
   a. `ffprobe -v error -show_entries format=duration:stream=codec_name,sample_rate,channels -of compact voice/samples/video-03/el_liam/vo.mp3`
   b. `ffmpeg -hide_banner -nostats -i voice/samples/video-03/el_liam/vo.mp3 -af ebur128=peak=true -f null - 2>&1 | tail -15`
   c. Word check: normalise each words.json `text` and each whitespace token of the narration with `re.sub(r'\W','',t)` and drop empties; print `equal` or `DIFF` with both lengths and the first differing index and tokens.
   d. Entries in words.json (expected 106) and sentences.json (expected 11).
   e. Scene spans using the word counts 10, 24, 13, 21, 22, 16: per scene the first word start and last word end. Then hook = end of word 10 - start of word 1 (gate 3.5); total = end of last word + 0.25 (gate 45); close = total - start of the first word of scene 6, "Selamat" (gate 7.2). Two decimals, PASS or FAIL.
   f. Every gap between consecutive words longer than 0.30 s: both words and the gap.
   g. Start and end time of: "satu" (scene 1); "pelatihan", "dua" (first, in "dua ribu"), "sembilan" (first, "sembilan belas koma"), "lima" (first, "lima belas sampai") in scene 2; "malas" in scene 3; "lima" (first) and "dua" (first, "dua puluh tiga") in scene 4; "NEET", "Sulawesi", "dua" (first), "Bali", "lima" (first after "Bali") in scene 5; "Selamat", "sembilan" and "Yuk" in scene 6.
7. Wait 30 s, then the account check, printing two numbers only:
   `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -I -c 'import sys,json; d=json.load(sys.stdin); print(d["character_count"], d["character_limit"])'`
8. `git status --short --untracked-files=all`.

## Acceptance
- One paid call; cost from the usage row.
- 6c `equal`; 6d 106 and 11 (report the real numbers either way).
- Gates reported PASS or FAIL. Nothing changed to make a gate pass.
- git status: only this PRD, the narration, `voice/samples/video-03/el_liam/**`, and `M voice/elevenlabs_usage.csv`.

## Budget
1 paid call, about 653 credits. Network: api.elevenlabs.io only.

## Report
Paste verbatim: steps 2, 4, 5, all of 6, 7, 8. Say what failed or was not verified.

## Outcome (2026-10-28, measured)
- One paid call, 653 credits (usage row 2026-10-28T03:40:33Z). Account after: 2911 of 10000.
- `vo.mp3` 41.664 s, mono 48 kHz, -14.1 LUFS, true peak -2.0 dBFS. 106 words and 11 sentences; words equal the narration.
- Gates: hook 3.40 s (3.5) PASS; close 5.76 s (7.2) PASS; total 41.68 s (45) PASS. Re-measured by the main agent.
- Not verified: voice quality and the pronunciation of "NEET" (at 26.42 s); the user listens.
