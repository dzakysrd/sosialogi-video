# PRD-16: video-02 v2: clearer close line, splice, render

## Context
- The user found the close line "Langkah terakhir memang paling sulit." unclear and chose (2026-10-28 WIB) the replacement "Sisanya paling sulit dijangkau jaringan listrik." with on-screen text "PALING SULIT DIJANGKAU / JARINGAN LISTRIK". Basis in the source: Laporan Kinerja ESDM 2023, printed page 158, says the high non-PLN and LTSHE shares in Papua Tengah and Papua Pegunungan are caused by "kondisi geografis, sebaran penduduk, dan kondisi jaringan listrik eksisting".
- Splice limits (`voice/tts_elevenlabs.py` `splice_plan`): `--splice-at` text must occur once in the new narration and the base take must continue with that same text at the same index. "Sisanya" is not in the base, so the splice starts at the last shared sentence, "Lebih dari separuhnya" (index 513 in the new narration; 186 characters from there to the end). The user approved this (one paid call, about 186 credits). Earlier text keeps its times.
- Base take: `voice/samples/video-02/el_liam` (approved by the user). Account before: 2072 of 10000 credits used.
- Current build: `video-02/` at commit 928d3b3; `video.config.json` has `voice.variant` "el_liam" and `inputs.script` "../research/video-02/script_v1.json"; `tools/render.sh` writes `out/v1.mp4`.
- Gates: hook 3.5 s, close 7.0 s, total 45 s (close was 6.48 s in v1).

## Goal
A v2 of video-02 with the new close line: script v2, a spliced take, a build that passes the lint, and `video-02/out/v2.mp4`, measured. v1 files stay as they are.

## Changes allowed
- Create: `docs/prd/16-video02-close-v2.md` (this PRD), `research/video-02/script_v2.json`, `voice/samples/video-02/narration_v2.txt`, `voice/samples/video-02/el_liam_close2/` (written by the TTS script), `video-02/out/v2.mp4`.
- Modify: `voice/elevenlabs_usage.csv` (the one row the TTS script appends), `video-02/video.config.json`, `video-02/scenes.json` (s6 only), `video-02/tools/render.sh` (output path from the config), `video-02/components/sos.css` (only the size of the s6 close text, if needed to fit), and the generated `video-02/index.html`, `video-02/build/timeline.json`, `video-02/assets/vo/*`.
- Nothing else.

## Steps
1. Save this PRD verbatim.
2. `research/video-02/script_v2.json`: a copy of `script_v1.json` with only these changes: `"version": "v2"`; `status` set to "v2 (2026-10-28 WIB): close line changed by the user to 'Sisanya paling sulit dijangkau jaringan listrik.'; everything else as v1."; in scene `s6_close`: `vo_text` = "Sisanya paling sulit dijangkau jaringan listrik. Selamat Hari Listrik Nasional. Yuk, follow et Dzaky es er de."; `on_screen_text` = "PALING SULIT DIJANGKAU / JARINGAN LISTRIK -> at 'Selamat': + SELAMAT HARI LISTRIK NASIONAL -> final card at 'Yuk': CTA pill Follow @dzakysrd + sources line; caption shows @dzakysrd while 'et Dzaky es er de' is spoken"; `cue_words` = ["Sisanya", "Selamat", "Yuk", "follow"]; add `"claims": ["'paling sulit dijangkau jaringan listrik': LK 2023 printed page 158 (kondisi geografis, sebaran penduduk, kondisi jaringan listrik eksisting)"]`. Print a diff against v1 (`diff <(python3 -c ...) ...` or `diff -u`) showing only these changes.
3. `voice/samples/video-02/narration_v2.txt`: the six vo_text values joined with one space, plus a final newline (as `narration_v1.txt`). Check with Python: 107 words; the text before index 513 equals `narration_v1.txt` before index 513; "Lebih dari separuhnya" occurs once, at index 513; "Sisanya" occurs once.
4. `test -n "$ELEVENLABS_API_KEY" && echo set`, then run once from the repo root:
   `python3 voice/tts_elevenlabs.py voice/samples/video-02/narration_v2.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/video-02/el_liam --splice-at "Lebih dari separuhnya" --out-dir voice/samples/video-02/el_liam_close2`
   Paste its full output. STOP on any error. Then `tail -1 voice/elevenlabs_usage.csv`.
5. Take checks (scripts in scratch, `python3 -I`): ffprobe duration of `el_liam_close2/vo.mp3`; `ebur128=peak=true` integrated loudness and true peak; the word check (letters and digits) of `el_liam_close2/words.json` against `narration_v2.txt` (must print equal); words count (107) and sentences count (11); word start times before "Lebih" equal those of `el_liam/words.json` (print the largest difference); gates with scene word counts 9, 27, 10, 23, 21, 17 and tail 0.25 s: hook, close (total minus the start of "Sisanya"), total, each PASS or FAIL; gaps between words over 0.30 s in the re-voiced part. If a gate FAILS: STOP here, do not build or render, report.
6. Build config: in `video-02/video.config.json` set `voice.variant` to "el_liam_close2", `inputs.script` to "../research/video-02/script_v2.json", and add `"output": "out/v2.mp4"`. Make `tools/render.sh` read the output path from the config's `output` key (default `out/v1.mp4` if absent). In `scenes.json` s6: the close block's first cue becomes "Sisanya" and its two lines "PALING SULIT DIJANGKAU" / "JARINGAN LISTRIK"; keep "SELAMAT HARI LISTRIK NASIONAL" at "Selamat" and the final card at "Yuk". If the lines do not fit in x 65..940, reduce only the close text size.
7. `cd video-02 && node tools/build.mjs && node tools/lint.mjs`: paste the gates, scenes, numbers and the full lint output. The lint must pass. STOP if it does not and you cannot fix it within the allowed files without changing VO, data, gates or cues.
8. `bash video-02/tools/render.sh` (background if needed). Paste the last 10 lines.
9. Measurements on `video-02/out/v2.mp4`: ffprobe (`stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels`), `ebur128=peak=true` (tail 14), `ls -l`; PASS/FAIL for 1080x1920, 30/1, video within 0.1 s of the new timeline total, audio within 0.1 s of the video, -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP.
10. Frames from `out/v2.mp4` (ffmpeg `-ss`), into `<scratch>/frames/`, at: the "Lebih" cue + 0.5, the "dihitung" cue + 0.5, the "Sisanya" cue + 0.4, the middle of the close part, the "Selamat" cue + 0.6, the "Yuk" cue - 0.05, + 0.1 and + 1.0, and total - 0.3. Contact sheet with `python3 video-01/build/v3/sheet.py <scratch>/sheet.jpg 5 <frames in time order>`. Look at it and report: the new close text readable and inside the safe box; no number or text early; at most 3 text blocks at the card transition.
11. Account check after the call (30 s after it; prints two numbers only): `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -I -c 'import sys,json; d=json.load(sys.stdin); print(d["character_count"], d["character_limit"])'`.
12. `git status --short --untracked-files=all`.

STOP and report if: the splice call fails; the word check is not equal; a gate fails; the lint fails; a step-9 check fails.

## Acceptance
- One paid call; its cost from the usage row.
- Word check equal; earlier word times unchanged; gates PASS.
- Lint PASS; `out/v2.mp4` passes every step-9 check; contact sheet looked at.
- git status shows only the allowed files.

## Budget
One paid call, about 186 credits. No retries.

## Report
Paste verbatim: the script diff, the narration checks, the splice output and usage row, every step-5 result, the build and lint output, the render tail, every step-9 result, the frame list and sheet path with findings, the account numbers, and the git status. Say what was not verified (you cannot hear the audio).

## Outcome so far (2026-10-28 WIB, measured; paused)
- Script v2 and narration v2 written (107 words; text before index 513 equal to v1).
- One paid splice call from "Lebih dari separuhnya": 186 credits; account 2258 of 10000 used. Take `voice/samples/video-02/el_liam_close2`: 43.032 s, -14.1 LUFS, true peak -2.0 dBFS; word check equal; word times before "Lebih" identical to `el_liam`; splice cut 34.586 s, gain 0.3 dB.
- Gates: hook 3.344 s PASS, total 43.042 s PASS, close 7.164 s FAIL (limit 7.0). Re-computed by the main agent.
- Stopped at step 5 as the PRD requires. Steps 6-12 (config, build, lint, render v2) not run. Decision pending with the user: raise the close limit, shorten the close line (another paid splice), or keep v1.

## Decision (2026-10-28 WIB, user)
- `close_max_s` raised from 7.0 to 7.2 s for video-02 (close 7.164 s with take `el_liam_close2`). Steps 6-12 continue.

## Outcome (2026-10-28 WIB, measured)
- Config: `close_max_s` 7.2 (user), voice `el_liam_close2`, script v2, output `out/v2.mp4`; `render.sh` reads the output path from the config. s6 close text "PALING SULIT DIJANGKAU / JARINGAN LISTRIK"; the first lint failed check h (close text out to x 1061), so `.close-line` went from 110 px to 96 px as step 6 allows; then lint PASS, 0 problems.
- Gates: hook 3.344 s, close 7.164 s (7.2), total 43.042 s.
- `video-02/out/v2.mp4`: 1080x1920, 30/1, 1292 frames, video 43.067 s, audio 43.072 s, -14.0 LUFS, true peak -4.2 dBFS, 4038179 bytes.
- Re-measured by the main agent: ffprobe and ebur128 on the MP4, the config and CSS diff, and the 11-frame contact sheet of the close (new text inside the safe box; card transition clean).
- Not verified: the splice seam and the new line by ear (the user listens). The current config and CSS rebuild v2; v1 stays in `out/v1.mp4` and in commit 928d3b3.
