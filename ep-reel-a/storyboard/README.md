# Reel A storyboard (PRD-22)

Static keyframes for approval before any animation is built.

## Regenerate

    node ep-reel-a/tools/storyboard.mjs

Renders 11 frames (frames/*.png, 1080x1920) with Playwright Chromium, then sheet_1.jpg, sheet_2.jpg and storyboard.html. Fonts are embedded from ../assets/fonts (Anton, Inter). The script checks that the fonts load and that all text and key graphics sit inside the Reels safe box (x 65..940, y 220..1500); it exits 1 on any violation.

## Colours: approximation, not official brand colours

- Background: navy gradient #0B1B3F to #12306B (approximation, not official brand colours)
- Accent orange-yellow: #F7A600 (approximation, not official brand colours)
- Electric blue: #2F80ED (approximation, not official brand colours)
- Body text: white

## LOGO placeholder

The official Electro Power Indonesia logo file is not available. Every "LOGO" box is a placeholder with the text LOGO. The logo is not drawn or imitated.

## Motion notes per frame

- s1_a (S1, ~3.5 s): thermometer dicoret masuk, teks BUKAN PANAS. muncul cepat
- s1_b (S1, ~3.5 s): sinar matahari masuk dari kiri atas, panel miring menyala, CAHAYA. membesar
- s2_a (S2, ~9 s): foton kuning masuk dari atas, menembus lapisan n, sambungan p-n menyala
- s2_b (S2, ~9 s): elektron biru mengalir dari sambungan lewat kawat ke lampu yang menyala
- s3_a (S3, ~5 s): panel dan kolektor muncul berdampingan, sisi kanan meredup ke 40%
- s4_a (S4, ~6 s): panah arus bergerak satu arah sepanjang kawat dari baterai
- s4_b (S4, ~6 s): garis DC rata masuk inverter, keluar gelombang AC, lalu ke rumah
- s5_a (S5, ~9 s): panel tunggal muncul, tag ANGKA CONTOH lalu 12 V · 5 A
- s5_b (S5, ~9 s): dua panel tersambung seri, 24 V naik, 5 A tetap
- s6_a (S6, ~7 s): tiga panel tersambung paralel lewat dua rel, 15 A naik, 12 V tetap
- s7_a (S7, ~4 s): kartu CTA masuk, nama brand muncul, [CTA KELAS] berkedip

## Notes

- Caption band: a 3-5 word slice of the scene VO with one word highlighted (simulated word sync). S7 (CTA) has no VO, so it has no caption band.
- Durations are estimates, not measured audio.
- Sheets: sheet_1.jpg covers S1-S4, sheet_2.jpg covers S5-S7.
