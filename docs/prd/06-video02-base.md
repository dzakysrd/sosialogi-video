# PRD-06: pick the base for video-02 (Hari Listrik Nasional)

## Context
Verified on 2026-10-27 by the main agent (line counts by `wc -l`; topic hits by `grep -i -c "ump\|jabar\|jawa barat\|karawang\|jakarta\|aceh\|gaji\|upah"`).

- Video-02 topic: Hari Listrik Nasional. No research has been done. The data shape is unknown. Possible metrics are hypotheses only, not checked: electrification ratio per province (%), electricity use per person (kWh), generation mix (%), tariff (Rp/kWh), multi-year series. So the base may need units other than Rupiah, and maybe year series or shares.
- Option "video-01 tools" (`video-01/`):
  - `tools/build_v3.mjs` (497 lines, 102 topic hits) is written for the UMP story: data assertions such as `below.length !== 24` and lowest ratio = Aceh, a hard-coded `sceneFirst` word list, hand-placed map frames and pins (`KW`, `JAK_PIN`, `ACEH_PIN`), and inline beat HTML for B1..B9.
  - `tools/lint_v3.mjs` (295 lines, 30 topic hits): cue checks, no digits in VO, numbers spoken at their cue and derived from data, browser probe (safe box, text blocks per frame, caption lines, hero band).
  - `tools/lib/`: `cue.mjs` (41 lines, word-cue resolver), `nums.mjs` (35 lines; Indonesian number words, `intWords` throws for n >= 10000; display and spoken formats for Rupiah only: `fmtShort`, `spokenShort`), `csv.mjs` (21), `html.mjs` (4).
  - `tools/render_v3.sh`: build, lint, HyperFrames render, two-pass loudnorm to -14 LUFS / true peak -1.5 dBTP.
  - `beats_v3.md`: word-synced captions (one pill, word highlighted yellow); Reels safe box x 65..940, y 220..1500.
- Option "template" (`template/`):
  - `scenes.json` drives everything. Scene types: `title`, `map`, `bignumber`, `bars` (`tools/build.mjs`, 147 lines; `components/sos.js`, 285 lines; `components/sos.css`, 107 lines; `src/template.html`, 46 lines).
  - Start times are the sum of fixed `duration` values, not word cues. Captions are per scene, not word-timed (`template/README.md`).
  - Number formats `full` and `short`, both Rupiah only.
  - Safe zones (TikTok): top 160, right 140, bottom 380, left 60. These differ from the video-01 v3 Reels box.
  - `npm run render` has no loudness step. No VO or number lint. The README says the demo passed `hyperframes check` with 0 errors and 0 warnings; this was not re-run in this session.
  - `npm run build` rewrites `template/index.html`, so it must only run in a scratch copy.
- Container: node v22.22.0, npx, ffmpeg, ffprobe and python3 are present. The HyperFrames browser is not installed (`/root/.cache/hyperframes` does not exist).

## Goal
Collect facts to choose one of three options for video-02. Do not build video-02.
- A. `template/` as is: copy it to `video-02/` and edit `scenes.json`.
- B. video-01 tools: copy the v3 build, lint, render and components into `video-02/` and rewrite the story-specific parts.
- C. Hybrid: `template/` as the scene engine, plus the generic parts of video-01 ported in (word cues, number words, word-synced captions, loudnorm render step, generic lint checks).

## Changes allowed
- Create `docs/prd/06-video02-base.md` (this PRD, verbatim).
- Everything else goes to the scratch directory given in the prompt. No other repo file may change. Do not run `npm run build`, `npm run check` or any HyperFrames command inside `template/` or `video-01/`.
- Allowed outside the repo: `npx --yes hyperframes@0.8.206 browser ensure` (installs HyperFrames' browser under `/root/.cache/hyperframes`).

## Steps
1. Save this PRD verbatim to `docs/prd/06-video02-base.md`.
2. Inventory. For each of these files, give the line count and classify each top-level function or section as GENERIC (works for any topic) or TOPIC (specific to UMP or video-01), with line ranges: `video-01/tools/build_v3.mjs`, `video-01/tools/lint_v3.mjs`, `video-01/tools/render_v3.sh`, `video-01/tools/lib/*.mjs`, `video-01/tools/geometry.mjs`, `video-01/components/video.js`, `video-01/components/video_v3.css`, `template/tools/build.mjs`, `template/components/sos.js`, `template/components/sos.css`, `template/src/template.html`. Classify by reading the code; grep is only an aid. Give totals of GENERIC and TOPIC lines per file.
3. Capability matrix. For each base (template; video-01 v3) answer yes / no / partial for each feature, with `file:line` evidence:
   - F1 timing tied to VO word cues (`words.json`)
   - F2 word-synced captions
   - F3 VO audio in the render
   - F4 loudness normalisation to -14 LUFS
   - F5 lint: no digits in VO; numbers spoken at their cue; numbers derived from data
   - F6 browser-probe lint: safe box, text blocks per frame, caption lines
   - F7 length gates from a config file (hook, close, total)
   - F8 scene or beat types available (list them)
   - F9 units: can it display AND speak percent, kWh, GW, plain integers >= 10000, years? (answer per unit)
   - F10 province map: shape count and how provinces are highlighted
   - F11 time-series or line chart
   - F12 share or composition chart (stacked bar, donut)
   - F13 safe-zone values
   - F14 data and text in a config file, or hand-coded per video
   - F15 network needs at build and render time
4. Smoke test of the template, in scratch only:
   a. `cp -r /home/user/sosialogi-video/template <scratch>/template-copy` (skip `node_modules` if present).
   b. In the copy: `node tools/build.mjs`. Paste the output.
   c. `npx --yes hyperframes@0.8.206 browser ensure`. If it fails, paste the error verbatim, skip c-e, and continue with step 5. Do not try another way to get a browser.
   d. In the copy: `npx --yes hyperframes@0.8.206 check`. Paste the last 40 lines and the error and warning counts.
   e. In the copy: `npx --yes hyperframes@0.8.206 render --resolution portrait --fps 30 -o <scratch>/template-demo.mp4`, then `ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate:format=duration -of default=nw=1 <scratch>/template-demo.mp4`. Stop the render if it runs longer than 10 minutes and report that.
5. Work items. For each option A, B and C, list the concrete work needed for a video-02 that has: (i) a province map of a percentage metric, (ii) one bar comparison in a non-Rupiah unit, (iii) a big number in a non-Rupiah unit, (iv) word-cued timing, word-synced captions, loudnorm and the number lint. Per item, name the files to create or change and the existing code reused (`file:line`). Do not give time or line-count estimates.
6. Write the report to `<scratch>/report.md`.

STOP and report if: any repo file other than `docs/prd/06-video02-base.md` changes (check `git status`); a command needs a package other than `hyperframes@0.8.206`; a step would need data for the new topic. Do not fetch any data for Hari Listrik Nasional.

## Acceptance
- `git status --short --untracked-files=all` shows exactly one line: `?? docs/prd/06-video02-base.md`.
- The inventory covers every file listed in step 2.
- The matrix has an answer with evidence for F1..F15 for both bases.
- Step 4 outputs are pasted verbatim, or the failure is pasted verbatim.

## Budget
0 ElevenLabs credits, 0 paid calls. Network only for `npx hyperframes@0.8.206` and its browser download.

## Report
Paste `report.md` in full: inventory, matrix, step 4 outputs, work items, and a list of what was not verified. Then paste the `git status` line from Acceptance.

## Outcome (2026-10-27, measured)
- Steps 1-6 ran. The only repo change was this file. No paid calls. The full report stayed in the session scratch directory (not committed).
- Inventory, GENERIC/TOPIC lines (sub-agent's reading of the code): `video-01/tools/build_v3.mjs` 232/265, `video-01/tools/lint_v3.mjs` 201/94, `video-01/tools/lib/cue.mjs` 41/0, `video-01/tools/lib/nums.mjs` 25/10 (the Rupiah formatters), `template/tools/build.mjs` 147/0, `template/components/sos.js` 276/9 (the Rupiah formatters).
- Capabilities: video-01 v3 has word-cued timing, word-synced captions, VO in the render, two-pass loudnorm, the number lint, the browser-probe lint and config gates. The template has none of these; it adds VO audio only if `assets/vo.mp3` exists. Both bases: the same 34-shape map, no line chart, no share chart, Rupiah-only number formats (no percent, kWh or GW; `intWords` in `video-01/tools/lib/nums.mjs` throws for n >= 10000).
- Template smoke test in a scratch copy: build OK (4 scenes, 12 s). Browser installed outside the repo (chrome-headless-shell 152.0.7977.30 under `/root/.cache/hyperframes`). `hyperframes check`: 0 errors, 0 warnings, 1 info (`audio_none`). Render: 12.0 s, 1080x1920, 30/1, no audio, rendered in 31.6 s (screenshot capture; BeginFrame did not run). Frames not viewed.
- Finding: `video-01/video.v3.config.json:17` has `TP_max: -1.0`, which no code reads. `video-01/tools/render_v3.sh` uses `TP=-1.5`. Not changed.
- Not verified: the video-01 build, lint and render were not run in this task. The line classification is a reading of the code, not a measurement.
- Reviewed by the main agent: git status, ffprobe of the demo, check and render log lines, and the cited lines in `template/components/sos.js`, `template/tools/build.mjs`, `video-01/tools/lint_v3.mjs`, `video-01/tools/render_v3.sh` and `video-01/video.v3.config.json`.
- Recommendation (main agent): option C (hybrid). Decision: pending; the user decides.

## Decision (2026-10-28 WIB, user)
- Option C (hybrid), as recommended.
- Safe box: the video-01 v3 Reels values (top 220, bottom 420, left 65, right 140).
- The user noted that Hari Listrik Nasional (27 October) was the day before this decision. Whether the hook refers to the day is decided with the script.
