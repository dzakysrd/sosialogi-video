# PRD-24: Reel A CTA re-voiced with a pause ("et er de en, er e")

## Context
- Take voice/samples/ep-reel-a/el_liam (PRD-23, commit 9befde5): CTA "Yuk, follow et er de en er e." The gap between "en" (end 47.826 s) and "er" (start 47.907 s) is 0.081 s.
- User (2026-10-30): the handle @RDNRE is read "et er de en" (space) "er e", i.e. a pause between "en" and "er". The reel is posted on @RDNRE; on screen the handle is written in capitals "@RDNRE".
- --max-pause only shortens pauses between sentences, not at commas, so a comma keeps the pause.

## Changes allowed
docs/prd/24-reel-a-cta-pause.md; research/electropower/reel-a/script_v4.json and script_v4.md (new); voice/samples/ep-reel-a/narration_v4.txt (new); voice/samples/ep-reel-a/el_liam_cta/ (new take dir); voice/elevenlabs_usage.csv (appended by the script). Nothing else.

## Steps
1. script_v4.json = copy of script_v3.json with only: "version" "v4"; "status" "v4 (2026-10-30): CTA read 'et er de en, er e' with a pause"; s7_cta vo_text "Yuk, follow et er de en, er e."; s7_cta caption_display {"et er de en, er e": "@RDNRE"}. script_v4.md: same layout as script_v3.md with a "Perubahan dari v3" line.
2. narration_v4.txt: " ".join of the v4 scenes' vo_text, one line, final newline. Print `diff voice/samples/ep-reel-a/narration_v3.txt voice/samples/ep-reel-a/narration_v4.txt` (must differ only by the comma after "en").
3. The one paid call (splice from the start of the CTA sentence; the base take stays untouched):
   python3 voice/tts_elevenlabs.py voice/samples/ep-reel-a/narration_v4.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/ep-reel-a/el_liam --splice-at "Yuk, follow" --out-dir voice/samples/ep-reel-a/el_liam_cta
4. Checks, print verbatim:
   a. ffprobe duration of the new vo.mp3; ebur128 loudness tail as in PRD-23.
   b. words.json count vs narration_v4 tokens.
   c. The last 9 words with start/end; the gap "en" -> "er" (must be clearly larger than 0.081 s; report the value); the gap after "Yuk".
   d. Confirm the first 106 words' start/end times equal the base take's (print max absolute difference).
   e. Last line of voice/elevenlabs_usage.csv.
   f. Leak check: `grep -rFHc "$ELEVENLABS_API_KEY" voice/samples/ep-reel-a docs/prd/24-reel-a-cta-pause.md research/electropower/reel-a voice/elevenlabs_usage.csv | grep -v ':0$'` prints nothing (if it prints, STOP without showing lines).

## Budget
One paid call, about 30 credits.

## Report
All step 2 and step 4 outputs verbatim, the script's console output (no key), `git status --short --untracked-files=all`, absolute path of the new vo.mp3.

## Outcome (2026-10-30, reviewed by the main agent)
- One paid call, 30 credits (usage 3807 of 10000). Take voice/samples/ep-reel-a/el_liam_cta: vo.mp3 48.216 s (ffprobe, checked by the main agent), 114 words, -14.2 LUFS, true peak -1.9 dBFS; the first 106 words are identical in time to the base take.
- Gap "en" -> "er" is now 0.267 s (was 0.081 s). Side effect: the comma pause after "Yuk" became 0.163 s (was 0.441 s), the same splice lesson as video-01.
- Total 48.2 s still over the 45 s gate; decision pending with the user. Audio sent to the user for listening.
