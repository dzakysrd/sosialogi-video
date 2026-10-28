# PRD-11: video-02 scaffold and number library

## Context
- video-02 uses option C (PRD-06): `template/` as the scene engine, plus generic parts of video-01. This PRD only sets up the folder and the number library. Timing, captions, new scene types, lint and render come in later PRDs.
- `template/` files (checked by the main agent): `tools/build.mjs` (reads `scenes.json` and `assets/map/indonesia-34.svg`, writes `index.html`), `components/sos.js`, `components/sos.css`, `src/template.html`, `vendor/gsap.min.js`, `vendor/LICENSES/`, `assets/fonts/` (5 woff2), `assets/map/`, `hyperframes.json`, `meta.json`, `package.json`, `scenes.json` (demo), `CLAUDE.md` and `AGENTS.md` (HyperFrames' own folder instructions), `README.md`, `demo.mp4`, `index.html` (generated), `tools/make-map.mjs`.
- `video-01/tools/lib/`: `cue.mjs` (word-cue resolver), `csv.mjs` (CSV reader), `nums.mjs` (`intWords` for 0..9999, `digitWords`, `fmtShort` and `spokenShort` for Rupiah, `spokenInt`), `html.mjs`.
- video-02 needs percent display and speech. Numbers in `research/video-02/script_v1.json` (`scenes[].numbers[]`, fields `show` and `spoken`): "1 DARI 5" / "satu dari lima"; "2013" / "dua ribu tiga belas"; "80,51%" / "delapan puluh koma lima satu persen"; "2025" / "dua ribu dua puluh lima"; "99,83%" / "sembilan puluh sembilan koma delapan tiga persen"; "2 PER 1.000" / "dua per seribu"; "2023" / "dua ribu dua puluh tiga"; "93,82%" / "sembilan puluh tiga koma delapan dua persen"; "14,06%" / "empat belas koma nol enam persen".
- Data strings in the CSVs use a dot as the decimal separator and keep the printed decimals (`research/video-02/re_national.csv` column `ratio_pct`; `research/video-02/re_province.csv` columns `re_total`, `re_pln`).

## Goal
A `video-02/` folder that builds like the template, and a tested number library that turns data strings into the exact on-screen and spoken forms the script uses.

## Changes allowed
- Create `docs/prd/11-video02-scaffold.md` (this PRD, verbatim).
- Create `video-02/` with only:
  - copied unchanged from `template/`: `AGENTS.md`, `CLAUDE.md`, `components/sos.js`, `components/sos.css`, `src/template.html`, `tools/build.mjs`, `vendor/gsap.min.js`, `vendor/LICENSES/*`, `assets/fonts/*`, `assets/map/**`, `hyperframes.json`, `scenes.json` (a placeholder until PRD-12);
  - `meta.json`: `{"id": "video-02", "name": "video-02-hari-listrik-nasional", "createdAt": "<current UTC time, ISO 8601>"}`;
  - `package.json`: the template's, with `"name": "video-02-hari-listrik-nasional"` and without the `make-map` script;
  - `tools/lib/cue.mjs` and `tools/lib/csv.mjs`, copied unchanged from `video-01/tools/lib/`;
  - `tools/lib/nums.mjs`: a copy of `video-01/tools/lib/nums.mjs` plus the functions below;
  - `tools/test_nums.mjs`: the tests below.
- Do not copy `README.md`, `demo.mp4`, `index.html` or `tools/make-map.mjs`. Do not run any build inside `video-02/` in the repo (it would write `index.html`); use a scratch copy.
- No other repo file may change.

## Steps
1. Save this PRD verbatim.
2. Create the folder and copies as listed. `cmp` every copied file against its source and print the result.
3. Add to `video-02/tools/lib/nums.mjs` (keep every existing export unchanged; match the file's style: ES module, short comments, plain functions):
   - `fmtPct(printed)`: input a data string like "80.51" (digits, optional dot and digits). Output the same digits with a comma for the dot and a "%" suffix: "80,51%". Keep every printed decimal ("100.00" -> "100,00%", "88.3" -> "88,3%"). Throw on anything else.
   - `spokenPct(text)`: input "80,51%". Output the integer part with `intWords`, then, if there are decimals, " koma " and the decimals with `digitWords`, then " persen": "delapan puluh koma lima satu persen". Throw if the input is not in the `fmtPct` output form.
   - `fmtInt(n)`: non-negative integer with "." as the thousands separator: 1000 -> "1.000", 5 -> "5". Throw on non-integers and negatives.
4. Write `video-02/tools/test_nums.mjs` using `node:assert/strict`. It prints one line per check and exits non-zero on the first failure. Checks:
   - fmtPct: "80.51" -> "80,51%"; "88.3" -> "88,3%"; "100.00" -> "100,00%"; "14.06" -> "14,06%"; "abc" throws; "1,5" throws.
   - spokenPct: "80,51%" -> "delapan puluh koma lima satu persen"; "99,83%" -> "sembilan puluh sembilan koma delapan tiga persen"; "93,82%" -> "sembilan puluh tiga koma delapan dua persen"; "14,06%" -> "empat belas koma nol enam persen"; "88,3%" -> "delapan puluh delapan koma tiga persen"; "100,00%" -> "seratus koma nol nol persen"; "80.51" throws.
   - spokenInt: "2013" -> "dua ribu tiga belas"; "2023" -> "dua ribu dua puluh tiga"; "2025" -> "dua ribu dua puluh lima".
   - intWords: 1 -> "satu"; 2 -> "dua"; 5 -> "lima"; 1000 -> "seribu". fmtInt: 1000 -> "1.000"; 5 -> "5"; -1 throws; 1.5 throws.
   - Script tie-in: read `research/video-02/script_v1.json` (path relative to the repo root, resolved from the test file's location). For every `numbers[]` entry whose `show` ends in "%": `spokenPct(show) === spoken`. For every entry whose `show` is four digits: `spokenInt(show) === spoken`. Print each pair.
   - Data tie-in: read the two CSVs with `parseCsv` from `tools/lib/csv.mjs`. Check `fmtPct(re_national 2013 ratio_pct) === "80,51%"`, `fmtPct(re_national 2025 ratio_pct) === "99,83%"`, `fmtPct(Papua Pegunungan re_total) === "93,82%"`, `fmtPct(Papua Pegunungan re_pln) === "14,06%"`, and that each of these four strings is a `show` value in the script.
5. Run `node video-02/tools/test_nums.mjs` from the repo root. Paste the full output.
6. Scratch build check: `cp -r video-02 <scratch>/v02copy`, then in the copy run `node tools/build.mjs` and `npx --yes hyperframes@0.8.206 check`. Paste the build output and the check summary (error, warning and info counts, and the last 30 lines). The HyperFrames browser is already installed under `/root/.cache/hyperframes`.
7. `git status --short --untracked-files=all`.

STOP and report if: a test fails (do not change expected values); a copied file differs from its source; any repo file outside the allowed list changes.

## Acceptance
- `node video-02/tools/test_nums.mjs` exits 0 and prints every check.
- Every copy is identical to its source (`cmp`).
- The scratch build succeeds and `hyperframes check` reports 0 errors.
- git status lists only the PRD and files under `video-02/`.

## Budget
0 paid calls.

## Report
Paste verbatim: the `cmp` results, the new functions as written in `nums.mjs` (the added lines only), the test output, the scratch build and check output, and the git status.

## Outcome (2026-10-28 WIB, measured)
- `video-02/` created: 23 files copied unchanged from `template/` and `video-01/tools/lib/` (all `cmp` identical), plus `meta.json`, `package.json`, `tools/lib/nums.mjs` (19 lines added: `fmtPct`, `spokenPct`, `fmtInt`) and `tools/test_nums.mjs`.
- `node video-02/tools/test_nums.mjs`: all checks pass, including the tie-in of every percent and year in `research/video-02/script_v1.json` to the CSVs. Re-run by the main agent.
- Scratch build of a copy: 4 demo scenes, 12 s; `hyperframes check` 0 errors, 0 warnings, 1 info (`audio_none`).
- `scenes.json` is still the template demo; PRD-12 replaces it.
