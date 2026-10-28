# PRD-18: video-03 research (Hari Sumpah Pemuda): data and angle

Status: draft, waiting on the user (angle choice and BPS downloads). Steps 2-7 do not start until the user has chosen an angle and put the BPS files in `research/video-03/raw/`.

## Context
Checked by the main agent on 2026-10-28.

- Video-03 topic: Hari Sumpah Pemuda (28 October), requested by the user (HANDOFF.md, Next steps 5). PR #2 is merged into `main` (commit 8ac9372).
- Engine: copy `video-02/` to `video-03/`. That copy is a separate PRD (scaffold), not this one. Scene types available: claim, pair, grid, textcard, rankbars, stack, close. No line chart, no map.
- `bps.go.id` is blocked from the container. Never get around the block (no mirrors, caches, proxies, or third-party copies of BPS tables used as data). The user downloads BPS files by hand.
- Age definitions differ, and the video must say which one it uses:
  - "Pemuda" in Indonesian law (UU No. 40/2009 tentang Kepemudaan) is age 16-30. BPS's "Statistik Pemuda Indonesia" uses 16-30.
  - Labour indicators (open unemployment by age group, NEET, SDG 8.6.1) use 15-24.
- Context only, from media and goodstats.id citing BPS; NOT verified against BPS tables, not to be used as data (`unverified-media`):
  - Open unemployment (TPT) August 2025: national 4.85%; age 15-24 about 16.89%; 25-59 2.93%; 60+ 1.71%.
  - NEET age 15-24 in 2024: 20.31%; by province, Bali lowest (7.26%), Papua Tengah highest (31.20%).
  - Youth (16-30) in 2025: about 66.83 million, 23.5% of the population.
- Data timing (unverified): Sakernas August 2026 is usually released in early November, so on 2026-10-28 the latest labour figures are probably February 2026 (or August 2025 for the full annual set). The user should take the latest period shown on bps.go.id.

## Candidate angles (the user chooses one)

A. "Pemuda dan kerja" (recommended). One in six young people in the labour force is unemployed, against about one in thirty-four adults aged 25-59 (the ratios are to be recomputed from BPS data, not from the media figures above). Then: which provinces have the most NEET youth. Fits the engine: claim (hook), pair (15-24 vs 25-59), stack or bars (series over years), rankbars (top and bottom provinces), close.
B. "Pemuda dulu dan sekarang". The share of youth in the population and their education level over time (Statistik Pemuda Indonesia). Softer; fewer clear contrasts.
C. "Bahasa persatuan". How many people speak Indonesian at home, versus a regional language. Fits the third oath best, but the main agent could not confirm that a recent BPS table exists (Sensus Penduduk 2010 had a language question; Long Form SP2020 is unknown). Highest risk.

## BPS tables the user downloads (for angle A)
Table names below are search terms, not exact titles; the main agent has not seen them. On bps.go.id, use the search box or "Tabel Statistik". Download as CSV or XLSX (the original export, unedited). Note the exact title, URL, and download date for each.

1. Tingkat Pengangguran Terbuka (TPT) menurut kelompok umur. Needed: 15-24, 25-59, 60+ and total; the latest period, plus as many years back as offered (at least 2015-latest, August period).
2. Persentase pemuda usia 15-24 tahun yang tidak sekolah, tidak bekerja, atau tidak mengikuti pelatihan (NEET), menurut provinsi. Needed: all 38 provinces plus Indonesia, latest year, and the national figure for earlier years if offered. It may be listed under SDGs indicator 8.6.1.
3. Optional: Jumlah dan persentase penganggur menurut kelompok umur (for "how many people" alongside the rate).
4. Optional: the PDF "Statistik Pemuda Indonesia" (latest edition) for the 16-30 definition and the youth-population figure, if the video mentions it.

For angle B: tables 4 plus "Persentase penduduk usia 16-30 tahun menurut pendidikan tertinggi yang ditamatkan" (series). For angle C: any BPS table on "bahasa sehari-hari" or "bahasa yang digunakan di rumah"; if none exists, angle C is dropped.

## Goal
After the user chooses the angle and downloads the files: put the BPS numbers into `research/video-03/` unchanged at the source and extracted by a re-runnable script, with sources recorded. No script, story text or visuals in this task.

## Changes allowed
- `docs/prd/18-video03-research.md` (this PRD).
- Under `research/video-03/` only: `raw/` (the user's downloads, unchanged), `tools/extract.py`, the output CSVs named in step 4, `sources.md`.
- Everything else goes to scratch. No other repo file may change.

## Steps
1. Save this PRD verbatim.
2. (After the user's downloads.) List `research/video-03/raw/`: per file, bytes, sha256, `file` output. For CSV/XLSX, print the first 15 rows and the header verbatim. STOP if a file is HTML, empty, or not the table named by the user.
3. For each table, report verbatim: title, period, unit, age groups or provinces present, footnotes, and any value marked provisional or revised.
4. `tools/extract.py` (run with `python3 -I`) reads only `raw/` and writes, for angle A:
   - `tpt_age.csv`: `period,age_group,tpt_pct,source_file`. Values as printed, dot as decimal separator.
   - `neet_province.csv`: `province,year,neet_pct,source_file`. Province names as printed. Indonesia row kept and marked; check that 38 provinces exist.
   - `neet_national.csv` (only if a series exists): `year,period,neet_pct,source_file`.
   The script fails loudly if an expected header or age group is missing. If a value can only be read by guessing (merged cells, unclear columns), STOP that table and report it.
5. Cross-check: compare the latest TPT and NEET values with the media figures in Context and list every difference. Do not change any value; the BPS file wins.
6. Write `sources.md`: per file the exact BPS title, URL given by the user, download date, bytes, sha256, the definitions (age bands, NEET definition) as printed, the step 5 differences, and what is not verified.
7. Report. Do not pick the story numbers; the main agent and the user do that in the script PRD.

STOP and report if: any repo file outside the allowed list changes; a value would have to be guessed; a step needs bps.go.id or any other host (no network is needed in this task).

## Acceptance
- `sha256sum research/video-03/raw/*` matches `sources.md`.
- `python3 -I research/video-03/tools/extract.py` run twice gives identical CSVs (copy to scratch and `diff`).
- Every CSV value string appears in its raw file (matched/total per CSV).
- `neet_province.csv` has 38 province rows plus Indonesia.
- `git status --short --untracked-files=all` lists only this PRD and files under `research/video-03/`.

## Budget
0 paid calls. No network, no web searches. No bps.go.id.

## Report
Paste verbatim: step 2 and 3 outputs, all CSVs in full, the step 5 differences, the Acceptance outputs, and what failed or was not verified.

## Amendment (2026-10-28, main agent)
- Angle: A ("Pemuda dan kerja"). The user left the choice to the main agent.
- The user downloaded three XLSX files from bps.go.id by hand. The upload tool added a hash prefix to each name; in `raw/` they are stored without that prefix, bytes unchanged:
  - `Tingkat_Pengangguran_Terbuka_Berdasarkan_Kelompok_Umur_2025.xlsx` (sha256 b91a9d2e1eb69b16264dc92701d4e9fd33e53c86f5081e060e86fc6e7ba51f94)
  - `Persentase_Usia_Muda_15-24_Tahun_Yang_Sedang_Tidak_Sekolah_Bekerja_Atau_Mengikuti_Pelatihan_2025.xlsx` (sha256 cba8e888a8025b5cc25c52c8fa29ab7b2aec798c21910527b42d8be853295db5)
  - `Tingkat_Pengangguran_Terbuka_Menurut_Provinsi_2026.xlsx` (sha256 c25ad70aa39194f22988fd45c4c0adaba667353de63abab10ed76e9c756baaa5)
- What the files contain (checked by the main agent): TPT by five-year age group for 2025 only (15-19 to "60 keatas" plus "Rata-Rata"), with no 15-24 group and no series; NEET 15-24 for 2025 by 38 provinces plus INDONESIA; TPT by province for 2026 with only the Februari column filled ("-" for Agustus and Tahunan). The 2025 files do not state the month or period.
- Outputs change accordingly: `tpt_age.csv` (`year,period,age_group,tpt_pct,source_file`), `neet_province.csv` (`province,year,period,neet_pct,is_national,source_file`), `tpt_province.csv` (`province,year,period,tpt_pct,is_national,source_file`; Februari column only). `neet_national.csv` is not made (no series). `period` is `not stated` for the 2025 files and `Februari` for the 2026 file.
- Never compute a 15-24 TPT from 15-19 and 20-24: the groups have different labour-force sizes and the file has no weights.
- URLs: the user did not give them. `sources.md` records the links the main agent sent the user (from web search, not opened from the container) and marks them as "link sent to the user; not confirmed as the exact download page":
  - https://www.bps.go.id/en/statistics-table/2/MTE4MCMy/unemployment-rate-by-age-group.html
  - https://www.bps.go.id/id/statistics-table/2/MTE4NiMy/persentase-usia-muda--15-24-tahun--yang-sedang-tidak-sekolah--bekerja-atau-mengikuti-pelatihan--persen-.html
  - https://www.bps.go.id/id/statistics-table/2/NTQzIzI=/tingkat-pengangguran-terbuka--februari-2026.html
  Download date: 2026-10-28 (upload time 03:14 UTC).

## Outcome (2026-10-28, measured)
- Three BPS XLSX files stored unchanged in `research/video-03/raw/`; sha256 match the Amendment and `sources.md`.
- `tools/extract.py` run twice (sub-agent) and once more by the main agent: identical CSVs. Every value in the three CSVs matches a cell of its raw file (33/33, 117/117, 117/117).
- `tpt_age.csv` 11 rows (2025: 15-19 23.34, 20-24 14.35, Rata-Rata 4.85). `neet_province.csv` 38 provinces + INDONESIA (2025: INDONESIA 19.44; highest SULAWESI UTARA 29.52, lowest BALI 5.33). `tpt_province.csv` 38 + INDONESIA (Februari 2026: INDONESIA 4.68).
- Not verified: the period (month) of the 2025 tables, the exact download URLs, the unit of the TPT-by-age file (printed "Tidak Ada Satuan"). Every cell is stored as text in the XLSX. The failure paths of `extract.py` were not tested with bad inputs.
