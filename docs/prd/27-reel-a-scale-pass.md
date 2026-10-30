# PRD-27: Reel A scale pass (bigger diagrams, readable labels)

## Context
- Render v2 (commit 39b193a) passes lint and gates; timing is right. Main agent review of v2_sheet.jpg: diagrams in s2 (pncell), s3 (contrast) and s4 (dcac) occupy only the top part of the hero band; the lower half above the captions is empty; photons, the bulb, the DC/AC/INVERTER labels and the dcac drawing are small for a phone. s5 and s6 are about right but can grow a little.
- Hero band y 420..1320, safe box x 65..940, y 220..1500. Captions sit around y 1380 and must stay clear.

## Goal
Same video, same timing; diagrams fill the hero band and every label is readable on a phone.

## Targets (measure on stills, 1080x1920 frame coordinates)
- Every diagram block: its drawing spans at least y 450..1250 (about 800 px tall) when fully revealed, and at least 700 px wide, centred in x 65..940.
- Labels (efek fotovoltaik, sambungan p-n, LISTRIK, PANAS, DC, AC, INVERTER, tetap, ANGKA CONTOH): at least 44 px font size. Headlines at least 88 px. Big numbers (12 V, 5 A, 24 V, 15 A) at least 140 px.
- s2: the n/p cell about 600 px wide; photons visible (stroke at least 6 px, length at least 80 px); the bulb at least 160 px tall with a recognisable bulb shape (glass outline, base, filament); the wire loop goes around the cell to the bulb.
- s3: two columns each about 400 px wide, panel and collector drawings at least 300 px wide, bolt and flame at least 160 px tall.
- s4: lay the chain out vertically (top to bottom: panel -> DC wire with arrows -> INVERTER box -> AC sine wave -> house) so it fills the band height; the INVERTER box at least 360 px wide; arrows and sine stroke at least 6 px.
- s5/s6: panels at least 300 px wide each (s5) / 420 px wide (s6), keep the numbers below the drawing.
- No element outside the safe box; no overlap with the caption band (keep diagrams above y 1300).

## Changes allowed
docs/prd/27-reel-a-scale-pass.md; ep-reel-a/components/sos.js, ep-reel-a/components/sos.css (layout and sizes of the five diagram types only); ep-reel-a/index.html and ep-reel-a/build/* (generated); ep-reel-a/video.config.json "output" -> out/reel_a_v3.mp4; ep-reel-a/out/reel_a_v3.mp4, ep-reel-a/out/v3_sheet.jpg. Nothing else.

## Steps
1. Change sizes/layout. Take stills (as in PRD-26) at each cue + 0.6 s for s2-s6, measure the drawing bounds and label font sizes with Playwright (getBoundingClientRect and getComputedStyle) and print a table: element, bbox, font-size, target, ok/fail. Iterate until all ok.
2. Render with `bash ep-reel-a/tools/render.sh` (foreground, tee to ep-reel-a/build/render/render.log).
3. Evidence (verbatim): the measurement table; lint output and gates; ffprobe (PRD-25 command); ebur128 tail -12; contact sheet ep-reel-a/out/v3_sheet.jpg at the same 24 timestamps as v2_sheet (list them); `git status --short --untracked-files=all`.
4. STOP conditions: lint fails after three attempts; render fails twice; a target cannot be met without breaking the safe box or captions (report which).

## Acceptance
All targets ok in the table; lint PASS; gates unchanged; MP4 1080x1920 30 fps; loudness -14 +/- 0.5 LUFS, TP <= -1.0.

## Report
Step 3 outputs verbatim and absolute paths of reel_a_v3.mp4 and v3_sheet.jpg.

## Outcome (2026-10-30, reviewed by the main agent)
- ep-reel-a/out/reel_a_v3.mp4: 1080x1920, 30 fps, 48.23 s, -13.9 LUFS, TP -4.1 dBFS. Lint PASS; gates unchanged (hook 3.225 / 3.5, total 48.227 / 50). All size targets met per the measurement table; diagrams now span about y 420..1270.
- Main agent reviewed v3_sheet.jpg: diagrams fill the hero band and labels are readable. Notes: in s4 the AC wave and house complete about 1.5 s after the "a-se" cue (only the AC label and the connector line show at cue + 0.6 s); the s3 collector headline wraps to three lines; the HyperFrames CLI reported 1 lint warning that was not inspected.
