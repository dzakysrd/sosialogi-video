# PRD-23: video-03 layout fixes and first render

## Context
- PRD-22: `video-03` builds and `node tools/lint.mjs` passes. The main agent reviewed the contact sheet (`scratchpad/prd22/sheet.jpg`). One layout problem: in s5 the row label "SULAWESI UTARA" (`.pair-label`, 56 px, in `.pair-head` with the 160 px value) nearly touches "29,52%". The HTML `<title>` in `video-03/src/template.html` still says "Rasio elektrifikasi". `tools/render.sh` header comment says video-02.
- `tools/render.sh` runs build, lint, the HyperFrames render and a two-pass loudnorm; output path from `video.config.json` (`out/v1.mp4`). It took about 1.5-2.5 minutes before.

## Goal
Fix the layout issues and render `video-03/out/v1.mp4`, measured.

## Changes allowed
- `docs/prd/23-video03-render.md` (this PRD).
- `video-03/components/sos.css`, `video-03/src/template.html` (title only), `video-03/tools/render.sh` (header comment only), and the build outputs (`index.html`, `build/timeline.json`, `assets/vo/*`), `video-03/out/v1.mp4`, `video-03/build/render/*` (raw render and logs).
- Nothing else. No text, cue, number, gate or data change.

## Steps
1. Save this PRD verbatim.
2. `sos.css`: make a row label sit on its own line above the bar row's value when the row has a label, or otherwise guarantee at least 40 px between the label's right edge and the value's left edge for the longest label ("SULAWESI UTARA") — your choice, report which. Keep the year rows of s2 and s4 looking as now. `template.html`: `<title>` becomes "NEET anak muda". `render.sh`: header comment says video-03.
3. `cd video-03 && node tools/build.mjs && node tools/lint.mjs`: lint must PASS. Paste the lint summary. Measure the s5 gap: in a scratch copy or via the snapshot, report how you checked the 40 px (or that the label is on its own line).
4. `bash video-03/tools/render.sh > video-03/build/render/v1_render.log 2>&1` (run in the background if needed; wait for it). Paste the last 15 lines of the log.
5. Measurements on `video-03/out/v1.mp4`: `ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels -of compact`; `ffmpeg -hide_banner -nostats -i video-03/out/v1.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -14`; `ls -l`. PASS/FAIL for: 1080x1920; 30/1; video duration within 0.1 s of 43.084; audio within 0.1 s of video; -14 +/- 0.5 LUFS; true peak <= -1.0 dBTP.
6. Frames from the MP4 (`ffmpeg -ss T -i video-03/out/v1.mp4 -frames:v 1`) into scratch at: 0.3, 1.06, 6.42, 8.37, 11.33, 13.5, 15.3, 19.7, 23.43, 26.5, 30.54, 34.39, 36.18, 39.61, 41.57, 42.78. Contact sheet: `python3 video-01/build/v3/sheet.py <scratch>/sheet.jpg 4 <frames in time order>` from the repo root. Report its path.
7. `git status --short --untracked-files=all` (check that `build/render/raw.mp4` and other render outputs are git-ignored or listed; report which).
8. Report.

## Acceptance
Lint PASS; every step-5 check PASS; contact sheet exists; git status only allowed files.

## Budget
0 paid calls. Network: npm registry for `npx hyperframes@0.8.206` only.

## Report
Paste verbatim: the sos.css diff, lint summary, the s5 gap check, render log tail, step 5 output with PASS/FAIL, sheet path, git status.

## Outcome (2026-10-28, measured)
- `.pair-label` 56 -> 50 px (gap to the value about 44 px, measured on a scratch page). `<title>` and the render.sh header updated.
- `video-03/out/v1.mp4`: 1080x1920, 30 fps, 1293 frames, video 43.100 s, audio 43.114 s, -14.0 LUFS, true peak -4.2 dBFS. Lint PASS. Contact sheet reviewed by the main agent.
- `build/render/*.mp4` is now git-ignored for video-03, as for video-02.
