# Findings v2 (full data: 38 provinsi, BPS Feb 2026 kolom Total)

Status: full table merged. Every number in the video is derived from `data.csv` (UMP: unverified media, avg wage: BPS).

## Merge check (research/tools/merge.py, re-runnable, idempotent)
Planner's own check reproduced:
- 24 of 38 provinsi have avg wage below UMP 2026 (OK)
- lowest ratio: Aceh 0.689 (UMP 3.932.552, avg 2.708.851) (OK)
- DKI Jakarta 0.913 (UMP 5.729.876, avg 5.229.472) (OK)
- highest ratio: Jawa Barat 1.602 (UMP 2.317.601, lowest UMP in Indonesia; avg 3.712.133) (OK)

Other points from the merged table:
- Largest absolute gap is also Aceh: avg minus UMP = -Rp1.223.701.
- Next lowest ratios after Aceh: Sumatera Selatan 0.754, Sulawesi Selatan 0.789, Kepulauan Bangka Belitung 0.807.
- Above UMP at the top end: Banten 1.354, Bali 1.267, Kepulauan Riau 1.222 (Jawa Barat is the top at 1.602).
- BPS MEAN row (3.287.675) is not the unweighted mean of the 38 values (3.425.095). Not used; probably employment-weighted (not verified).

## Ranked ratio (avg / UMP), all 38 (see data.csv)
Below UMP (24): Aceh 0.689, Sumatera Selatan 0.754, Sulawesi Selatan 0.789, Kep. Bangka Belitung 0.807, Papua Selatan 0.822, Sulawesi Barat 0.829, Gorontalo 0.835, Lampung 0.844, Riau 0.848, Maluku 0.865, Sulawesi Utara 0.871, Sumatera Utara 0.878, Jambi 0.909, Kalimantan Selatan 0.911, DKI Jakarta 0.913, Sumatera Barat 0.919, Papua Barat 0.945, Papua Pegunungan 0.956, Kalimantan Tengah 0.961, Sulawesi Tenggara 0.968, Kalimantan Barat 0.970, Papua 0.977, Papua Barat Daya 0.978, Bengkulu 0.981.
At or above UMP (14): NTB 1.002, Maluku Utara 1.016, NTT 1.044, Kalimantan Utara 1.050, Jawa Tengah 1.058, Sulawesi Tengah 1.081, Jawa Timur 1.110, Papua Tengah 1.188, Kalimantan Timur 1.212, DI Yogyakarta 1.217, Kepulauan Riau 1.222, Bali 1.267, Banten 1.354, Jawa Barat 1.602.

## Jawa Barat (the twist)
- UMP 2026 Jawa Barat = Rp2.317.601, the lowest UMP of the 38 provinsi.
- UMK is set per kabupaten/kota, and the UMK values in the fetched detik list (27 wilayah) are above the UMP. The lowest, Kabupaten Pangandaran, is Rp2.351.250. Karawang is Rp5.886.852.
- So the provincial UMP is a floor, not the number that applies everywhere in Jawa Barat. The ratio of 1.60 compares the average to the provincial floor only. This is the explanation used in the video, and it is verified (see sources.md).

## Caveats (apply to every claim above)
- UMP 2026 is unverified media (detik.com and kompas.tv, both citing a Kemnaker Instagram post of 5 Jan 2026). No official Kemnaker page was opened. Three UMP values carry fractional rupiah in the source list (Jawa Tengah 2327386.07, Banten 3100881.4, Sulawesi Tenggara 3306496.18). Kept as printed. Sulawesi Tenggara is below its UMP by about 3% (0.968), so its classification would not change with a small correction, but the values should be checked against Kemnaker.
- The BPS table covers all buruh/karyawan/pegawai by main job type, net monthly wage. It is not restricted to full-time formal workers, and it is not an apples-to-apples test of compliance with UMP. A below-UMP average does not show that any company broke the rules; the video says this in the close.
- UMP and UMK are wage floors for specific groups. A tenure rule (UMK 2026 applies only to workers under one year of service) appeared only in search snippets and was NOT verified in this session. The video does not use it.
- The on-screen attribution "Sakernas Feb 2026" is from the brief. The CSV file does not name the survey, so the survey name is not verified from the file itself.
- Kota Bekasi UMK is inconsistent in the source (Rp5.999.443 in text, Rp5.992.931 in the list). It is not used.
- Map: 34-province shapes (pre-2022). Papua Barat (shape) = Papua Barat + Papua Barat Daya (both below, red). Papua (shape) = Papua, Papua Selatan, Papua Pegunungan (below) + Papua Tengah (above), drawn with a red/teal hatch and labelled "tiga dari empat prov. di bawah UMP". No fake borders.
