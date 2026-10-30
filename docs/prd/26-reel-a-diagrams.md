# PRD-26: Reel A diagram animations (replace the s2-s6 placeholders)

## Context
- PRD-25 (commit 7c12d00) built ep-reel-a/ with the video-02 engine; render v1 passes lint and gates; s2-s6 are text placeholders.
- Design reference: ep-reel-a/storyboard/ (approved direction by the user, "lanjut"). Main agent's storyboard review, to fix now: graphics were too small with empty space between graphic and caption; small labels too small for a phone; the lamp icon in s2_b unclear.
- Look: navy gradient, accent #F7A600 (photons, headline numbers), electric blue #2F80ED (electrons, wires), white labels; Anton headlines, Inter labels. Flat 2D, SVG + GSAP, deterministic (no Math.random, no Date.now).
- Safe box x 65..940, y 220..1500; hero band y 420..1320 (diagrams live in the hero band). Captions sit near y 1380.
- PRD-25 outcome says the main agent deleted the sub-agent's reminder trigger; that is wrong: the delete was refused by the permission system and the trigger "PRD-25 render check" may still exist. Correct that line.

## Goal
Render ep-reel-a/out/reel_a_v2.mp4 with animated diagrams for s2-s6, every element appearing at its spoken cue, passing lint and gates.

## Changes allowed
docs/prd/26-reel-a-diagrams.md; docs/prd/25-reel-a-scaffold.md (only the one wrong outcome line: replace it with "- The sub-agent created a one-shot reminder trigger (\"PRD-25 render check\") for itself; the main agent's delete was refused by the permission system, so it may still exist. Sub-agents must not schedule triggers."); ep-reel-a/scenes.json, ep-reel-a/components/*, ep-reel-a/tools/build.mjs, ep-reel-a/tools/lint.mjs, ep-reel-a/index.html (generated), ep-reel-a/build/*, ep-reel-a/out/reel_a_v2.mp4, ep-reel-a/out/v2_sheet.jpg; root .gitignore: add exactly one line `ep-reel-a/build/render/*.mp4`. Nothing else (do not touch storyboard/, assets/vo, video-02/, voice/, research/).

## New part types (add to build.mjs, sos.js, sos.css; keep existing types working)
Each part's elements reveal at cue phrases (exact substring of the scene's vo_text, resolved by the existing cue logic). Labels are part of the diagram block; size >= 40 px for labels, >= 120 px for big numbers; the diagram fills most of the hero band width (about 800 px wide).
1. "pncell" (s2_cahaya). From the scene start: headline "CAHAYA → LISTRIK" (top of hero band) and a large cell cross-section: top layer "n", bottom layer "p", junction line between them; yellow photon wave-arrows fall from the top continuously (looping is fine if deterministic). At cue "efek fotovoltaik": label "efek fotovoltaik". At cue "sambungan pe-en": the junction glows and label "sambungan p-n" appears (never show "pe-en"). At cue "aliran elektron": blue electron dots travel along an external wire loop from the cell to a clear light bulb icon (bulb outline + filament) that turns on (fills accent colour with a glow).
2. "contrast" (s3_kontras). From the scene start: left half: PV panel drawing -> lightning bolt, label "LISTRIK", headline "PANEL SURYA". At cue "solar thermal collector": right half appears: collector (row of tubes) -> flame, label "PANAS", headline "SOLAR THERMAL COLLECTOR" (two lines), and the right half settles at 45% opacity.
3. "dcac" (s4_dc). From the scene start: a small PV panel on the left feeding a wire with arrows moving in one direction. At cue "de-se": label "DC" above the wire (headline "ARUS SEARAH (DC)"). At cue "a-se": output side appears: sine wave labelled "AC" ending at a house icon. At cue "inverter": an "INVERTER" box drops in between the flat DC wire and the sine wave.
4. "series" (s5_seri). From the scene start: orange tag "ANGKA CONTOH" and one panel (grid of cells, + and - terminals). At cue "dua belas volt": big "12 V" under the panel. At cue "lima ampere" (first occurrence): "5 A" next to it. At cue "Disambung seri": headline "SERI". At cue "Dua panel": a second panel slides in and one wire draws from + of panel 1 to - of panel 2. At cue "dua puluh empat volt": the big voltage number changes to "24 V" (accent). At cue "tetap": a "tetap" badge appears next to "5 A". Every number shown is a literal number with spoken + cue + check (12 V series_12v; 5 A series_5a; 24 V series_24v), following the engine's number registry rules; the second spoken "lima ampere" may be a repeat entry if the engine needs it for the badge.
5. "parallel" (s6_paralel). From the scene start: headline "PARALEL". At cue "tiga panel": three panels stacked vertically with two vertical bus bars (+ bar left in accent, - bar right in blue) drawing in. At cue "dua belas volt": "12 V" with a "tetap" badge. At cue "lima belas ampere": big "15 A" (accent), with a short current animation along the bars. Checks parallel_12v, parallel_15a. Do not show any digit that is not spoken (no "3").
s1_hook and s7_cta stay as they are.

## Steps
1. Implement the five part types and update scenes.json for s2-s6.
2. Before rendering, take stills with the engine/HyperFrames snapshot (e.g. `npx hyperframes@0.8.206 snapshot --at ...` from ep-reel-a/, or Playwright on index.html if that is how the lint works) at: each new element's cue + 0.5 s; look at them yourself and fix overlaps, sizes and positions.
3. Lint rules: keep every existing check (numbers spoken at cue, no early digits, safe box, captions, fonts, overlaps). If the block-count check (g) or overlap check (j) needs to treat a diagram's internal labels as one block, change lint minimally, document the change in the PRD outcome, and keep the safe-box check applied to every label. STOP and report if a check can only pass by weakening the digit/cue checks.
4. Render: `bash ep-reel-a/tools/render.sh` with output out/reel_a_v2.mp4 (set "output" in video.config.json to out/reel_a_v2.mp4; that one key is allowed to change). Run it in the foreground (timeout 10 min) with output tee'd to ep-reel-a/build/render/render.log.
5. Evidence (print verbatim): lint output and gates; ffprobe (same command as PRD-25); ebur128 tail -12; contact sheet ep-reel-a/out/v2_sheet.jpg with frames at each scene start + 0.4 s and each cue listed above + 0.6 s, plus total - 0.3 s (list the timestamps); `git diff --stat`.
6. STOP conditions: lint fails after three fix attempts; render fails twice; a gate fails.

## Acceptance
Lint PASS; gates unchanged and passing; MP4 1080x1920 30 fps, audio/video within 0.1 s; loudness -14 +/- 0.5 LUFS, TP <= -1.0; v2_sheet.jpg shows the diagrams.

## Report
All step 5 outputs verbatim, the list of lint changes (if any) with reasons, `git status --short --untracked-files=all`, absolute paths of reel_a_v2.mp4 and v2_sheet.jpg.

## Outcome (2026-10-30, reviewed by the main agent)
- ep-reel-a/out/reel_a_v2.mp4: 1080x1920, 30 fps, 48.23 s, A/V within 0.001 s, -13.9 LUFS, TP -4.1 dBFS. Lint PASS (unchanged lint.mjs); gates hook 3.225 / 3.5, close 2.491 / 7.2, total 48.227 / 50. Number checks true.
- Main agent reviewed v2_sheet.jpg: every element appears at its cue; series link (- of panel 1 to + of panel 2) and parallel bus bars are correct; both series link directions are valid series wiring.
- Not met: diagrams in s2 (cell), s3 (contrast) and s4 (DC/AC) are still small, leaving the lower half of the hero band empty; photons and labels in s2/s4 are small. Follow-up: PRD-27 (scale pass).
