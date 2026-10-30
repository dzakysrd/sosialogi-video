# Reel A v1: "Panel surya bekerja dari cahaya, bukan panas"

Draf untuk disetujui atau diedit. Pilihan hook, sudut cerita, dan CTA adalah keputusan kamu.

## Pilihan hook (3,5 detik pertama)

- **Hook A (dipakai di scene 1):** "Panel surya kamu bekerja dari cahaya, bukan panas." Layar: CAHAYA, BUKAN PANAS
- **Hook B:** "Di panel surya kamu, cahaya jadi listrik, bukan panas." Layar: CAHAYA -> LISTRIK, BUKAN PANAS

## Script (Hook A)

| Scene | VO | Layar | Visual |
|---|---|---|---|
| 1. Hook | Panel surya kamu bekerja dari cahaya, bukan panas. | CAHAYA, BUKAN PANAS | Textcard (f) |
| 2. Cahaya | Sel surya mengubah energi cahaya langsung jadi listrik lewat efek fotovoltaik. Foton yang diserap semikonduktor membentuk pasangan elektron-hole di sambungan p-n. | CAHAYA -> LISTRIK (efek fotovoltaik) | Animasi (a): foton menabrak sel, elektron bergerak, terminal + dan - menyala |
| 3. Kontras | Alat yang mengubah sinar matahari jadi panas itu solar thermal collector. Itu alat lain. | PANEL SURYA: CAHAYA -> LISTRIK / SOLAR THERMAL COLLECTOR: PANAS | Kartu kontras (b), sisi panas diredupkan |
| 4. DC | Listrik dari panel itu arus searah, atau DC. Untuk diubah ke AC, sering dipakai inverter. | ARUS SEARAH (DC) | Simbol DC (c); kotak inverter muncul saat kata "inverter" |
| 5. Seri | Ambil satu panel sebagai contoh: dua belas volt, lima ampere. Disambung seri, tegangannya dijumlah. Dua panel jadi dua puluh empat volt, arusnya tetap lima ampere. | ANGKA CONTOH: 12 V 5 A -> 2 PANEL SERI: 24 V 5 A | Animasi seri (d): dua panel disambung, penghitung tegangan menjumlah |
| 6. Paralel | Kalau tiga panel disambung paralel, arusnya yang dijumlah. Tegangannya tetap dua belas volt, arusnya jadi lima belas ampere. | 3 PANEL PARALEL: 12 V 15 A | Animasi paralel (e): tiga panel berdampingan, penghitung arus menjumlah |
| 7. CTA | [CTA KELAS: menunggu nama kelas dan link dari klien] | [CTA placeholder] | Kartu penutup (g) |

Jumlah kata VO (scene 1 sampai 6, tanpa CTA): **101 kata** (Hook A). Dengan Hook B: 102 kata.
Estimasi durasi: 101 / 2,5 kata per detik = **sekitar 40 detik** (estimasi, bukan ukuran audio).

## Catatan

- **Angka 12 V 5 A adalah contoh.** Layar memakai label ANGKA CONTOH dan VO menyebut "contoh" sekali. Ini bukan spesifikasi modul. Ledger menyatakan tegangan modul nyata belum terverifikasi.
- **Hukum seri dan paralel** (tegangan dijumlah pada seri, arus dijumlah pada paralel) bersumber dari fakta LOCKED di facts.md. Angka 24 V 5 A, 12 V 15 A, dan 5 A per panel adalah hitungan aritmetika dari contoh tersebut.
- **Kontras panas.** Fakta yang dipakai menyebut solar thermal collector sebagai alat berbeda. Baris LOCKED di facts.md juga memuat kalimat "heat is a loss factor", yang tidak LOCKED. Naskah tidak memakai kalimat itu, dan suhu sengaja tidak dibahas karena arah pengaruhnya belum terkunci.
- **Inverter.** Baris LOCKED menulis "an inverter is needed". Naskah memakai kata "sering dipakai", mengikuti kalimat Wikipedia ("many times using an inverter").
- **Buku.** Buku "Instalasi Pembangkit Listrik Tenaga Surya: Dos and Don'ts" (Ditjen EBTKE dan GIZ, 2018) belum dibuka. Tidak ada fakta yang dikaitkan dengannya. Baris sumber di JSON mencantumkannya sesuai PRD-20; kalau mau, pindahkan ke "bacaan lanjut".
- **CTA** belum bisa diisi: nama kelas dan link dari klien belum ada.
- Post lama tidak disebut atau disindir.
