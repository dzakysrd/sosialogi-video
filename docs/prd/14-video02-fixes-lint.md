# PRD-14: video-02 pre-render fixes and lint

## Context
- State at commit 165de52 (PRD-13): `video-02/tools/build.mjs` builds `index.html` and `build/timeline.json` from `research/video-02/script_v1.json`, the voice take, the CSVs, `scenes.json` and `video.config.json`. Captions show spoken numbers as digits ("1 dari 5", "80,51%", "2013", ...); the numbers registry in `build/timeline.json` lists each number's display text, caption text, spoken form and time `t`.
- Pre-render review by the main agent (frames 0.05-41.5 s) found:
  1. MUST FIX: a caption chunk shows its whole text from the chunk start, so a number run in it is visible before it is spoken (for example "1 dari 5" from 0.0 s, spoken at 1.196 s; "99,83%" from 9.27 s, spoken at 11.385 s). Rule: no number may be visible before its spoken cue.
  2. MUST FIX: s5 shows Papua Pegunungan figures (PLN 14,06%, the stacked bar) without their period. They are Triwulan IV 2023 data (`research/video-02/re_province.csv`).
  3. Improve: s4 province names are 32 px (small on a phone). s5 legend text is small.
  4. Improve: the caption chunk "terendah Papua Pegunungan: 93,82%." wraps to two lines right under the s4 label; captions should be one line.
- User decisions (2026-10-28 WIB): do all of the above, then add a lint like video-01's before rendering.
- video-01's lint to port from: `video-01/tools/lint_v3.mjs` (static checks lines 31-111; browser probe lines 124-251: Chrome located under `/root/.cache/hyperframes/chrome/`, a probe script seeks `window.__timelines["main"]` at sample times and reports visible text blocks `[data-tb]`, their boxes, caption lines, and visible digits outside `.cite`). Its UMP-specific checks are not wanted. HyperFrames' Chrome is installed (`/root/.cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/chrome-headless-shell-linux64/chrome-headless-shell`).

## Goal
Fix items 1-4 without changing the VO, the script text, the data, the gates or any number's time, and add `video-02/tools/lint.mjs` that would have caught item 1.

## Changes allowed
- Create `docs/prd/14-video02-fixes-lint.md` (this PRD, verbatim).
- In `video-02/`: `tools/build.mjs`, `components/sos.js`, `components/sos.css`, `scenes.json`, `package.json` (scripts), new `tools/lint.mjs`; generated `index.html`, `build/timeline.json`. Nothing else in the repo. Probe files, frames and logs go to scratch.

## Steps
1. Save this PRD verbatim.
2. Item 1: inside a caption chunk, a number run's span stays invisible (opacity 0, keeping its space so the line does not jump) until the run's start time, then shows. Other words in the chunk behave as now. The literal runs ("1 dari 5", "2 per 1.000") follow the same rule. "@dzakysrd" is not a number and is unchanged.
3. Item 2: s5 shows "akhir 2023" (the re_province year from the CSV, 44 px, 600, dim colour) under the title "PAPUA PEGUNUNGAN" from the s5 visual start. Register it in the numbers registry as a repeat display of "2023" (same spoken form and cue as the s4 entry, t = 21.142); a repeat may be shown any time after its first cue.
4. Item 3: s4 rows: put each province name on its own line above its bar (name 40 px, 700; bar full width x 65..940, 40 px high); keep the block inside the hero band y 420..1320 and clear of the caption; check that "Nusa Tenggara Timur" is not clipped. s5 legend text 32 px.
5. Item 4: captions must render on one line. Lower the chunk character limit (and the merge limit) until every chunk is one line in the browser at the current caption style; report the final limits and the chunk list.
6. `video-02/tools/lint.mjs` (ES module, exits non-zero on any failure, prints every failure and a summary; reads `video.config.json`, the script, `scenes.json`, `assets/vo/words.json`, `build/timeline.json` and `index.html`):
   Static:
   a. words.json count equals the script word count; word texts equal the script tokens (letters and digits only); no digit in any vo_text.
   b. Every numbers-registry entry: its spoken phrase occurs in its scene's vo_text; the word-cue time of that phrase (first occurrence after the scene's first word) equals `t` within 0.001 s; repeats point to an earlier entry.
   c. Gates from the config (hook, close, total) recomputed from words.json and the tail.
   d. Caption chunks: at most the configured words and characters; no number run split across chunks; each number run's caption text equals the registry's caption text.
   e. Dead air: list every gap between consecutive words over 0.6 s; fail if a gap is over 1.0 s.
   Browser probe (headless Chrome, `file://` URL of `index.html`; sample every 0.1 s from 0 to the total, plus every number's t - 0.05 and t + 0.05):
   f. Visible digit tokens outside `.cite` (token pattern `\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?`): each token must belong to a registered display or caption text whose first cue is at or before the sample time + 0.05 s. Fail otherwise, printing time, token and element. A zero value ("0" or "0,...") fails.
   g. At most 3 visible `[data-tb]` text blocks per sample (captions count, the brand tag does not).
   h. Every visible text block inside the safe box from the config (x 65..940, y 220..1500).
   i. Captions: one line; at most 6 words.
   j. No two visible text blocks overlap, except elements marked `data-layout-allow-overlap` during their cross-fade.
   k. The `.cite` sources line is visible only on the final card (after the "Yuk" cue), has a font size of at least 30 px and at most 2 lines.
   Print the counts (samples, blocks checked, digits checked) and the result.
7. `package.json` scripts: `build` (node tools/build.mjs), `lint` (node tools/lint.mjs), `check` (build, lint, then `npx --yes hyperframes@0.8.206 check`). Keep the render script for PRD-15.
8. Verify:
   a. `cd video-02 && node tools/build.mjs` (full output).
   b. `cd video-02 && node tools/lint.mjs` (full output); it must pass.
   c. Negative test: copy the PRD-13 commit's `video-02/` into scratch (`git archive 165de52 video-02 | tar -x -C <scratch>/neg`), run the NEW lint against that copy (copy the new `tools/lint.mjs` into it, and make sure its config paths resolve; the voice and research files are reachable from the repo), and paste its output. It must fail on item 1 (a number visible before its cue). If it does not, the lint is wrong: fix the lint, not the test.
   d. `cd video-02 && npx --yes hyperframes@0.8.206 check` (summary and all warnings or errors).
   e. Frames with `npx --yes hyperframes@0.8.206 snapshot --at ... --no-end -o <scratch>/frames`: 0.05, 1.0, 1.25, 4.0, 4.1, 9.5, 11.5, 16.8, 16.9, 21.2, 24.0, 25.2, 28.3, 29.4, 34.9, 41.5. Contact sheet with `montage` (4 columns, 270x480, labelled) at `<scratch>/sheet.jpg`. Look at it and at full-size frames 1.0, 25.2 and 28.3 with the Read tool. Report: are number runs hidden before their cue and shown after; is "akhir 2023" on s5; are s4 names readable and unclipped; is every caption one line.
   f. `git status --short --untracked-files=all` (nothing from the probe or snapshots left in the repo).

STOP and report if: a data check or gate fails; a number's time changes; the lint cannot run Chrome; `hyperframes check` reports errors. Do not change VO, script text, data, gates or cue words.

## Acceptance
- The build passes with the same gates and number times as PRD-13.
- `node tools/lint.mjs` passes on the new build and fails on the PRD-13 copy with a "visible before its cue" failure.
- `hyperframes check`: 0 errors.
- Frames confirm items 1-4.
- git status lists only the PRD and files under `video-02/`.

## Budget
0 paid calls.

## Report
Paste verbatim: the build output (chunk list included), the lint output on the new build, the negative-test output, the check summary, the frame list and sheet path, findings per item, the final caption limits, and the git status. Say what was not verified.

## Outcome (2026-10-28 WIB, measured)
- Items 1-4 done: number runs in captions stay hidden until their cue; s5 shows "akhir 2023" (a repeat of the s4 entry, cue 21.142 s); s4 names 40 px above full-width bars; captions one line (limits 5 words / 33 characters, merged 6 / 33). Gates and number times unchanged.
- `tools/lint.mjs`: on the new build, every check passes except g (4 text blocks at 39.4-39.5 s: the close block still fading while the final card, sources and caption show). Negative test on the PRD-13 commit: fails as required, including 11 numbers visible before their cue (for example "1" in "1 dari 5" from 0.1 s, cue 1.196 s).
- `hyperframes check`: 0 errors; warnings: dense caption track, and `line_unread` on "tinggal kurang dari 2 per 1.000." (1.83 s).
- The s5 legend was already 32 px; left unchanged.
- Reviewed by the main agent: the 16-frame contact sheet and the full-size frame at 25.2 s. Decision for check g: the close block finishes fading in the pause between "Nasional." and "Yuk" (PRD-15); check g is not relaxed.
