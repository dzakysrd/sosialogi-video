# PRD-15: video-02 render (v1) and measurements

## Context
- Commit 37eb34c (PRD-14): `video-02/tools/build.mjs`, `tools/lint.mjs`, `components/sos.js`, `index.html`, `build/timeline.json`. The lint passes every check except g: at 39.4-39.5 s four text blocks show, because the close block ("LANGKAH TERAKHIR / PALING SULIT / SELAMAT HARI LISTRIK NASIONAL") is still fading out when the final card (CTA, sources) and the caption appear at the "Yuk" cue (39.356 s). The word before it, "Nasional.", ends at 39.196 s.
- Decision by the main agent: the close block finishes fading out in the pause before the card cue. Check g stays as it is.
- video-01's render pattern: `video-01/tools/render_v3.sh` (build, lint, `npx --yes hyperframes@0.8.206 render`, then a two-pass linear loudnorm to -14 LUFS, true peak -1.5 dBTP, LRA 11, video stream copied, AAC 192k 48 kHz, `+faststart`). It hard-codes the loudness values; `video-02/video.config.json` has `"loudness": {"I": -14, "TP": -1.5, "LRA": 11}`.
- Review rules (`.claude/skills/data-explainer-video/references/review-checklist.md`): 1080x1920, 30/1, video duration within 0.1 s of the timeline total, audio within 0.1 s of the video, integrated loudness -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP, contact sheet of frames taken from the MP4.
- Expected total from `video-02/build/timeline.json`: 42.114 s.

## Goal
Lint fully green, then render `video-02/out/v1.mp4` with the loudness from the config, and measure it.

## Changes allowed
- Create `docs/prd/15-video02-render.md` (this PRD, verbatim).
- `video-02/components/sos.js` (the close fade only), `video-02/tools/render.sh` (new), `video-02/package.json` (`render` script), the root `.gitignore` (one rule: `/video-02/build/render/*.mp4`), generated `video-02/index.html`, `video-02/build/timeline.json`, and the output `video-02/out/v1.mp4`. Nothing else. Frames and sheets go to scratch.

## Steps
1. Save this PRD verbatim.
2. Close fade: the close block fades out from the end of the last word before the card cue to the card cue (here 39.196 -> 39.356 s); if that gap is under 0.1 s, fade over the 0.1 s ending at the card cue. Nothing else in the timing changes.
3. `cd video-02 && node tools/build.mjs && node tools/lint.mjs`: the lint must pass every check. Paste both outputs (the build output may be shortened to the gates, scenes and numbers sections).
4. `video-02/tools/render.sh` (bash, `set -euo pipefail`, runs from its own folder like `render_v3.sh`): build; lint; `mkdir -p out build/render`; `npx --yes hyperframes@0.8.206 render --resolution portrait --fps 30 -o build/render/raw.mp4`; read I, TP and LRA from `video.config.json` with python3; two-pass linear loudnorm with those values, video copied, AAC 192k, 48 kHz, `-movflags +faststart`, to `out/v1.mp4`; print "rendered out/v1.mp4". `package.json`: `"render": "bash tools/render.sh"`. Add `/video-02/build/render/*.mp4` to the root `.gitignore`.
5. Run `bash video-02/tools/render.sh` (in the background if needed; it takes a few minutes). Paste the last 20 lines of its output.
6. Measurements on `video-02/out/v1.mp4` (paste each output verbatim):
   a. `ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels -of compact video-02/out/v1.mp4`
   b. `ffmpeg -hide_banner -nostats -i video-02/out/v1.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | tail -14`
   c. `ls -l video-02/out/v1.mp4`
   d. Checks with PASS/FAIL: 1080x1920; 30/1; video duration within 0.1 s of 42.114; audio duration within 0.1 s of the video; integrated loudness -14 +/- 0.5 LUFS; true peak <= -1.0 dBTP.
7. Frames from the MP4 (not from snapshots), into `<scratch>/frames/`: `ffmpeg -hide_banner -loglevel error -ss <t> -i video-02/out/v1.mp4 -frames:v 1 -y <scratch>/frames/<t>.png` at: every scene's visual start + 0.4 s and its middle (from `build/timeline.json`); every number's t + 0.6 s; 39.3, 39.45 and 40.4 s (the card transition); and 41.8 s. Contact sheet in time order with `python3 video-01/build/v3/sheet.py <scratch>/sheet.jpg 6 <frames in time order>`. Look at the sheet and report per scene: is every number visible after its cue and absent before; anything cut off, overlapping or outside the safe box; does the card transition at 39.3-39.45 s show at most 3 text blocks.
8. `git status --short --untracked-files=all` (expect the PRD, sos.js, render.sh, package.json, .gitignore, index.html, timeline.json, out/v1.mp4; no raw render).

STOP and report if: the lint fails after step 2; the render fails; a measurement in 6d fails (do not change loudness settings or timing to make it pass).

## Acceptance
- Lint passes all checks.
- `out/v1.mp4` exists and every 6d check passes.
- Contact sheet made from the MP4 and looked at.
- git status as in step 8.

## Budget
0 paid calls.

## Report
Paste verbatim: the lint output, the render tail, all step 6 outputs with PASS/FAIL, the frame list and sheet path, findings per scene, and the git status. Say what was not verified (you cannot hear the audio).

## Outcome (2026-10-28 WIB, measured)
- Close fade now runs 39.196-39.356 s (end of "Nasional." to the card cue). `tools/lint.mjs`: PASS, 0 problems (439 samples, 778 digit tokens, 20 caption chunks).
- `video-02/out/v1.mp4`: 1080x1920, 30/1, 1264 frames, video 42.133 s, audio AAC 48 kHz stereo 42.133 s (timeline 42.114 s), 3983359 bytes; integrated -14.0 LUFS, true peak -4.3 dBFS. Render 1 min 16.6 s.
- Re-measured by the main agent: ffprobe and ebur128 on the MP4; the 25-frame contact sheet from the MP4; extra MP4 frames at 0.05, 13.0, 34.6, 39.36 and 39.6 s. Every number appears at or after its spoken cue; the card transition shows at most 3 text blocks.
- Not verified: the audio by ear (the user listens); motion between sampled frames.
