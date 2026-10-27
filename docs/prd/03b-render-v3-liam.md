# PRD-03b: render video-01 v3 with the ElevenLabs Liam take

## Context
voice/samples/v3/el_liam/ holds the full v3 narration by ElevenLabs premade voice Liam (104 words, -14.2 LUFS, true peak -2.0 dBTP; see docs/prd/03a-loudness-and-liam-take.md). Its Jawa Barat section is 12.274 s; the user decided on 2026-10-27 to raise that gate from 11.0 s to 12.5 s instead of re-generating. Other gates already pass: hook 3.399 s (3.5), close 6.944 s (7.0), total 44.61 s (45).

## Changes (the only file edits allowed)
1. video-01/video.v3.config.json: "jabar_max_s": 11.0 -> 12.5, and "voice": {"dir": "../voice/samples/v3", "variant": "el_liam"}. Nothing else.
2. video-01/beats_v3.md line 5: replace "now v2 = Ardi, rate +8%, pitch +0Hz" with "now el_liam = ElevenLabs premade voice Liam, eleven_multilingual_v2". Do not touch the table (lint parses it).
3. video-01/out/v3_caption.txt: add one line "Suara: ElevenLabs" after the "Sumber:" list and before the hashtag line, separated by one blank line on each side. Nothing else in the caption changes.
4. Files the scripts regenerate (index_v3.html, build/v3/timeline.json, assets/v3/*, out/v3.mp4, logs) change as a result; that is expected.

## Steps
A. Browser. lint_v3.mjs looks for chrome-headless-shell under /root/.cache/hyperframes/chrome, and `npx hyperframes@0.8.206 render` needs its own Chrome. That folder does not exist yet in this container. First read the CLI's own docs (`npx --yes hyperframes@0.8.206 --help`, `npx hyperframes@0.8.206 docs rendering`, `... docs troubleshooting`) and use the documented way to install or point to a browser. Only if the documented way fails because of the network: create /root/.cache/hyperframes/chrome/pw/ and symlink /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell into it (outside the repo), and report this as a deviation (a different Chrome build than the one HyperFrames would download). Never download browsers from other sources.
B. In video-01/: `node tools/build_v3.mjs` then `node tools/lint_v3.mjs`. Save both outputs to video-01/build/render/v3_lint.log. If either fails, STOP and report the failures verbatim; do not change gates, text or tools to make them pass.
C. Render: `bash tools/render_v3.sh` from video-01/ (it re-runs build and lint, renders, then loudnorms the audio into out/v3.mp4). It can take longer than 10 minutes: run it with the Bash tool's run_in_background option (timeout up to 7200000 ms), output to video-01/build/render/v3_render.log, and wait for the completion notification instead of polling with sleep. If the render dies (for example "Target closed"), report the last 40 log lines and try exactly once more; if it fails again, STOP and report.
D. Verify out/v3.mp4 yourself and report each value:
   - ffprobe: video codec, width x height (must be 1080x1920), r_frame_rate (30/1), nb_frames, video duration; audio codec, sample rate, channels, audio duration. Video duration must be within 0.1 s of timeline total (build/v3/timeline.json "total"), and audio duration within 0.1 s of video duration.
   - ffmpeg -i out/v3.mp4 -map 0:a -af ebur128=peak=true -f null - : integrated loudness must be -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP.
   - build/v3/timeline.json: report voice_variant, total, gates, and every entry of "numbers" (key, text, spoken, t).
E. Contact sheet: from out/v3.mp4 extract one PNG per time below into video-01/build/v3/frames/ (git-ignored) with `ffmpeg -ss T -i out/v3.mp4 -frames:v 1`: for each beat in timeline.json "beats", start + 0.4 s and the beat midpoint; plus, for each entry in "numbers", t + 0.6 s; plus total - 0.3 s. Sort by time, name files t_<seconds with 2 decimals>.png. Build the sheet with `python3 video-01/build/v3/sheet.py video-01/out/v3_sheet.jpg 6 <files in time order>` (it overwrites the old sheet). Report the sheet size and the list of times.
F. Report `git status --short --untracked-files=all` and `git diff --stat`.

FINAL MESSAGE: the browser setup you used (and any deviation), lint output (pass/fail lines and notes), render result, every value from D, the E time list and sheet path, and F. Say plainly anything that failed or could not be verified.

## Outcome (2026-10-27, measured)
- Browser: `npx hyperframes@0.8.206 browser ensure` (Chrome Headless Shell 152.0.7977.30). No fallback needed.
- build_v3 and lint_v3: all checks passed (build/render/v3_lint.log). Gates: hook 3.40 s (3.5), Jawa Barat 12.27 s (12.5), close 6.94 s (7.0), total 44.61 s (45).
- out/v3.mp4: h264 1080x1920, 30 fps, 1339 frames, 44.63 s; AAC 48 kHz stereo, 44.65 s. Loudness -14.0 LUFS integrated, true peak -4.1 dBTP (ebur128).
- The raw render measured about 3 dB louder than vo.mp3. Cause: the mono VO is placed on both stereo channels, and EBU R128 sums the channels (one channel alone measures -17.0 LUFS). The loudnorm pass in render_v3.sh brings the mix to -14.0 LUFS as intended.
- Review: contact sheet out/v3_sheet.jpg (29 frames) checked by eye. On-screen numbers match data.csv and umk_examples.csv (Rp5,73 jt / Rp5,23 jt Jakarta; 24 of 38; Rp3,93 jt / Rp2,71 jt Aceh; Rp2,32 jt / Rp3,71 jt Jawa Barat; Rp5,89 jt UMK Karawang). The red provinces on the national map equal the 24 computed from data.csv. Not done: a full frame-by-frame review, and judging the voice by ear.
