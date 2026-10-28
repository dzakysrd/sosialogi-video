# PRD-10: video-02 full voice take (ElevenLabs, Liam)

## Context
- The user approved one paid full take with the premade voice Liam on the free plan (2026-10-28 WIB).
- Account check by the main agent just before this task: tier free, character_count 1384, character_limit 10000, reset 2026-11-26 20:23 UTC.
- Narration: `voice/samples/video-02/narration_v1.txt`, 689 characters including the final newline (PRD-09). With `eleven_multilingual_v2`, each earlier call cost exactly the characters sent.
- Voice settings as video-01 v3 (`.claude/skills/data-explainer-video/references/elevenlabs.md`): voice ID `TX3LPaxmHKxFdv7VOQHJ`, model `eleven_multilingual_v2`, default voice settings, `--max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2`.
- Script: `research/video-02/script_v1.json`, 106 words in 6 scenes (9, 27, 10, 23, 21, 16 words) and 11 sentences.
- Gates to try (user: "coba aja, tapi jangan maksa"): hook <= 3.5 s, close <= 7.0 s, total <= 45 s, with a 0.25 s tail after the last word (video-01 v3 values). If a gate fails, report it; do not change anything.

## Goal
Make the full take `voice/samples/video-02/el_liam/` and measure it.

## Changes allowed
- Create `docs/prd/10-video02-voice-take.md` (this PRD, verbatim).
- Create `voice/samples/video-02/el_liam/` (written by the script: `vo.mp3`, `words.json`, `sentences.json`, `raw/`).
- `voice/elevenlabs_usage.csv`: the one row the script appends.
- Nothing else in the repo.

## Steps
1. Save this PRD verbatim.
2. `test -n "$ELEVENLABS_API_KEY" && echo set`. If not set, STOP.
3. Run once, from the repo root:
   `python3 voice/tts_elevenlabs.py voice/samples/video-02/narration_v1.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/video-02/el_liam`
   Paste its full output (it must not contain the key). STOP on any error.
4. `tail -1 voice/elevenlabs_usage.csv` (the new row).
5. Measurements (scripts in scratch, `python3 -I`):
   a. `ffprobe -v error -show_entries format=duration:stream=codec_name,sample_rate,channels -of compact voice/samples/video-02/el_liam/vo.mp3`
   b. `ffmpeg -hide_banner -nostats -i voice/samples/video-02/el_liam/vo.mp3 -af ebur128=peak=true -f null - 2>&1 | tail -15` (integrated loudness and true peak).
   c. Word check (prints `equal` or DIFF): `python3 -I -c "import json,re,sys; norm=lambda t: re.sub(r'\W','',t); w=[norm(x['text']) for x in json.load(open(sys.argv[1]))]; n=[t for t in (norm(x) for x in open(sys.argv[2],encoding='utf-8').read().split()) if t]; print('equal' if w==n else ('DIFF', len(w), len(n)))" voice/samples/video-02/el_liam/words.json voice/samples/video-02/narration_v1.txt`
   d. Number of entries in words.json (expected 106) and in sentences.json (expected 11).
   e. Scene spans from words.json, using the scene word counts 9, 27, 10, 23, 21, 16 in order: for each scene, the first word's start and the last word's end. Then:
      - hook = end of word 9 - start of word 1 (gate 3.5 s);
      - total = end of the last word + 0.25 (gate 45 s);
      - close = total - start of the first word of scene 6, "Langkah" (gate 7.0 s).
      Print each value with 2 decimals and PASS or FAIL.
   f. Every gap between consecutive words longer than 0.30 s: the two words and the gap length.
   g. The start time of these cue words (first occurrence after its scene starts): "satu" in scene 1; "delapan" and "sembilan" (first one) in scene 2; "dua" (the one in "dua per seribu") in scene 3; "Papua" and "sembilan" in scene 4; "empat" in scene 5; "Yuk" in scene 6.
6. Account check after the call (prints two numbers only): `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -I -c 'import sys,json; d=json.load(sys.stdin); print(d["character_count"], d["character_limit"])'`. Wait 30 s before it (the counter lags).
7. `git status --short --untracked-files=all`.

## Acceptance
- One paid call; its cost from the usage row.
- Step 5c prints `equal`; step 5d gives 106 and 11 (report the real numbers either way).
- Gates reported with PASS or FAIL. No file is changed to make a gate pass.
- git status shows only the PRD, `voice/samples/video-02/el_liam/**` and `M voice/elevenlabs_usage.csv`.

## Budget
One paid call, about 689 credits. No retries.

## Report
Paste verbatim: step 3 output, the usage row, every step 5 result, the step 6 numbers, the git status, and anything that failed or was not verified.

## Outcome (2026-10-28 WIB, measured)
- One paid call, 688 credits (the script counts the text without the final newline). Account after the call: 2072 of 10000 used.
- `voice/samples/video-02/el_liam/vo.mp3`: 42.096 s, mp3 48 kHz mono, -14.1 LUFS integrated, true peak -1.9 dBFS. 106 words and 11 sentences; the word texts equal the narration.
- Gates (from words.json, tail 0.25 s): hook 3.34 s (3.5) PASS, close 6.48 s (7.0) PASS, total 42.11 s (45) PASS.
- Pauses over 0.30 s: after "belas" 0.42 s, after "lima" (2025) 0.33 s, after "Artinya" 0.36 s, after "Pegunungan" 0.36 s, after "Yuk" 0.30 s.
- Re-measured by the main agent: duration, loudness, word and sentence counts, and the three gates.
- Not verified: the audio itself. The user judges pronunciation and quality by ear.
