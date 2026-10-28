# PRD-25: video-03 Reels cover

## Context
- The user asked for a Reels cover for `video-03/out/v1.mp4` on 2026-10-28.
- Style: `video-03/components/sos.css` (ground #0b1220, ink #ffffff, ink-dim #b4c2d8, accent #ffd23f, track #1f2e45; display font Anton `assets/fonts/anton-latin-400-normal.woff2`, body font Inter 400-800 in `assets/fonts/`).
- Instagram shows the cover at 9:16 in Reels and cropped to a centred 3:4 area (1080x1440, y 240..1680) on the profile grid (not verified for current Instagram; treat it as a design guard). The Reels UI covers the bottom; keep text inside x 65..1015 and y 300..1500.
- Figures, from `research/video-03/neet_province.csv` (INDONESIA 19.44, under 20): "HAMPIR 1 DARI 5". No other number on the cover except the year "2025".
- Playwright and Chromium are pre-installed: `require('playwright')` works from any directory and `chromium.launch()` needs no options.

## Goal
Two cover candidates as 1080x1920 PNG files for the user to choose from.

## Changes allowed
- This PRD; `video-03/cover/cover.html`, `video-03/cover/render.mjs`, `video-03/out/cover_a.png`, `video-03/out/cover_b.png`. Nothing else.

## Steps
1. Save this PRD verbatim.
2. `video-03/cover/cover.html`: a static 1080x1920 page that loads the fonts from `../assets/fonts/` with @font-face (same declarations as sos.css), background #0b1220. Content, centred horizontally, stacked vertically and centred around y 960:
   - small kicker in Inter 800, letter-spaced, accent colour: "HARI SUMPAH PEMUDA"
   - headline in Anton, white, two to three lines: "ANAK MUDA" / "TIDAK SEKOLAH," / "TIDAK KERJA"
   - big number line in Anton, accent colour, as large as fits within x 65..1015: "HAMPIR 1 DARI 5"
   - a simple row of 5 person-like icons drawn with inline SVG or CSS (circle head + rounded body), the first one in accent colour and the other four in #33445c, about 110 px tall, gap 30 px
   - footer line in Inter 600, ink-dim: "Data BPS 2025 · NEET usia 15–24"
   - the brand pill "@dzakysrd" in the same look as the video's brand tag (accent background, dark text, Inter 800), below the footer.
   Read a `?v=b` query parameter: variant b is the same layout with the headline and number swapped in order (number first, then "ANAK MUDA" / "TIDAK SEKOLAH, TIDAK KERJA"), for a number-first cover.
3. `video-03/cover/render.mjs` (node, Playwright): open cover.html via file:// at viewport 1080x1920, deviceScaleFactor 1, wait for `document.fonts.ready`, check that `document.fonts.check('400 100px SosDisplay')` is true (fail otherwise), screenshot variant a to `video-03/out/cover_a.png` and variant b to `video-03/out/cover_b.png`. Also print, for each variant, the bounding box (x, y, right, bottom) of every text element and the icon row, and FAIL if any is outside x 65..1015 or y 300..1500, or if two boxes overlap.
4. Run `node video-03/cover/render.mjs` from the repo root. Paste its full output. If a box check fails, adjust only sizes/spacing in cover.html (never the text) and re-run; report each attempt; STOP after 4.
5. `file video-03/out/cover_*.png` (must be 1080 x 1920). Make 3:4 centre crops into scratch for review: `ffmpeg -y -i video-03/out/cover_a.png -vf crop=1080:1440:0:240 <scratch>/cover_a_grid.png` (same for b). List the paths.
6. `git status --short --untracked-files=all`.

## Acceptance
Both PNGs 1080x1920; box checks pass; fonts loaded; git status only the allowed files.

## Budget
0 paid calls. No network.

## Report
Paste verbatim: render.mjs output (every attempt), the `file` output, crop paths, git status.

## Outcome (2026-10-28, measured)
- `cover_a.png` and `cover_b.png`, 1080x1920; fonts loaded; box checks pass on the second attempt (stack gap 48 -> 44 px). Reviewed by the main agent. Waiting on the user's choice.
