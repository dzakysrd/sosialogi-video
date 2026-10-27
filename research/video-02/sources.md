# Sources: video-02 electrification ratio (accessed 2026-10-27 UTC)

Scope: PRD-07 (national ratio and its definition) and PRD-07b (national series 2013-2025, per-province table for 2023, newer and older sources). The four PDFs in section 1 are kept in `raw/` but are not committed (git-ignored, user decision 2026-10-28); `tools/fetch.sh` re-downloads them and checks their sha256. PNG renders of every cited page are committed in `pages/` (PRD-07b commit). The section 2 files were downloaded to scratch only; `pages/ditjenlk2024_p181.png` is a render of one of them.

Outputs: `re_national.csv` (13 rows, 2013-2025) and `re_province.csv` (38 rows, LK 2023 Tabel 58, Triwulan IV 2023). Both are built by `tools/extract.py`.

Scratch directory used for PRD-07b: `/tmp/claude-0/-home-user-sosialogi-video/150e6ce5-0273-5f3e-b424-06d9b7a8352d/scratchpad/prd07b/`

## 1. Files in this repo (`raw/`)

### 1a. Handbook of Energy and Economic Statistics of Indonesia 2025 (HEESI 2025), PRD-07
- URL: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf
- Local file: `research/video-02/raw/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf`
- HTTP status: 200 (`Content-Type: application/pdf`)
- Bytes: 10962809
- sha256: 7e4a75eb00b99208f3004b8b934b6cb304241699f6ffe97526f938c1738fdec2 (re-checked in PRD-07b)
- `file`: PDF document, version 1.7
- pdfinfo: Title not set; Creator: Adobe InDesign 15.0 (Macintosh); Producer: Adobe PDF Library 15.0; CreationDate: Wed Aug 12 04:26:25 2026 UTC; ModDate: Wed Aug 12 04:26:53 2026 UTC; Pages: 172
- Pages used (PDF index; printed page where checked):
  - PDF 11 (printed xi): "Indonesia's Concise Energy Profile 2025", line "D. RATIO ELECTRIFICATION 2025 99.83 %" (checked in the page render in PRD-07; text layer re-checked in PRD-07b, which gives the same string).
  - PDF 25 (printed 9): table 1.4 Population and Employment (household counts; revision check, section 6).
  - PDF 154: LTSHE definition (printed page not checked).
  - PDF 164: glossary entry "Household" (printed page not checked).

### 1b. Handbook of Energy and Economic Statistics of Indonesia 2024 (HEESI 2024), PRD-07
- URL: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf
- Local file: `research/video-02/raw/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf`
- HTTP status: 200 (`Content-Type: application/pdf`)
- Bytes: 15477022
- sha256: fd4ca2f12d6d93296c3c26fab5ba4eeba0532f4dfb5a25d370e6816b6c2fec47 (re-checked in PRD-07b)
- `file`: PDF document, version 1.5 (zip deflate encoded)
- pdfinfo: Title not set; Creator: Adobe InDesign CS6 (Windows); Producer: Adobe PDF Library 10.0.1; CreationDate: Wed Jul 9 07:16:26 2025 UTC; ModDate: Mon Jul 21 08:25:49 2025 UTC; Pages: 152
- Pages used:
  - PDF 9 (printed vii): heading "Indonesia's Concise Energy Profile 2024" and footnote ") Sources : Statistics Indonesia, BPS" (the leading "1" of the marker is not visible in the render).
  - PDF 10 (printed viii): "D. ELECTRIFICATION RATIO 2024 99.83 %" (text layer, PRD-07b; the printed footer "viii" is in the text layer).
  - PDF 21 (printed 7): table 1.4 Population and Employment (revision check, section 6).
  - PDF 128: LTSHE definition (printed page per text footer: 114; not visually checked).
  - PDF 138: glossary entry "Household" (printed page per text footer: 124; not visually checked).

### 1c. Laporan Kinerja Kementerian ESDM Tahun 2023 (LK 2023), copied from PRD-07 scratch in PRD-07b step 2
- URL: https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf
- Local file: `research/video-02/raw/content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf`
- Accessed 2026-10-27 UTC (PRD-07 download); HTTP 200; bytes 15525880; `Content-Type: application/pdf`
- sha256: 4372c7fe6bcca5273918fc554922c0ed7fc88fc728384bf6c9d2a19497b5e953 (matches the PRD-07b expected value; the repo copy and the scratch copy both hash to it)
- pdfinfo: Title not set; Author: esdm sw; Creator: Microsoft® Word LTSC; Producer: Microsoft® Word LTSC; CreationDate: Thu Feb 29 04:51:25 2024 UTC; ModDate: Thu Feb 29 04:51:25 2024 UTC; Pages: 448; Page size: 595.32 x 841.92 pts (A4); PDF version 1.7; Encrypted: no
- Pages used (PDF index; printed page in brackets):
  - PDF 171-172 (printed 155-156): RE definition (section 3a).
  - PDF 172 (printed 156): "...realisasi Rasio Elektrifikasi Nasional pada Triwulan IV Tahun 2023 sebesar 99,79%" and "Berikut tabel sebaran Rasio Elektrifikasi per provinsi tahun 2023." Also the household breakdown quoted in section 3a.
  - PDF 173 (printed 157): **Tabel 58. Sebaran Rasio Elektrifikasi per Provinsi pada Triwulan IV Tahun 2023**, NO 1 to 35 (text layer, PRD-07b).
  - PDF 174 (printed 158): Tabel 58 rows NO 36 to 38 and the TOTAL row (98,33 / 1,05 / 0,41 / 99,79); caption "Gambar 48. Peta Sebaran Rasio Elektrifikasi pada Triwulan IV Tahun 2023"; bar chart "RE 2013 - 2022" (raster image, not in the text layer; section 4b).
  - PDF 183 (printed 167): **Tabel 61. Rasio Elektrifikasi Nasional Tahun 2023**: target 100%, capaian 99,79%. Text: "...tetap mengalami peningkatan sebanyak 0,16% dibandingkan tahun 2022". Also Gambar 52, a text-layer table (section 4c).
  - PDF 184 (printed 168): "...yang sebesar 99,63%" (2022 value); **Tabel 63. Rasio Elektrifikasi** (target and realisasi 2023 only, no series).

### 1d. Laporan Kinerja Kementerian ESDM Tahun 2025 (LK 2025), copied from PRD-07 scratch in PRD-07b step 2
- URL: https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2025.pdf
- Local file: `research/video-02/raw/content-laporan-kinerja-kementerian-esdm-tahun-2025.pdf`
- Accessed 2026-10-27 UTC (PRD-07 download); HTTP 200; bytes 9386282; `Content-Type: application/pdf`
- sha256: c5d87cabd111a997662cca777a60276c141bafecc8c0518b2cf30dfdc08e9550 (matches the PRD-07b expected value)
- pdfinfo (PRD-07): Title not set; Creator: Microsoft® Word for Microsoft 365; Producer: Microsoft® Word for Microsoft 365; CreationDate: Sat Feb 28 06:07:51 2026 UTC; Pages: 368
- Pages used (PDF index; cross-check only, no CSV row uses it):
  - PDF 39 (printed page not checked): "...mencapai 99,83% pada akhir tahun 2024" (text layer, PRD-07b). PRD-07 quoted the full sentence as "Statistik Ketenagalistrikan mencatat Rasio Elektrifikasi (RE) nasional telah mencapai 99,83% pada akhir tahun 2024".
  - PDF 76 (printed page not checked): "...serta Rasio Elektrifikasi sebesar 99,83% hingga Desember 2025" (text layer, PRD-07b).
  - PDF 78 (printed page not checked): "99,83%" on a line of the text layer (PRD-07b). The full sentence from PRD-07 ("...rasio elektrifikasi telah mencapai 99,83%") was not re-read.
- No per-province ratio table in this report (PRD-07: table titles containing "elektrifikasi", "provinsi" or "listrik" are Tabel 46, 70 and 71 only).

## 2. Files in scratch only (not in the repo)

### 2a. Laporan Kinerja Ditjen Ketenagalistrikan 2024 (Ditjen LK 2024), cross-check only
- URL: https://esdm.go.id/assets/media/content/content-laporan-kinerja-ditjen-ketenagalistrikan-tahun-2024.pdf
- Accessed 2026-10-27 21:54 UTC. HEAD: HTTP 200, `application/pdf`, Content-Length 15241622. GET: HTTP 200, `application/pdf`, bytes 15241622.
- Scratch copy: `/tmp/claude-0/-home-user-sosialogi-video/150e6ce5-0273-5f3e-b424-06d9b7a8352d/scratchpad/prd07b/dl_ditjen2024/ditjen-lk-2024.pdf`
- sha256: 66cc5e49204580bfb037dceb7b2524272e0e34bcb2905c4896f934079d268941
- `file`: PDF document, version 1.6 (zip deflate encoded)
- pdfinfo: Title not set; Creator: Nitro PDF Pro 14 (14.35.1.0); Producer: Nitro PDF Pro 14 (14.35.1.0); CreationDate: Fri Feb 28 06:45:48 2025 UTC; ModDate: Fri Feb 28 06:46:13 2025 UTC; Pages: 315; Page size: 595.32 x 842.04 pts (A4); PDF version 1.6; Encrypted: no
- Text search (`pdftotext -layout`, all pages; the search was of the text layer only):
  - "Rasio Elektrifikasi": PDF 14, 17, 101, 174, 175, 176, 177, 179, 180, 181, 182, 183, 186, 187, 188, 205, 206, 301.
  - "provinsi" (case-sensitive): PDF 46, 84, 88, 115, 136, 163, 173, 201, 203, 206, 279.
  - "LTSHE": PDF 31, 36, 90, 175, 176, 177, 178, 186, 205, 297.
- Pages used:
  - PDF 176 (printed 176): **Tabel 36. Realisasi Rasio Elektrifikasi Nasional Tahun 2024**. Target 100%; Realisasi Triwulan I 99,81%, Triwulan II 99,81%, Triwulan III 99,82%, Triwulan IV 99,83%.
  - PDF 179 (printed 179): **Gambar 37. Peta Sebaran Rasio Elektrifikasi Tahun 2024** (and Gambar 38). The page has two raster images per pdfimages; the text layer has only the captions. The map was NOT transcribed.
  - PDF 181 (printed 181): **Gambar 41**, a chart with its data in the text layer. Target: 99,90% for 2019, then 100,00% for 2020-2024. Realisasi: 98,89% (2019), 99,20% (2020), 99,45% (2021), 99,63% (2022), 99,79% (2023), 99,83% (2024). Gambar 42 is on the same page (chart, not read).
  - PDF 182 (printed 182): **Tabel 37. Rasio Elektrifikasi Nasional Tahun 2024**: Target 100,00%; Realisasi 99,83%; Persentase Capaian 99,83%.
  - PDF 205 (printed 205): "Rasio Elektrifikasi (RE) Nasional sebesar 99,83%, dengan rincian RE PLN sebesar 98,45%, RE Non PLN sebesar 0,98% dan RE LTSHE sebesar 0,39%." (see section 7 on rounding)
  - PDF 201 (**Tabel 39. Sebaran Realisasi Jaringan Distribusi per Provinsi Tahun 2024**) and PDF 203 (**Tabel 40. Sebaran Realisasi Gardu Distribusi per Provinsi Tahun 2024**): per-province tables of distribution network and substations. They are not electrification data.
- Per-province ratio table in text form for 2024 (or later): NOT FOUND. The only per-province ratio item for 2024 is the map Gambar 37 (PDF 179), and it was not transcribed. No rows were added to `re_province.csv` and the PDF was not copied to `raw/`.
- Ditjen LK 2025 (`...ditjen-ketenagalistrikan-tahun-2025.pdf`, same URL pattern): HEAD returned HTTP 404 with `text/html; charset=UTF-8`. Not downloaded, not searched.

### 2b. Handbook of Energy and Economic Statistics of Indonesia 2020 (HEESI 2020), cross-check only
- URL: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2020.pdf
- Accessed 2026-10-27 21:54 UTC. HEAD: HTTP 200, `application/pdf`. GET: HTTP 200, `application/pdf`, bytes 2809075.
- Scratch copy: `/tmp/claude-0/-home-user-sosialogi-video/150e6ce5-0273-5f3e-b424-06d9b7a8352d/scratchpad/prd07b/dl_heesi2020/heesi-2020.pdf`
- sha256: a852bfc7050ed90a511ad08f74738d4a88b2e77069ede85a62cf8854748ddbe6
- `file`: PDF document, version 1.6 (zip deflate encoded)
- pdfinfo: Title not set; Creator: Adobe InDesign CC 13.0 (Windows); Producer: Adobe PDF Library 15.0; CreationDate: Thu Jul 22 09:43:31 2021 UTC; ModDate: Mon Jul 26 04:39:39 2021 UTC; Pages: 111; Page size: 373.89 x 523.28 pts; PDF version 1.6; Encrypted: no
- Text search for "electrif" / "elektrif" (case-insensitive): the ratio appears only on PDF 10. No other ratio entry, table or series is in the text layer.
- Pages used:
  - PDF 9 (printed vii): heading "Indonesia's Concise Energy Profile 2020".
  - PDF 10 (printed viii): "D. ELECTRIFICATION RATIO 2020", then 99.20 and "%" (spacing condensed here).
- Series: none. The edition has one value (2020). The step 7 comparison is therefore for 2020 only (section 4c). Not added to the CSV.

## 3. Definitions (verbatim)

### 3a. Electrification ratio: Ministry of Energy and Mineral Resources, Laporan Kinerja 2023 (LK 2023)
This is the only written definition of the ratio found in any document. It is not in either HEESI edition. The quotation was re-read in the PRD-07b text layer of PDF 171-172 and matches.
- Printed page 155 (PDF 171 of 448), section "d. Kehandalan infrastruktur listrik", "Rasio Elektrifikasi (RE) (bobot 12,5%)". Continues on printed page 156 (PDF 172).
- Verbatim (Indonesian):

> Sub parameter capaian Rasio Elektrifikasi merupakan indikator untuk mengukur akses listrik. Berdasarkan Peraturan Pemerintah (PP) Nomor 79 Tahun 2014 tentang Kebijakan Energi Nasional (KEN), Rasio Elektrifikasi adalah perbandingan jumlah rumah tangga berlistrik dengan jumlah rumah tangga total. Untuk pemenuhan penyediaan energi dan pemanfaatan energi, dalam KEN menyebutkan diperlukan beberapa pencapaian sasaran kebijakan energi nasional salah satu diantaranya, yaitu tercapainya Rasio Elektrifikasi sebesar 85% pada tahun 2015 dan mendekati sebesar 100% pada tahun 2020. Formulasi perhitungan RE adalah sebagai berikut:

> Formula (as shown in the page render, printed page 155): RE = Jumlah Rumah Tangga (RT) Berlistrik / Jumlah Rumah Tangga (RT) Nasional x 100%

> RE dihitung oleh Kementerian ESDM setiap triwulan (April, Juli, Oktober, dan Januari) dengan stakeholder terkait, PT PLN (Persero), Badan Pusat Statistik, Kantor Staf Presiden, Kemenko Bidang Kemaritiman dan Investasi, Kementerian Dalam Negeri, serta Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi. Pada perhitungan Rasio Elektrifikasi tahun 2023, jumlah rumah tangga nasional didapatkan dari penyesuaian dari proyeksi tahunan yang dibuat oleh Badan Pusat Statistik atau kesepakatan antara PT (Persero) wilayah dengan Pemerintah Daerah setempat. Rumah tangga berlistrik terdiri dari:
> 1. Rumah tangga yang dilistriki oleh PT PLN (Persero);
> 2. Rumah tangga yang dilistriki oleh Non PT PLN (Persero). Rumah tangga ini dapat dilistriki oleh Pemerintah Daerah, koperasi, swadaya masyarakat, maupun menyalur dari tetangga;
> 3. Rumah tangga yang dilistriki melalui program Lampu Tenaga Surya Hemat Energi (LTSHE). Program LTSHE merupakan program Pemerintah melalui Kementerian ESDM untuk memberikan akses penerangan kepada masyarakat yang berada di wilayah 3T (Terpencil, Tertinggal dan Terluar), khususnya masyarakat yang berada di desa yang masih gelap gulita, yang tak pernah memperoleh akses energi listrik. Program yang dilaksanakan pada tahun 2017-2019 ini diharapkan menjadi salah satu solusi penerangan dan energi listrik, yang difokuskan bagi pedesaan yang terisolir dan sulit dijangkau PT PLN (Persero).

- Note: the text says "jumlah rumah tangga total" and the formula says "Nasional". Both are quoted as printed.
- PDF 172 (printed 156), verbatim: "Berdasarkan Berita Acara penetapan Rasio Elektrifikasi (RE) dan Rasio Desa Berlistrik (RD) periode Triwulan IV Tahun 2023 yang ditetapkan pada 5 Februari 2024, realisasi Rasio Elektrifikasi Nasional pada Triwulan IV Tahun 2023 sebesar 99,79% dengan rincian data sebagai berikut:" and the list:
  - "1. Rumah Tangga (RT) Berlistrik PLN : 82.939.019 RT"
  - "2. Rumah Tangga (RT) Berlistrik Non PLN : 865.829 RT"
  - "3. Rumah Tangga (RT) Berlistrik LTSHE : 339.256 RT"
  - "4. Rumah Tangga (RT) Berlistrik : 82.761.287 RT"
  - "5. Rumah Tangga (RT) Nasional : 82.939.019 RT"
  - "6. Rasio Elektrifikasi Nasional : 99,79 %"
  Items 1-3 sum to 84.144.104, not to item 4, and item 1 equals item 5. Not used (section 7).

### 3b. LTSHE: HEESI 2025, PDF 154
> Solar-powered energy-saving lamp (Lampu Tenaga Surya Hemat Energi/ LTSHE) is a lighting device in the form of integrated lights with batteries whose energy is sourced from photovoltaic solar power plants. The LTSHE works by capturing the energy from the sun in solar panels, converts the solar energy into electrical energy which is then stored in a battery. The electrical energy inside this battery is then used to turn on the lights. Meanwhile, solar- powered street lighting (Penerangan Jalan Umum Tenaga Surya/PJUTS) is a street lighting lamp that uses sunlight as the source of electrical energy.

(HEESI 2024, PDF 128, has the same definition with slightly different line breaks.)

### 3c. Household: HEESI 2025, PDF 164 (glossary)
> Household
> A group of energy consumers which uses energy for cooking, lighting, and household appliances, but excluding energy consumption for private cars.

(HEESI 2024, PDF 138: same wording.)

## 4. National series (`re_national.csv`)

### 4a. How each row was read
- 2013-2022: LK 2023, PDF 174, "Gambar 48 (chart RE 2013 - 2022)", method `chart_label`. The values are printed in a raster bar chart, so they are transcribed, not extracted from text. The values are the ones read in section 4b.
- 2023: LK 2023, PDF 183, "Tabel 61", method `text`. Printed "99,79%" (checked in the text layer).
- 2024: HEESI 2024, PDF 10, "Indonesia's Concise Energy Profile 2024, D", method `text`. Printed "99.83 %".
- 2025: HEESI 2025, PDF 11, "Indonesia's Concise Energy Profile 2025, D", method `text`. Printed "99.83 %".
- Values keep their printed decimals, with a dot as the separator (for example "88,3" is written 88.3).

### 4b. Gambar 48 chart labels, 2013-2022: independent reading (PRD-07b step 3)
- Render: `pdftoppm -r 300 -png -f 174 -l 174` of LK 2023. Page size 2481 x 3508 px. Scratch: `/tmp/claude-0/-home-user-sosialogi-video/150e6ce5-0273-5f3e-b424-06d9b7a8352d/scratchpad/prd07b/lk23_p174_300dpi-174.png`
- Crops read with the Read tool: the bar chart (`lk23_p174_gambar48_chart_x15.png`, resized 150% for reading), the title (`lk23_p174_title_x2.png`) and the callout box (`lk23_p174_twbox.png`), all in the same scratch directory.
- Chart title read: "RE 2013 - 2022". The same figure shows "Triwulan III 2023 99,74%" and "Triwulan IV 2023 99,79%", which match the PRD-07 reading.
- Year and value labels, read by PRD-07b and compared with the PRD-07 reading:

| year | PRD-07 reading | PRD-07b reading | difference |
|---|---|---|---|
| 2013 | 80,51 | 80,51 | none |
| 2014 | 84,35 | 84,35 | none |
| 2015 | 88,3 | 88,3 | none |
| 2016 | 91,16 | 91,16 | none |
| 2017 | 95,35 | 95,35 | none |
| 2018 | 98,3 | 98,3 | none |
| 2019 | 98,89 | 98,89 | none |
| 2020 | 99,2 | 99,2 | none |
| 2021 | 99,45 | 99,45 | none |
| 2022 | 99,63 | 99,63 | none |

- No label was unreadable. No differences were found, so the values were used.
- The chart is not in the text layer. Only the caption "Gambar 48. Peta Sebaran Rasio Elektrifikasi pada Triwulan IV Tahun 2023" is (checked by `extract.py` on PDF 174).

### 4c. Cross-checks of the national series (no changes to the CSV)
- 2019-2022, text layer, two sources:
  - LK 2023 PDF 183, Gambar 52 "Target dan Realisasi Rasio Elektrifikasi Nasional": Realisasi 98.89% (2019), 99.20% (2020), 99.45% (2021), 99.63% (2022), 99.79% (2023). The axis labels read 2019 to 2024, and the Realisasi row has five values, so they are assigned to 2019-2023 by the Persentase Capaian row (98.99% = 98.89 / 99.90). Matches the chart labels for 2019-2022 (difference 0.00).
  - Ditjen LK 2024 PDF 181, Gambar 41: Realisasi 98,89% / 99,20% / 99,45% / 99,63% / 99,79% / 99,83% for 2019-2024. Matches the chart labels for 2019-2022 (difference 0.00).
- 2020, HEESI 2020 PDF 10: 99.20. `re_national.csv` 2020 = 99.2. Difference 0.00. This is the only year that HEESI 2020 can check.
- 2023: LK 2023 PDF 172 "99,79%" and PDF 183 Tabel 61 "99,79%" both match `re_national.csv` (difference 0.00).
- 2024: HEESI 2024 PDF 10 = 99.83 (the CSV value). Ditjen LK 2024 PDF 182 Tabel 37 = 99,83% (difference 0.00). Ditjen LK 2024 PDF 176 Tabel 36, Triwulan IV = 99,83% (difference 0.00). LK 2025 PDF 39 "99,83% pada akhir tahun 2024" (difference 0.00).
- 2025: HEESI 2025 PDF 11 = 99.83 (the CSV value). LK 2025 PDF 76 "99,83% hingga Desember 2025" (difference 0.00).
- 2013-2018: no second source was read in PRD-07b. HEESI 2020 has no series to compare.
- Ditjen LK 2024 PDF 176, Tabel 36, quarterly 2024: Triwulan I 99,81%, II 99,81%, III 99,82%, IV 99,83%. Not in the CSV (annual series only).

## 5. Per-province (`re_province.csv`)
- Source: LK 2023 Tabel 58, Triwulan IV 2023. NO 1-35 are on PDF 173 (printed 157) and NO 36-38 are on PDF 174 (printed 158). Columns: RE (%) PLN, RE (%) Non PLN, RE (%) LTSHE, RE (%) TOTAL. The TOTAL column is the ratio used. Printed "-" becomes an empty cell.
- TOTAL row (on PDF 174; not written to the CSV, checked by `extract.py`): "TOTAL 98,33 1,05 0,41 99,79".
- Province names are as printed. "Kep Bangka Belitung" is printed in that form. "Nusa Tenggara Timur" wraps: "Nusa Tenggara" is on one text line and "Timur" on the next, so the CSV joins them.
- Row check, |PLN + Non PLN + LTSHE - TOTAL|: largest difference 0.00; no row above 0.02.
- Independent check (PRD-07b): every row's four printed values appear in order on one text line of its page (38/38).
- 2024 or later per-province ratio table in text form: not found. Ditjen LK 2024 has only the map Gambar 37 (PDF 179), not transcribed. HEESI 2024, HEESI 2025 and LK 2025 have no per-province ratio table (PRD-07).

## 6. Revisions (PRD-07 step 5, unchanged)
- Electrification ratio: no year appears in both editions for the ratio. HEESI 2024 gives 2024 = 99.83 (PDF 10). HEESI 2025 gives 2025 = 99.83 (PDF 11). Nothing to compare, so no ratio revisions.
- Observed, not extracted (table 1.4 Population and Employment, PDF 21 of HEESI 2024 and PDF 25 of HEESI 2025): 10 common years (2015 to 2024) were compared row by row. Only 2020 differs:
  - Population, 2020: 271,066 (HEESI 2024) vs 270,204 (HEESI 2025).
  - Household, 2020: 69,439 (HEESI 2024) vs 69,411 (HEESI 2025).
  - HEESI 2025 marks the year as "20201)" with the note "1) Revised data for Population and Household". Labor force, unemployment and unemployment rate for 2020 are the same in both editions.

## 7. Not verified / open
- The 2013-2022 values come from a raster chart. Two text-layer sources (section 4c) agree for 2019-2022, but the CSV keeps method `chart_label`, as the PRD specifies. Nothing in the text layer covers 2013-2018.
- No second source was read for 2013-2018. The 2015 HEESI edition returned HTTP 404 (text/html) at the PRD-07 URL and was not retried.
- HEESI 2020 has one value (2020), not a series.
- LK 2023 PDF 172 household breakdown (section 3a) is internally inconsistent as printed: "RT Berlistrik PLN" (82.939.019) equals "RT Nasional" (82.939.019), and items 1-3 sum to 84.144.104, not to item 4 (82.761.287). Not used. Check before using any household count from this page.
- Ditjen LK 2024 PDF 205: 98,45 + 0,98 + 0,39 = 99,82, but the same sentence gives 99,83%. The source does not explain the rounding. Not used.
- Ditjen LK 2025 (tahun-2025 URL): HEAD returned 404. Not downloaded, not searched.
- Per-province data: the newest per-province ratio table found is Triwulan IV 2023 (Tabel 58). There is no 2024 or 2025 per-province ratio table in text form.
- Ditjen LK 2024 map Gambar 37 (PDF 179) is not transcribed.
- Cross-check PDFs in scratch (Ditjen LK 2024, HEESI 2020) are not in `raw/`, because no CSV row uses them and PRD-07b copies to `raw/` only data sources. Copy them into `raw/` and record them here if the cross-checks need to be reproducible from the repo.
- Hosts: LK 2023 and LK 2025 were downloaded from `www.esdm.go.id` in PRD-07. PRD-07b accepts it as in scope (same ministry). Ditjen LK 2024 and HEESI 2020 come from `esdm.go.id`. PRD-07b made no web searches and did not use bps.go.id.
- Printed page numbers for HEESI 2025 PDF 154 and 164, HEESI 2024 PDF 128 and 138, and LK 2025 PDF 39, 76 and 78 were not visually checked. The PRD-07b text-layer checks of LK 2025 PDF 39, 76 and 78 are for the number only.
- The footnote "1)" on HEESI 2025 PDF 11 is attached to the heading "A. SOCIO ECONOMY" in the render. Whether it also covers the ratio line is not stated.
- Search snippets from PRD-07 quoted press-release figures (2022 = 99,67%; 2023 = 99,78%; mid-2024 = 99.81%). They were NOT verified against a file and are not used. The LK 2023 text gives 2022 = 99,63% and 2023 = 99,79%.
- Whether raw PDFs are committed to the repo is not decided. Nothing is committed in PRD-07b.
