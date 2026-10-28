# PRD-26: video-03 minimal Reels covers

## Context
- PRD-25 made `video-03/out/cover_a.png` and `cover_b.png` with `video-03/cover/cover.html` and `cover/render.mjs` (Playwright, box checks). The user found them too text-heavy. The main agent proposed a minimal cover; the user approved ("ok lanjut", 2026-10-28).
- Style as PRD-25 (ground #0b1220, accent #ffd23f, white #ffffff, icon grey #33445c; Anton for display, Inter for body; fonts in `video-03/assets/fonts/`).
- Design guard: text and icons inside x 65..1015 and the centred 3:4 grid crop with margin, y 300..1620; everything centred horizontally.

## Goal
Two minimal covers, 1080x1920 PNG: `cover_c.png` (3 elements) and `cover_d.png` (2 elements).

## Changes allowed
- This PRD; `video-03/cover/cover.html`, `video-03/cover/render.mjs`, `video-03/out/cover_c.png`, `video-03/out/cover_d.png`. Keep variants a and b working (do not delete their PNGs).

## Steps
1. Save this PRD verbatim.
2. Add variants `?v=c` and `?v=d` to `cover.html`. No kicker, no footer, no brand pill in c or d. All elements centred horizontally, the group centred vertically around y 960.
   - c, top to bottom: "HAMPIR 1 DARI 5" (Anton, accent, fitted to 950 px width); the five person icons, first accent and four grey, about 220 px tall with gap 40 px; "ANAK MUDA NGGAK SEKOLAH," / "NGGAK KERJA" (Anton, white, two centred lines, about 96 px). Gap between groups about 70 px.
   - d, top to bottom: "1 DARI 5" (Anton, accent, fitted to 950 px width); the five icons as in c, about 260 px tall.
3. `render.mjs`: also render c and d to `video-03/out/cover_c.png` and `cover_d.png`, with the same font and box checks, using the y bound 300..1620 for c and d (a and b keep their bounds). Print every box as before.
4. Run `node video-03/cover/render.mjs` from the repo root; paste the full output. If a box check fails, change only sizes/gaps (never text) and re-run; STOP after 4 attempts.
5. `file video-03/out/cover_c.png video-03/out/cover_d.png`. Side-by-side preview in scratch: `ffmpeg -y -i video-03/out/cover_c.png -i video-03/out/cover_d.png -filter_complex "[0]scale=540:960[a];[1]scale=540:960[b];[a][b]hstack" <scratch>/cd_side.png`. Also a phone-grid-size preview (each cover's 3:4 centre crop scaled to 360x480, side by side): `ffmpeg -y -i video-03/out/cover_c.png -i video-03/out/cover_d.png -filter_complex "[0]crop=1080:1440:0:240,scale=360:480[a];[1]crop=1080:1440:0:240,scale=360:480[b];[a][b]hstack" <scratch>/cd_grid_small.png`.
6. `git status --short --untracked-files=all`.

## Acceptance
c and d 1080x1920; fonts loaded; box checks pass; a and b still render; git status only allowed files.

## Budget
0 paid calls. No network.

## Report
Paste verbatim: render output (every attempt), file output, preview paths, git status.

## Outcome (2026-10-28, measured)
- `cover_c.png` and `cover_d.png`, 1080x1920; fonts loaded; box checks pass on the second attempt (c headline 96 -> 88 px). Reviewed by the main agent at phone-grid size. Note: d says "1 DARI 5" without "HAMPIR" (data 19,44%).
