# PRD-07b: video-02 research, part 2 (series, provinces, newer sources)

## Context
Verified by the main agent on 2026-10-27 UTC, from the PRD-07 outputs.

- PRD-07 put two HEESI PDFs in `research/video-02/raw/` (sha256 match `sources.md`). HEESI has only one headline ratio per edition: 99.83 for 2025 (HEESI 2025, PDF page 11) and 99.83 for 2024 (HEESI 2024, PDF page 10). No series, no per-province table, no definition.
- Laporan Kinerja Kementerian ESDM 2023 ("LK 2023") is in scratch: `.../scratchpad/prd07/dl2023/content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf`, sha256 4372c7fe6bcca5273918fc554922c0ed7fc88fc728384bf6c9d2a19497b5e953, from https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf. `www.esdm.go.id` is accepted as in scope (same ministry).
  - Tabel 58 (PDF pages 173-174, printed 157-158): ratio per province, Triwulan IV 2023, 38 provinces, columns RE PLN, RE Non PLN, RE LTSHE, RE TOTAL. The main agent checked the render against the PRD-07 transcription; they match.
  - Gambar 48 (PDF page 174, printed 158) contains a bar chart titled "RE 2013 - 2022". It is a raster image, not text. The main agent read these labels from a 300 dpi render: 2013 80,51; 2014 84,35; 2015 88,3; 2016 91,16; 2017 95,35; 2018 98,3; 2019 98,89; 2020 99,2; 2021 99,45; 2022 99,63. The same figure shows "Triwulan III 2023 99,74%" and "Triwulan IV 2023 99,79%".
  - Tabel 61 (PDF page 183, printed 167): national 2023 = 99,79%. The text on printed pages 167-168 says 2022 = 99,63%.
  - The definition of the ratio is on PDF pages 171-172 (printed 155-156), quoted in PRD-07's report.
- Laporan Kinerja Kementerian ESDM 2025 ("LK 2025") is in scratch (`.../scratchpad/prd07/dl2025/`), sha256 c5d87cabd111a997662cca777a60276c141bafecc8c0518b2cf30dfdc08e9550. PDF 39: 99,83% at end of 2024. PDF 76: 99,83% "hingga Desember 2025". No per-province table.
- Not yet checked: Laporan Kinerja Ditjen Ketenagalistrikan 2024, https://esdm.go.id/assets/media/content/content-laporan-kinerja-ditjen-ketenagalistrikan-tahun-2024.pdf (HEAD 200, application/pdf, 15241622 bytes). A search snippet (unverified) says it has a 2024 per-province ratio map. HEESI 2020 edition: same URL pattern as HEESI 2024 with 2020 (HEAD 200, application/pdf, 2809075 bytes).
- Whether raw PDFs get committed is not decided. Put them in `research/video-02/raw/` for now; nothing is committed in this task.

## Goal
1. A national yearly series 2013-2025 in `re_national.csv`, each row with its source and how it was read.
2. `re_province.csv` from LK 2023 Tabel 58 with all four columns, plus a 2024 per-province table if an official text table exists.
3. An independent check of the Gambar 48 labels, and a cross-check of older years against HEESI 2020 if it has a series.

## Changes allowed
- Create `docs/prd/07b-video02-research-2.md` (this PRD, verbatim).
- Under `research/video-02/` only: copy LK 2023 (and LK 2025) into `raw/` from scratch (verify sha256 after copying), add any new official PDF used for data to `raw/`, update `tools/extract.py`, rewrite `re_national.csv`, create `re_province.csv`, update `sources.md`.
- Everything else goes to scratch. No other repo file may change.

## Steps
1. Save this PRD verbatim.
2. Copy LK 2023 and LK 2025 from the PRD-07 scratch into `research/video-02/raw/` (same file names). `sha256sum` both; they must equal the Context values, else STOP.
3. Independent read of Gambar 48. Render LK 2023 PDF page 174 with `pdftoppm -r 300 -png -f 174 -l 174`, crop or view the chart titled "RE 2013 - 2022", and read every year label and value label yourself with the Read tool. Report your reading as a list. Then compare with the main agent's reading in Context. Report every difference. Do not "fix" either reading; if any label is unreadable, say which.
4. `re_national.csv`, new columns: `year,ratio_pct,source,pdf_page,locator,method`.
   - 2013-2022: source `LK 2023`, pdf_page 174, locator `Gambar 48 (chart RE 2013 - 2022)`, method `chart_label` (value labels printed in a raster image, transcribed). Use the values only if step 3 found no difference; otherwise STOP and report.
   - 2023: `LK 2023`, 183, `Tabel 61`, method `text`.
   - 2024: `HEESI 2024`, 10, `Indonesia's Concise Energy Profile 2024, D`, `text`.
   - 2025: `HEESI 2025`, 11, `Indonesia's Concise Energy Profile 2025, D`, `text`.
   - Values keep the printed decimals, with a dot as the separator (e.g. 88,3 -> 88.3).
   - `extract.py` reads the text rows from the PDFs as before (fail loudly if the expected label is not on the page). The chart_label rows are a hard-coded table in `extract.py` with a comment naming the PDF, page and figure, and the script checks that the text "Gambar 48" is on PDF page 174.
5. `re_province.csv`, columns `province,year,re_pln,re_non_pln,re_ltshe,re_total,source,pdf_page,locator`. Rows: the 38 provinces of LK 2023 Tabel 58 (Triwulan IV 2023), extracted from the text layer by `extract.py`. A printed "-" becomes an empty cell. Exclude the TOTAL row, but print a check that the 38 rows exist and that the TOTAL row reads 98,33 / 1,05 / 0,41 / 99,79.
6. Ditjen Gatrik LK 2024: download to scratch (URL in Context). `pdfinfo`, sha256, bytes. Search its text for `Rasio Elektrifikasi`, `provinsi`, `LTSHE`, `Tabel`. If it has a per-province ratio table in text form for 2024 (or a later period), report title, pages and the table text verbatim, render the pages to PNG in scratch, copy the PDF into `raw/`, and add its rows to `re_province.csv` with their year. If it only has a map image, report the page and do NOT transcribe the map.
   Also send a HEAD request to the same URL with `tahun-2025` in place of `tahun-2024`. If it is HTTP 200 and application/pdf, download it to scratch and do the same search. Report either way.
7. HEESI 2020: download to scratch (URL pattern in Context). Search for `electrification` / `elektrifikasi`. If it has a series of the national ratio in text, report the table verbatim with its page, and list per year the difference against `re_national.csv`. Do not add it to the CSV.
8. Update `sources.md`: add every file used (URL, access date UTC, HTTP status, bytes, sha256, pdfinfo fields, pages used), the definition quote (LK 2023, printed 155-156), the chart_label note for 2013-2022, the step 3 comparison, the step 7 comparison, and what is not verified.

STOP and report if: a sha256 does not match; any repo file outside the allowed list changes; a value would have to be guessed; step 3 finds a difference.

## Acceptance
- `sha256sum research/video-02/raw/*` matches `sources.md`.
- `python3 -I research/video-02/tools/extract.py` run twice gives identical CSVs (copy to scratch between runs and `diff`).
- Every `text` row's value string, as printed (decimal comma), appears in the `pdftotext -layout` text of its page. Print matched/total per CSV.
- For `re_province.csv`: for each row, |re_pln + re_non_pln + re_ltshe - re_total| <= 0.02 (empty = 0). Print the largest difference and any row above 0.02.
- `re_national.csv` has 13 rows, years 2013-2025, no gaps.
- `git status --short --untracked-files=all` lists only the PRD-07 and PRD-07b files and files under `research/video-02/`.

## Budget
0 paid calls. Downloads: about 15 MB (Ditjen LK 2024), 3 MB (HEESI 2020), plus Ditjen LK 2025 if it exists. Hosts: esdm.go.id and www.esdm.go.id only. No web searches. No bps.go.id.

## Report
Paste verbatim: step 2 hashes, your step 3 reading and the comparison, both CSVs in full, step 6 and 7 findings with pages, the Acceptance outputs, and what failed or was not verified.

## Outcome (2026-10-28 WIB, measured)
- `re_national.csv`: 13 rows, 2013-2025. 2013-2022 are chart labels from LK 2023 Gambar 48, read independently by the main agent and the sub-agent with no difference. 2019-2022 also match the text of LK 2023 Gambar 52 (PDF 183) and Ditjen LK 2024 Gambar 41 (PDF 181); 2020 matches HEESI 2020 (99.20). 2013-2018 have no text cross-check.
- `re_province.csv`: 38 rows, Triwulan IV 2023. Every printed value was found on its page, and PLN + non-PLN + LTSHE equals the total in every row (largest difference 0.00).
- No newer per-province table in text form: Ditjen LK 2024 has only a map image (Gambar 37, PDF 179). The Ditjen LK 2025 URL returned 404.
- Inconsistencies in the sources, not used: the household counts on LK 2023 printed page 156 do not add up; Ditjen LK 2024 PDF 205 components sum to 99,82 against a stated 99,83.
- `extract.py`: two runs identical. Reviewed by the main agent: both CSVs, the `sources.md` structure, the Tabel 58 and Gambar 48 renders, and the text of LK 2023 PDF 183 and Ditjen LK 2024 PDF 181.
- Raw PDFs are not committed (user decision); `tools/fetch.sh` re-downloads and checks them. Cited pages are committed as PNG in `research/video-02/pages/`.
