# PRD-13: video-02 fixes: s3/s4 timing, s4 layout, number captions

## Context
- PRD-12 built `video-02/` (`tools/build.mjs`, `components/sos.js`, `components/sos.css`, `scenes.json`, `video.config.json`; outputs `index.html`, `build/timeline.json`). Commit 6b7a5c8.
- Review by the main agent (contact sheet and full-size frames):
  1. The s3 headline "KURANG DARI 2 PER 1.000" appears at "dua per seribu" (16.84 s) and the next scene starts at "Setahun" (17.847 s): about 0.9 s on screen, too short.
  2. s4 part B (`rankbars`) starts at "Data" (19.9 s) but its rows appear only at "terendah" (23.197 s); frames in between are almost empty. The title (44 px) and the label line are visually weak.
  3. Caption chunks split number phrases ("satu dari" / "lima rumah tangga belum berlistrik", "dua per" / "seribu", "delapan puluh koma lima satu" / "persen") and leave single words ("Tahun", "persen", "sulit", "berlistrik"). Cause: `words.json` has no punctuation, so the phrase-break rule never fires, and number phrases are long in words.
- Word times (`video-02/assets/vo/words.json`): "Setahun" 17.847, "terakhir" 18.195, "angkanya" 18.625, "tidak" 19.031, "bergerak" 19.31, "Data" 19.9, "provinsi" 20.225, "akhir" 20.828, "dua" (2023) 21.142, "terendah" 23.197, "Papua" 23.673.
- User decision (2026-10-28 WIB): in captions, spoken numbers are shown as digits, the same as on screen ("80,51%", "2013", "1 dari 5", "2 per 1.000"); all other caption words stay exactly as spoken; "et Dzaky es er de" stays "@dzakysrd".

## Goal
Fix the three review items without changing the VO, the script text, the data, the gates or the cue words of any number.

## Changes allowed
- Create `docs/prd/13-video02-fixes.md` (this PRD, verbatim).
- In `video-02/`: `tools/build.mjs`, `components/sos.js`, `components/sos.css`, `scenes.json`, and the generated `index.html` and `build/timeline.json`. Nothing else in the repo.

## Steps
1. Save this PRD verbatim.
2. s3/s4 visual timing. Add an optional `visual_start_cue` to a scene in `scenes.json`; when set, the scene's visuals start at that cue (it must resolve inside that scene's words) and the previous scene's visuals stay on screen until then. Captions and audio are not affected. Set it on s4_provinces to "angkanya". Then in s4: part A (`textcard` "SETAHUN TERAKHIR / TIDAK BERGERAK") runs from "angkanya" to the cue "dua ribu dua puluh tiga"; part B (`rankbars`) starts at that cue with the title, the subtitle "akhir 2023" and all five rows together (rows grow in 0.6 s with a 0.08 s stagger); the Papua Pegunungan highlight stays at cue "Papua Pegunungan"; the label stays at its number cue. Expected: the s3 headline is on screen from 16.84 s to 18.625 s; part A 18.625 s to 21.142 s.
3. s4 layout (part B): centre the block vertically in the hero band (y 420..1320). Title "BELUM BERLISTRIK" in Anton 88 px; subtitle 44 px; bars 48 px high; row pitch about 100 px; names may stay 32 px if a larger size clips "Nusa Tenggara Timur" in its column (check it). Label in two lines inside the same block: "PAPUA PEGUNUNGAN" (44 px, 800) and "93,82% BERLISTRIK" (Anton 110 px, accent), both appearing at the number cue (the second line holds the number). Keep everything inside x 65..940.
4. Captions:
   a. Number runs: for every entry of the numbers registry, the caption shows its spoken words as one caption word, from the first spoken word's start to the last spoken word's end, with this display text: percent values and years exactly as on screen ("80,51%", "2013"); the literal pairs as "1 dari 5" and "2 per 1.000" (add a `caption` field to those two elements in `scenes.json`). Keep the existing `caption_display` run for "et Dzaky es er de" -> "@dzakysrd". A run is never split across chunks.
   b. Punctuation: take each word's punctuation from the script's vo_text tokens (the build already checks that words.json equals the script tokens ignoring punctuation; align them 1:1). Use it for the phrase-break rule (break after `, . : ; ! ?` when the chunk has 2 or more words) and show it in the caption text.
   c. Limits: at most 5 caption words and 34 characters per chunk, a new chunk at each sentence start. Then merge any chunk of one caption word into a neighbour in the same sentence (the previous one if possible, else the next) when the merged chunk has at most 6 caption words and 40 characters.
   d. Print the full chunk list (start, end, duration, text) in the build output and store it in `build/timeline.json`.
5. Verify:
   a. `cd video-02 && node tools/build.mjs` (paste the full output: data checks, scenes, gates, numbers, chunk list).
   b. `cd video-02 && npx --yes hyperframes@0.8.206 check` (paste the summary and every warning or error).
   c. Frames with `npx --yes hyperframes@0.8.206 snapshot --at ...` (move the PNGs to `<scratch>/frames/`, nothing left in the repo): 16.9, 17.5, 18.3, 18.8, 20.5, 21.5, 23.0, 24.2, 25.6, and the middle of the caption chunks that contain "1 dari 5", "80,51%", "99,83%", "2 per 1.000", "93,82%" and "14,06%". Contact sheet with `montage` (4 columns, 270x480, labelled with the time) at `<scratch>/sheet.jpg`. Look at it and at full-size frames 17.5, 21.5 and 25.6 with the Read tool. Report: is the s3 headline readable through 18.6 s; does s4 part B fill the hero band; are captions one line, readable, with digits for numbers; any text outside x 65..940 or overlapping.
   d. `git status --short --untracked-files=all`.

STOP and report if: a data check or a gate fails; a number's time changes; a cue does not resolve; `hyperframes check` reports errors. Do not change VO, script text, data or gates.

## Acceptance
- Gates unchanged (hook 3.344, close 6.48, total 42.114) and every number at the same time as in PRD-12 (1.196, 4.039, 6.686, 9.655, 11.385, 16.84, 21.142, 24.95, 29.266).
- The s3 headline is on screen at least 1.5 s.
- No caption chunk splits a number run; no one-word chunk unless no merge was allowed (list any).
- `hyperframes check`: 0 errors; warnings listed.
- git status lists only the PRD and files under `video-02/`.

## Budget
0 paid calls.

## Report
Paste verbatim: the build output, the check summary with warnings, the frame list and sheet path, findings per item, and the git status. Say what was not verified.

## Outcome (2026-10-28 WIB, measured)
- Build: data checks true; gates unchanged (hook 3.344 s, close 6.48 s, total 42.114 s); all nine number times unchanged; 17 caption chunks with digits for numbers; one one-word chunk ("bergerak.").
- s3 headline on screen 16.84-18.625 s (about 1.8 s); s4 text card 18.625-21.142 s; s4 chart with all rows from 21.142 s, centred in the hero band, two-line label at 24.95 s.
- `hyperframes check`: 0 errors; warnings: dense caption track, and `line_unread` on the chunk "tinggal kurang dari 2 per 1.000." (1.83 s, floor 1.95 s).
- Pre-render review by the main agent (frames at 0.05-41.5 s): a caption chunk shows its number before the number is spoken (for example "1 dari 5" is visible from 0.0 s, spoken at 1.196 s; "99,83%" from 9.27 s, spoken at 11.385 s). This breaks the rule that a number appears at its spoken cue and must be fixed before the render. Also open: s5 shows Papua Pegunungan figures without "akhir 2023"; province names (32 px) and the s5 legend are small; the lint port and the render are not done yet.
