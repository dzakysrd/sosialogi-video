# PRD-22: video-03 build and lint (no render)

## Context
- `video-03/` is an unchanged copy of the video-02 engine (PRD-19). `tools/build.mjs` reads two fixed tables, `cfg.inputs.national` and `cfg.inputs.province`, through `natRow`, `provRow` and `refValue` (keys `year` and `province`), and its `CHECKS` are video-02's. `tools/lint.mjs` reads the built timeline and has no data-specific code. Scene renderers are in `components/sos.js` and `components/sos.css`.
- Script: `research/video-03/script_v2.json` (110 words, scenes s1_hook, s2_neet, s3_caveat, s4_tpt, s5_provinces, s6_close). Take: `voice/samples/video-03/el_liam_close2` (43.08 s).
- Data: `research/video-03/neet_province.csv` (key `province`, value `neet_pct`, `is_national` 1 only for INDONESIA, column `year`), `research/video-03/tpt_age.csv` (key `age_group`, value `tpt_pct`, column `year`).
- Gates: hook 3.5 s, total 45 s, close 7.5 s (raised from 7.2 by the user on 2026-10-28 for the close-B line). Measured on the take: hook 3.40, close 7.41, total 43.08.
- Lint counts captions as a text block; the limit is 3 visible text blocks per frame.

## Goal
`video-03` builds from its own config and data, and `node tools/lint.mjs` passes, with the visual plan below. No render.

## Changes allowed
- `docs/prd/22-video03-build.md` (this PRD).
- In `video-03/`: `video.config.json`, `scenes.json`, `tools/build.mjs`, `components/sos.js`, `components/sos.css`, and the files the build writes (`index.html`, `build/timeline.json`, `assets/vo/vo.mp3`, `assets/vo/words.json`, `assets/vo/sentences.json`).
- Nothing else. Do not change `tools/lint.mjs`, `tools/lib/*`, the script, the data, the take, or any gate value other than `close_max_s`.

## Steps
1. Save this PRD verbatim.
2. `video-03/video.config.json`: as video-02's, with `"close_max_s": 7.5`; `voice` = `{"dir": "../voice/samples/video-03", "variant": "el_liam_close2"}`; `inputs` = `{"script": "../research/video-03/script_v2.json", "tables": {"neet": {"path": "../research/video-03/neet_province.csv", "key": "province"}, "tpt_age": {"path": "../research/video-03/tpt_age.csv", "key": "age_group"}}, "scenes": "scenes.json"}`; `"output": "out/v1.mp4"`. Keep every other key and value.
3. `tools/build.mjs` (match its style: short comments, plain functions):
   a. Load every table in `cfg.inputs.tables` into a `TABLES` map `{name: {rows, key}}`. Remove `national`, `province`, `natRow`, `provRow`. `refValue` looks up `TABLES[ref.from]` and its key column; unknown table or row throws as before. `as: "year"` and `as: "pct"` behave as before.
   b. Replace `CHECKS` with (each returns `{ok, values}` like the old ones; rows with `is_national` "1" are excluded from province rankings; ties count as not strictly highest/lowest):
      - `neet_one_in_five`: 18 <= neet[INDONESIA].neet_pct < 20.
      - `neet_highest_sulut`: SULAWESI UTARA has the strictly highest neet_pct of the 38 provinces.
      - `neet_lowest_bali`: BALI has the strictly lowest neet_pct of the 38 provinces.
      - `tpt_1519_highest`: 15-19 has the strictly highest tpt_pct of the age groups, Rata-Rata excluded.
      - `years_since_1928`: 2026 - 1928 === 98.
   c. `rankbars` and `grid` stay, but must not reference removed variables: `rankbars` takes its table from `p.rows.from` (default error if absent). They are not used by video-03.
   d. `pair` resolver: optional `subtitle` (text, no digits) and optional `title_num` (a number element via `numEl`, shown at its cue) in the title block. A row has either `year` (number element, as before) or `label` `{lines: [text], cue?, check?}` (text; shown at its cue, or at the part start without one; `checkRef` its check and fail the build if the check is false). `value` as before.
   e. `close` resolver: a block item may carry an optional `num` (number element, shown at its cue) after its lines.
   f. Update the header comments to video-03.
4. `components/sos.js` / `sos.css`: render the new pair fields (subtitle line and title_num inside the pair-title block; a row label in the pair-year slot, appearing at its time; the track appears with the year or label) and the close block `num` (inside the same block as its lines, appearing at its time). Keep existing renderers' behaviour for video-02-style input.
5. `video-03/scenes.json` (keep the `_help` key, updated to the new fields), one entry per script scene:
   - s1_hook: claim; kicker "ANAK MUDA"; lines ["TIDAK SEKOLAH,", "TIDAK KERJA"]; reveal `{"text": "HAMPIR 1 DARI 5", "spoken": "satu dari lima", "cue": "satu dari lima", "caption": "1 dari 5", "check": "neet_one_in_five"}`.
   - s2_neet: pair; title "NEET"; subtitle "tidak sekolah, kerja, atau pelatihan"; title_num `{"text": "USIA 15-24", "spoken": "lima belas sampai dua puluh empat", "cue": "lima belas sampai dua puluh empat", "caption": "15-24"}`; one row: year `{"from": "neet", "key": "INDONESIA", "field": "year", "as": "year", "cue": "dua ribu dua puluh lima"}`, value `{"from": "neet", "key": "INDONESIA", "field": "neet_pct", "as": "pct", "cue": "sembilan belas koma empat empat persen"}`.
   - s3_caveat: two textcards: part 0 to "cari kerja", lines ["BUKAN UKURAN", "MALAS"]; part 1 from "cari kerja", lines ["YANG CARI KERJA &", "MENGURUS KELUARGA", "IKUT TERHITUNG"].
   - s4_tpt: pair; title "PENGANGGURAN TERBUKA"; subtitle "dari angkatan kerja"; one row: year `{"text": "USIA 15-19", "spoken": "lima belas sampai sembilan belas", "cue": "lima belas sampai sembilan belas", "caption": "15-19", "check": "tpt_1519_highest"}`, value `{"from": "tpt_age", "key": "15-19", "field": "tpt_pct", "as": "pct", "cue": "dua puluh tiga koma tiga empat persen"}`.
   - s5_provinces: pair; title "NEET PER PROVINSI"; subtitle "tertinggi dan terendah"; rows: label `{"lines": ["SULAWESI UTARA"], "cue": "Sulawesi Utara", "check": "neet_highest_sulut"}` with value neet SULAWESI UTARA neet_pct pct cue "dua puluh sembilan koma lima dua persen"; label `{"lines": ["BALI"], "cue": "Bali", "check": "neet_lowest_bali"}` with value neet BALI neet_pct pct cue "lima koma tiga tiga persen".
   - s6_close: close; block [`{"cue": "Itu PR", "lines": ["ITU PR PEMUDA", "HARI INI"]}`, `{"cue": "Selamat", "lines": ["SELAMAT HARI", "SUMPAH PEMUDA"], "num": {"text": "KE-98", "spoken": "ke sembilan puluh delapan", "cue": "ke sembilan puluh delapan", "caption": "ke-98", "check": "years_since_1928"}}`]; card `{"cue": "Yuk", "cta": {"script": "cta"}, "sources": {"script": "sources_line"}}`.
   If the cue resolver cannot find a cue, report it; do not change the script or take.
6. In a fresh container the lint's browser probe needs the HyperFrames browser: run `npx --yes hyperframes@0.8.206 browser ensure` once (report its last lines; STOP if it fails).
7. `cd video-03 && node tools/build.mjs` then `node tools/lint.mjs`. Paste the build's gates, data checks, scenes and numbers output, and the full lint output. If the lint fails on layout (safe box, overlap, text size, block count), fix only `sos.css` / `sos.js` / layout fields in `scenes.json` (sizes, never text, cues, numbers, gates) and re-run; report each attempt. STOP after 4 failed attempts and report.
8. Frames for review without an MP4: `npx --yes hyperframes@0.8.206 snapshot --at <times>` from `video-03/` (see video-03/CLAUDE.md), at: 0.3, the s1 reveal cue + 0.5, each number cue in s2, s4 and s5 + 0.5, the s3 part-1 start + 0.5, the "Itu" cue + 0.5, the "ke sembilan" cue + 0.5, the "Yuk" cue + 1.0, total - 0.3. Put the PNGs in scratch (move them out of the repo if the tool writes inside it). Make a contact sheet: `python3 video-01/build/v3/sheet.py <scratch>/sheet.jpg 5 <frames in time order>` from the repo root. List the frame paths with their times.
9. `node video-02/tools/build.mjs` must still not be affected (do not run it in the repo; just confirm with `git status` that nothing under `video-02/` changed). `git status --short --untracked-files=all`.

STOP and report if: a data check is false; the take/script word check fails; a gate fails; the lint fails after 4 attempts; any file outside the allowed list changes.

## Acceptance
- Build prints all 5 data checks true and gates hook 3.40 / close 7.41 (limit 7.5) / total 43.08 (within 0.01).
- `node tools/lint.mjs` passes.
- Contact sheet exists; frames listed.
- git status: only this PRD and allowed files under `video-03/` (plus any snapshot folder removed or ignored).

## Budget
0 paid calls. Network: npm registry for `npx hyperframes@0.8.206` only.

## Report
Paste verbatim: the build output, the lint output (every attempt), what you changed in sos.js / sos.css (diff stat and a short summary), the frame list and the contact sheet path, the git status. Say what failed or was not verified.

## Outcome (2026-10-28, measured)
- Build: 5 data checks true; gates hook 3.402 / close 7.408 (limit 7.5, raised by the user) / total 43.084 s. Lint PASS on the second attempt (first: pair title and chart overlapped; fixed by moving them in sos.css).
- Engine changes: generic `inputs.tables`, video-03 checks, pair subtitle / title_num / row label, close block num. Contact sheet reviewed by the main agent; the s5 label spacing was fixed in PRD-23.
