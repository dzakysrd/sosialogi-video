# PRD-21: video-03 close line B (splice)

## Context
- Take `voice/samples/video-03/el_liam` (PRD-20): 106 words, close 5.76 s, total 41.68 s. The user found the jump from the Bali figure straight to "Selamat Hari Sumpah Pemuda" abrupt and chose option B on 2026-10-28: "Itu PR pemuda hari ini. Selamat Hari Sumpah Pemuda ke sembilan puluh delapan. Yuk, follow et Dzaky es er de." The user said the rest of the take is fine ("sisanya udah ok").
- The main agent estimated the close at about 7.3 s, over the 7.2 s gate. The gate is the user's to change; this PRD only measures and stops if it fails.
- `voice/tts_elevenlabs.py` splice mode needs `--splice-at` text that occurs once in the new input and continues at the same index in the base take. "Terendah Bali" meets that (it is in scene 5, just before the changed text), so the take is re-voiced from "Terendah Bali" on.
- "Itu PR pemuda hari ini." is an editorial line by the user, not a data claim.

## Goal
`research/video-03/script_v2.json`, `voice/samples/video-03/narration_v2.txt` and take `voice/samples/video-03/el_liam_close2`, measured against the gates.

## Changes allowed
- `docs/prd/21-video03-close-b.md` (this PRD).
- `research/video-03/script_v2.json`, `voice/samples/video-03/narration_v2.txt`.
- `voice/samples/video-03/el_liam_close2/**` (written by the script), one row appended to `voice/elevenlabs_usage.csv`.

## Steps
1. Save this PRD verbatim.
2. `research/video-03/script_v2.json`: a copy of `script_v1.json` with only these changes: `"version": "v2"`; `"status": "v2 (2026-10-28): close line changed by the user (option B); everything else as v1."`; in `s6_close`: `vo_text` = "Itu PR pemuda hari ini. Selamat Hari Sumpah Pemuda ke sembilan puluh delapan. Yuk, follow et Dzaky es er de."; `on_screen_text` = "ITU PR PEMUDA HARI INI -> at 'Selamat': SELAMAT HARI SUMPAH PEMUDA KE-98 -> final card at 'Yuk': CTA pill Follow @dzakysrd + sources line; caption shows @dzakysrd while 'et Dzaky es er de' is spoken"; `cue_words` = ["Itu PR", "Selamat", "sembilan puluh delapan", "Yuk", "follow"]; add `"claims": ["'Itu PR pemuda hari ini': editorial line chosen by the user, not a data claim"]`. Keep `numbers` and `caption_display`. Same formatting as v1 (2-space indent, trailing newline). Print `diff -u` of v1 and v2.
3. `voice/samples/video-03/narration_v2.txt`: the six vo_text of v2 joined with one space plus a newline. Python checks, printed: 110 words; no digits; "Terendah Bali" occurs once in v2 and once in `narration_v1.txt` at the same index, and the two files are identical before that index; every v2 `cue_words` entry and `numbers[].spoken` occurs in its scene's vo_text; character count of the text from "Terendah Bali" to the end (without newline).
4. `test -n "$ELEVENLABS_API_KEY" && echo set`, then run once from the repo root:
   `python3 voice/tts_elevenlabs.py voice/samples/video-03/narration_v2.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/video-03/el_liam --splice-at "Terendah Bali" --out-dir voice/samples/video-03/el_liam_close2`
   Paste its full output. STOP on any error. Then `tail -1 voice/elevenlabs_usage.csv`.
5. Take checks (scripts in scratch, `python3 -I`):
   a. ffprobe duration of `el_liam_close2/vo.mp3`; `ebur128=peak=true` integrated loudness and true peak (tail 15).
   b. Word check against `narration_v2.txt` (normalise with `re.sub(r'\W','',t)`): equal or DIFF. Words (110) and sentences (12).
   c. Word start times before "Terendah" equal those of `el_liam/words.json`: print the largest difference.
   d. Gates with scene word counts 10, 24, 13, 21, 22, 20 and tail 0.25 s: hook = end of word 10 - start of word 1 (3.5); close = total - start of the first word of scene 6, "Itu" (7.2); total = end of last word + 0.25 (45). Two decimals, PASS or FAIL (PASS if <= gate).
   e. Gaps over 0.30 s from "Terendah" on: both words and the gap. The gap before "Yuk" and between "Yuk" and "follow".
   f. Start and end of "Terendah", "Bali", "lima" (after Bali), "Itu", "Selamat", "sembilan" (scene 6), "Yuk".
6. Copy `el_liam_close2/vo.mp3` to the scratch dir as `video03_el_liam_close2.mp3` (for the user to listen).
7. Wait 30 s, then the account check (prints two numbers only): `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -I -c 'import sys,json; d=json.load(sys.stdin); print(d["character_count"], d["character_limit"])'`.
8. `git status --short --untracked-files=all`.

If a gate fails: report it; do not change any text, setting or gate.

## Acceptance
- One paid call; cost from the usage row.
- 5b equal, 110 and 12; 5c largest difference 0.000 (report the real number).
- Gates reported PASS or FAIL.
- git status: only this PRD, `script_v2.json`, `narration_v2.txt`, `el_liam_close2/**`, `M voice/elevenlabs_usage.csv`.

## Budget
1 paid call, about 150 credits. Network: api.elevenlabs.io only.

## Report
Paste verbatim: steps 2, 3, 4, all of 5, 7, 8.

## Outcome (2026-10-28, measured)
- One paid call, 151 credits (usage row 2026-10-28T04:00:22Z; header says 6938 remaining).
- `el_liam_close2/vo.mp3` 43.08 s, -14.1 LUFS, true peak -1.9 dBFS; 110 words, 12 sentences, equal to the narration; word starts before "Terendah" identical to `el_liam` (0.000 s).
- Gates: hook 3.40 s PASS; total 43.08 s PASS; close 7.41 s against 7.2 s FAIL. Stopped; the gate decision is the user's. Re-measured by the main agent.
