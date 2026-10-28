# PRD-07: video-02 data research (electrification ratio)

## Context
Verified on 2026-10-27 UTC by the main agent.

- Video-02: Hari Listrik Nasional. The user chose the electrification ratio (rasio elektrifikasi) with a "progress" angle: how household access to electricity grew over the years, plus where the remaining gap is. Base: option C (PRD-06).
- Official source found: Kementerian ESDM, *Handbook of Energy and Economic Statistics of Indonesia* (HEESI). These URLs answered HTTP 200 with `Content-Type: application/pdf` from this container:
  - 2025 edition: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf (Content-Length 10962809)
  - 2024 edition: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf (Content-Length 15477022)
- What the PDFs contain was NOT checked: whether they have a national electrification-ratio series, a per-province table, or a definition.
- News reports (not used as data, context only, unverified): national ratio 99.83% at end of 2024; the ratio counts households with PLN, non-PLN and LTSHE (government solar lamp) electricity.
- `gatrik.esdm.go.id` answers HTTP 200 but is a JavaScript single-page app; a PDF URL found in search returned a 1532-byte HTML page, not a PDF.
- `bps.go.id` returns 403 to this container. Never get around the BPS block in any way (no mirrors, caches or proxies). The user downloads BPS files by hand.
- Tools present: curl, pdftotext, pdfinfo, pdftoppm, python3 with pypdf 6.17.0 and pdfplumber 0.11.10.
- video-01's research layout: raw file kept unchanged, re-runnable merge script, `sources.md` with sha256 (`research/sources.md`).

## Goal
Get the official numbers for the electrification ratio into `research/video-02/`, unchanged at the source and extracted by a re-runnable script:
1. the national ratio as a yearly series (as many years as the source gives);
2. the ratio per province for the latest year available, if the source has it;
3. the official definition or technical note for the ratio, quoted verbatim with its page.
No script, story, or visuals in this task.

## Changes allowed
- Create `docs/prd/07-video02-research.md` (this PRD, verbatim).
- Create under `research/video-02/` only: `raw/` (downloaded files, unchanged), `tools/extract.py`, `re_national.csv`, `re_province.csv` (only if a per-province table exists), `sources.md`.
- Everything else (page renders, text dumps, logs) goes to the scratch directory. No other repo file may change.

## Steps
1. Save this PRD verbatim.
2. Download both HEESI PDFs listed in Context with `curl -sS -L --fail -o research/video-02/raw/<basename of the URL> <url>`. For each: HTTP status, bytes (`stat -c %s`), `sha256sum`, `file` output, and `pdfinfo` (Title, Creator, Producer, CreationDate, Pages). STOP if a download fails or is not a PDF.
3. Locate. Run `pdftotext -layout` on each PDF into scratch. Search case-insensitively for: `electrification`, `elektrifikasi`, `ratio`, `household`, `rumah tangga`, `LTSHE`. For each hit that belongs to a table or a definition, report: edition, PDF page index (1-based, as `pdftotext -f N -l N` uses it), the printed page number if visible, the table title verbatim, and the table text verbatim (all lines of that table from `pdftotext -layout -f N -l N`). Render each such page to PNG in scratch with `pdftoppm -r 110 -png -f N -l N`. List the PNG paths.
4. Extract with `research/video-02/tools/extract.py` (run with `python3 -I`). It reads only the PDFs in `research/video-02/raw/` and writes:
   - `re_national.csv`: columns `year,ratio_pct,edition,pdf_page,table_title`. One row per year from the 2025 edition. Keep the value exactly as printed (same decimals); use a dot as the decimal separator.
   - `re_province.csv` (only if a per-province table exists): columns `province,year,ratio_pct,edition,pdf_page,table_title`. Province names exactly as printed.
   - The script hard-codes the edition file name and the page index found in step 3, and fails loudly if the table title is not on that page.
   If the table cannot be read without guessing (merged cells, values split across lines, unclear which column is which year), STOP that table: do not write its CSV; report the verbatim text and the PNG path.
5. Cross-check. For every year that appears in both editions, compare the 2024 and 2025 values and list any differences (revisions). Do not change any value.
6. Older editions, availability only: send a HEAD request (`curl -sS -I -L`) to the same URL pattern with 2020 and 2015 in place of the year. Report the status line and Content-Type. Do not download them.
7. If no per-province table is in either PDF: run at most 3 web searches for an official per-province electrification-ratio table (esdm.go.id or gatrik.esdm.go.id), and at most 3 downloads, only of PDF URLs on those two hosts. Report what you found, with the exact URLs. Do not use news or third-party sites as data. Do not access bps.go.id; if a search result names a BPS table, report its name only, for the user to download by hand.
8. Write `research/video-02/sources.md`: per file the URL, access date (UTC), HTTP status, bytes, sha256, pdfinfo fields, and the pages used; the definition quoted verbatim with its page; the list of revisions from step 5; anything not verified.

STOP and report if: any repo file outside the allowed list changes (check `git status`); a step needs a host other than esdm.go.id or gatrik.esdm.go.id (web search excepted); a value would have to be guessed.

## Acceptance
- `sha256sum research/video-02/raw/*` matches `sources.md`.
- Run `python3 -I research/video-02/tools/extract.py` twice; `diff` of the two outputs is empty (copy the CSVs to scratch between runs).
- For every CSV row, the value string as printed appears in the `pdftotext -layout` text of its `pdf_page`. Print matched/total per CSV.
- `git status --short --untracked-files=all` lists only `docs/prd/07-video02-research.md` and files under `research/video-02/`.

## Budget
0 paid calls. Network: esdm.go.id and gatrik.esdm.go.id, plus at most 3 web searches. About 26 MB of downloads.

## Report
Paste verbatim: step 2 (per file), step 3 (every table and definition found, with page and PNG path), the CSV contents in full, the step 5 revision list, step 6 status lines, step 7 results, the Acceptance outputs, and a list of what failed or was not verified.

## Outcome (2026-10-28 WIB, measured)
- HEESI 2025 and HEESI 2024 downloaded (sha256 in `research/video-02/sources.md`). Each has one headline ratio (99.83 for 2025 and for 2024), no series, no per-province table and no definition.
- Found in LK 2023 (www.esdm.go.id, accepted as in scope): the definition (printed pages 155-156), Tabel 58 per province (Triwulan IV 2023) and Tabel 61 (2023 = 99,79%). The main agent found the 2013-2022 chart (Gambar 48) that this task missed; PRD-07b covers it.
- Over budget: 51.35 MB downloaded against about 26 MB planned. No paid calls.
- User decision (2026-10-28): raw PDFs are not committed; URLs and sha256 are.
