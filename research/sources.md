# Sources (accessed 2026-10-27 UTC)

## v2: average wage (official, BPS)
- BPS, tabel "Rata-rata Upah/Gaji Bersih Sebulan Buruh/Karyawan/Pegawai menurut Provinsi dan Jenis Pekerjaan Utama (Rupiah)", 2026. Kolom "Total", bulan "February" (Feb 2026), 38 provinsi + MEAN. File diunduh pengguna dari bps.go.id, disimpan tanpa perubahan di `research/bps_upah_feb2026.csv` (sha256 fcbfc4199be8b3fb114c074fc2ea0d652af245114e73ff5330d89cefca9ae758). Dimasukkan ke `research/data.csv` oleh `research/tools/merge.py`.
- Catatan: file CSV sendiri tidak menyebut "Sakernas". Atribusi "Sakernas Feb 2026" di layar berasal dari brief dan belum diverifikasi di dalam file.
- The table's MEAN row (3.287.675) is not used. The unweighted mean of the 38 values is 3.425.095, so BPS's MEAN is probably weighted; not verified.

## v2: superseded values (removed from data.csv)
- The v1 avg_wage values (GoodStats, Sakernas Agustus 2025, rounded to Rp10rb, secondary, 17 provinsi) are superseded by the BPS Feb 2026 table. They were removed from `research/data.csv`. A pre-merge copy is kept only in the session scratchpad, not in the project.
- Also superseded: the v1 avg_wage_source_url and the note text that described GoodStats values. The column is now `avg_wage_source` (text).
- The v1 `research/script.json` still describes the GoodStats data. The v2 script is `research/script_v2.json`.

## v2: UMP 2026 (unchanged from v1, still unverified media)
- https://www.detik.com/sulsel/berita/d-8297285/daftar-lengkap-ump-2026-se-indonesia-termasuk-sulawesi-papua : 38 provinsi, cites Kemnaker IG 5 Jan 2026. unverified-media.
- https://www.kompas.tv/info-publik/642049/... : cross-check (36 provinsi). unverified-media.
- Three UMP values carry fractional rupiah in the media list (Jawa Tengah 2327386.07, Banten 3100881.4, Sulawesi Tenggara 3306496.18). Kept as printed. Sultra is below its average by only about 0.03 of the UMP, so the classification is not sensitive to these three values, but they should be checked against Kemnaker.

## v2: Jawa Barat explanation (verified in this session)
- https://www.detik.com/jabar/bisnis/d-8276785/daftar-lengkap-besaran-ump-umk-jabar-2026 (fetched 2026-10-27 via proxy):
  - UMP Jawa Barat 2026 naik 5,7 persen menjadi Rp2.317.601 (the article prints "Rp2.3.17.601"; the figure matches).
  - UMK Jawa Barat 2026 ditetapkan per kabupaten/kota, Kepgub No 561.7/Kep.862-Kesra/2025.
  - Karawang (Kabupaten) UMK Rp5.886.852 (used in the video as "Rp5,89 jt"). Bisnis.com lists Rp5.886.853 (Rp1 difference).
  - UMK terendah: Kabupaten Pangandaran Rp2.351.250 (above the UMP).
  - The article is internally inconsistent for Kota Bekasi: Rp5.999.443 in the text, Rp5.992.931 in its numbered list. Kota Bekasi is NOT used in the video.
- https://www.detik.com/jabar/bisnis/d-8276260/umk-2026-jabar-segera-ditetapkan-kenaikan-tertinggi-hampir-8-persen (fetched): UMK values differ across 27 daerah and are "umumnya berada di atas UMP".
- Used in the video: "UMP itu batas provinsi, sementara tiap kabupaten dan kota punya UMK sendiri. Di Karawang, UMK-nya lima koma delapan sembilan juta." Lowest UMP (Jawa Barat) is in the data file.
- Not verified (not in the video): that UMK replaces UMP as the binding minimum in every case, and that UMK 2026 applies only to workers with under one year of tenure. Both appeared in search snippets only (finance.detik.com, kompas.com, hukumonline.com), and the proxy refused those hosts.

## v2: sources that could not be opened
- finance.detik.com, money.kompas.com, katadata.co.id, hukumonline.com: refused by the agent proxy (connect_rejected) in this session. Their content is cited only as search snippets, and no claim in the video depends on them.

## v1 (kept for history; superseded by v2 above)
## Opened and used (v1)
- https://www.detik.com/sulsel/berita/d-8297285/daftar-lengkap-ump-2026-se-indonesia-termasuk-sulawesi-papua : full 38-province UMP 2026 list (cites Kemnaker IG, 5 Jan 2026). Primary UMP source in data.csv. unverified-media.
- https://www.kompas.tv/info-publik/642049/daftar-lengkap-ump-2026-di-seluruh-provinsi-indonesia-terbesar-jakarta-terkecil-jawa-barat : 36 provinces (NTB, NTT missing); cross-check, values match detik. unverified-media.
- https://data.goodstats.id/statistic/10-provinsi-dengan-upah-buruh-terendah-per-agustus-2025-eX6uX : bottom-10 avg wage Aug 2025 (secondary, cites BPS). SUPERSEDED in v2.
- https://data.goodstats.id/statistic/7-provinsi-dengan-rata-rata-upah-buruh-tertinggi-2025-BVMF0 : top-7 avg wage (secondary). SUPERSEDED in v2.
- satudata.kemnaker.go.id, kemnaker.go.id, BPS publication (search result only): no per-province numeric wage table found in v1. Still true for the UMP data.
