# PRD-28: Reel A hook redesign (s1)

## Context
- User feedback on v3 (2026-10-30): the opening frame, only "BUKAN PANAS." in white on navy, feels broken and unclear ("terlalu patah dan ga jelas"). It has no subject and no picture, unlike the storyboard (s1_a: crossed-out thermometer; s1_b: sun rays hitting a panel).
- VO s1: "Panel surya nggak butuh panas. Yang dia butuh: cahaya." (0.000-3.225 s). Hook gate 3.5 s stays.
- The first frame also serves as the cover candidate, so it must explain the topic on its own.

## Goal
A hook that is clear from frame 1 and turns at the word "cahaya".

## Design (new part type "hook", one text/diagram block, hero band y 420..1320, safe box x 65..940)
- From frame 0 (no fade-in from empty: everything below is fully visible on frame 0):
  - Headline, two lines, Anton, at least 110 px: line 1 "PANEL SURYA" (white); line 2 "NGGAK BUTUH PANAS" (white, with "PANAS" in the accent colour #F7A600). If line 2 does not fit at 110 px within 875 px width, wrap to "NGGAK BUTUH" / "PANAS" rather than shrinking below 96 px.
  - Below the headline: a large tilted PV panel drawing (at least 460 px wide, same panel style as s5/s6) and, to its right, a thermometer icon (at least 260 px tall) with a thick diagonal strike line (at least 14 px, colour #E5484D or the accent; pick one and state it).
- At cue "cahaya": within 0.4 s the thermometer and strike fade out; a sun (circle, at least 140 px) appears top-left of the panel with rays (stroke at least 8 px) drawing towards the panel; the panel cells brighten (lighter blue); line 2 of the headline cross-fades to "BUTUH CAHAYA." in the accent colour (line 1 "PANEL SURYA" stays).
- Deterministic animation only; keep the text and drawing inside the hero band and clear of the caption band (above y 1300).
- on_screen_text in the script is not changed (this is a layout change agreed with the user); note the new on-screen wording in the outcome.

## Changes allowed
docs/prd/28-reel-a-hook.md; ep-reel-a/scenes.json (s1_hook part only); ep-reel-a/components/sos.js and sos.css (new "hook" builder and styles; do not change other builders); ep-reel-a/tools/build.mjs (only if needed to resolve the new part's cue); ep-reel-a/index.html and ep-reel-a/build/* (generated); ep-reel-a/video.config.json "output" -> out/reel_a_v4.mp4; ep-reel-a/out/reel_a_v4.mp4, ep-reel-a/out/v4_sheet.jpg, ep-reel-a/out/v4_hook_frames.jpg. Nothing else.

## Steps
1. Implement; take stills at 0.0, 1.0, cue("cahaya") + 0.5 and 3.2 s; measure with Playwright: headline font sizes, panel width, thermometer height, sun size, bounds of the block (print a table with targets ok/fail). Look at the stills and fix until all ok.
2. Render `bash ep-reel-a/tools/render.sh` (foreground, tee to ep-reel-a/build/render/render.log).
3. Evidence (verbatim): table; lint output and gates; ffprobe (PRD-25 command); ebur128 tail -12; ep-reel-a/out/v4_hook_frames.jpg: frames from the MP4 at 0.0, 0.5, 1.5, cue+0.2, cue+0.6, 3.2 s (6 frames, one row, via video-01/build/v3/sheet.py); ep-reel-a/out/v4_sheet.jpg at the same 24 timestamps as v3_sheet; `git status --short --untracked-files=all`.
4. STOP conditions: lint fails after three attempts; render fails twice; the hook gate fails.

## Acceptance
Table all ok; lint PASS; gates unchanged; MP4 1080x1920 30 fps; loudness -14 +/- 0.5 LUFS, TP <= -1.0; frame 0 shows headline + panel + struck thermometer.

## Report
Step 3 outputs verbatim; the strike colour chosen; absolute paths of reel_a_v4.mp4, v4_hook_frames.jpg, v4_sheet.jpg.

## Outcome (2026-10-30, reviewed by the main agent)
- ep-reel-a/out/reel_a_v4.mp4: 1080x1920, 30 fps, 48.23 s, -13.9 LUFS, TP -4.1 dBFS. Lint PASS; gates unchanged (hook 3.225 / 3.5, total 48.227 / 50).
- New on-screen wording in s1 (agreed with the user): frame 0 "PANEL SURYA / NGGAK BUTUH PANAS" (PANAS in accent) with a tilted panel and a thermometer struck through in #E5484D; at "cahaya" (2.726 s) the thermometer fades, a sun with rays appears, the cells brighten and line 2 becomes "BUTUH CAHAYA.". The script's on_screen_text field was not edited.
- First render had both line-2 texts overlapping mid cross-fade (main agent review); fixed: the old line fades out over 0.12 s, then the new one fades in over 0.15 s; no time where both are above 0.05 opacity (Playwright). Main agent reviewed v4_hook_frames.jpg after the fix.
- Frame 0 is a cover candidate.
