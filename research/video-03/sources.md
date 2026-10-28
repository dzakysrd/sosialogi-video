# Sources: video-03 (Hari Sumpah Pemuda), angle A "Pemuda dan kerja"

Data: three BPS XLSX files downloaded by hand by the user and stored unchanged in `raw/` (upload prefixes removed from the names). Extracted by `tools/extract.py` (`python3 -I research/video-03/tools/extract.py`). Plan: `docs/prd/18-video03-research.md`, Amendment (2026-10-28).

## Files

### 1. Tingkat_Pengangguran_Terbuka_Berdasarkan_Kelompok_Umur_2025.xlsx
- Title in sheet (B2): `Tingkat Pengangguran Terbuka Berdasarkan Kelompok Umur (Tidak Ada Satuan)`
- Year (B3): `2025`
- Period: not stated in the file (see Not verified).
- Unit as printed: `(Tidak Ada Satuan)` ("no unit"). The values are percent per the table name on bps.go.id; this is NOT verified.
- Contents: 15-19, 20-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, `60 keatas`, `Rata-Rata`. No 15-24 group, no series.
- Footnotes, provisional or revised marks: none in the sheet.
- Bytes: 17029
- sha256: b91a9d2e1eb69b16264dc92701d4e9fd33e53c86f5081e060e86fc6e7ba51f94
- Extracted to: `tpt_age.csv`

### 2. Persentase_Usia_Muda_15-24_Tahun_Yang_Sedang_Tidak_Sekolah_Bekerja_Atau_Mengikuti_Pelatihan_2025.xlsx
- Title in sheet (B2): `Persentase Usia Muda (15-24 Tahun) Yang Sedang Tidak Sekolah, Bekerja Atau Mengikuti Pelatihan (Persen)`
- Year (B3): `2025`
- Period: not stated in the file (see Not verified).
- Unit as printed: `(Persen)`.
- Contents: 38 provinces (A4:A41) and `INDONESIA` (A42). Sheet label A1 `38 Provinsi`.
- Footnotes, provisional or revised marks: none in the sheet.
- Bytes: 19791
- sha256: cba8e888a8025b5cc25c52c8fa29ab7b2aec798c21910527b42d8be853295db5
- Extracted to: `neet_province.csv`

### 3. Tingkat_Pengangguran_Terbuka_Menurut_Provinsi_2026.xlsx
- Title in sheet (B2): `Tingkat Pengangguran Terbuka Menurut Provinsi (Persen)`
- Year (B3): `2026`
- Columns (row 4): `Februari` (B), `Agustus` (C), `Tahunan` (D).
- Period used: `Februari`. Agustus and Tahunan are `-` (missing) for every province; they are not used.
- Unit as printed: `(Persen)`.
- Contents: 38 provinces (A5:A42) and `INDONESIA` (A43). Sheet label A1 `38 Provinsi`.
- Footnotes, provisional or revised marks: none in the sheet.
- Bytes: 22286
- sha256: c25ad70aa39194f22988fd45c4c0adaba667353de63abab10ed76e9c756baaa5
- Extracted to: `tpt_province.csv`

All three files: single sheet `Sheet1`; every cell is stored as text (no numeric-typed cells), so the CSV values are the text as stored, which equals `str()` of the cell.

## URLs (not confirmed)
The user did not give the download URLs. The links below are the ones the main agent sent to the user, found by web search. They were not opened from the container, and they are not confirmed as the exact download page for these files. Link sent to the user; not confirmed as the exact download page.
- https://www.bps.go.id/en/statistics-table/2/MTE4MCMy/unemployment-rate-by-age-group.html (for file 1)
- https://www.bps.go.id/id/statistics-table/2/MTE4NiMy/persentase-usia-muda--15-24-tahun--yang-sedang-tidak-sekolah--bekerja-atau-mengikuti-pelatihan--persen-.html (for file 2)
- https://www.bps.go.id/id/statistics-table/2/NTQzIzI=/tingkat-pengangguran-terbuka--februari-2026.html (for file 3)

Download date: 2026-10-28 (upload time 03:14 UTC).

## Definitions
- NEET (file 2): "Persentase usia muda 15-24 tahun yang sedang tidak sekolah, bekerja, atau mengikuti pelatihan" (as in the title: "Persentase Usia Muda (15-24 Tahun) Yang Sedang Tidak Sekolah, Bekerja Atau Mengikuti Pelatihan").
- Age bands:
  - "Pemuda" in Indonesian law (UU No. 40/2009 tentang Kepemudaan) is age 16-30. This video does not use that band for these tables.
  - These tables use 15-24 (file 2) or five-year groups (file 1; file 3 has no age split). File 1 has no 15-24 group.

## Differences against the media figures
Media figures are from the PRD-18 Context (media and goodstats.id citing BPS). They are unverified and are not data. The BPS file values are listed here; nothing was changed to match the media.
- Media TPT age 15-24, August 2025: 16.89%. Not in the file. File 1 has only 15-19 (23.34) and 20-24 (14.35). A 15-24 figure must not be computed from these two groups (different labour-force sizes, no weights).
- Media TPT total, August 2025: 4.85%. File 1 `Rata-Rata` (2025): 4.85. Same number. Period of file 1 is not stated, so the match to August is not verified.
- Media TPT age 60+, August 2025: 1.71%. File 1 `60 keatas` (2025): 1.71. Same number. Same period caveat.
- Media TPT age 25-59, August 2025: 2.93%. Not in the file as one group (file 1 has 25-29 through 55-59 separately).
- Media NEET 2024, national: 20.31%. File 2 `INDONESIA` (2025): 19.44. Different year.
- Media NEET 2024, Bali: 7.26%. File 2 `BALI` (2025): 5.33. Different year.
- Media NEET 2024, Papua Tengah: 31.20%. File 2 `PAPUA TENGAH` (2025): 21.18. Different year.

## Not verified
- The month or period of the two 2025 tables (files 1 and 2). The files state only the year (2025). Period is recorded as `not stated`.
- The exact download URLs (see URLs above; not opened from the container).
- Whether file 1 `Rata-Rata` is the national August TPT. The file does not say so; it is recorded as the file's own `Rata-Rata`.
- The unit of file 1. It is printed as `(Tidak Ada Satuan)`; that the values are percent is not verified.
- Whether any value is provisional or revised. No such marks are present in the files, but this is not checked against BPS.
