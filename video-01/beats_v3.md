# Beat plan: video-01 v3 "UMP vs gaji asli" (data: BPS Feb 2026, kolom Total; UMP: unverified media; UMK Karawang: detik)

Canvas 1080x1920, 30 fps, Instagram Reels (TikTok-compatible). `tools/lint_v3.mjs` reads the framing column (column 3)
and checks it against the timeline and the probe. Times are word cues from the voice variant named in
`video.v3.config.json` (`voice.variant`, now v2 = Ardi, rate +8%, pitch +0Hz), so they move when the variant changes.

Safe box: x 65..940, y 220..1500. Hero band: y 420..1320; hero centre at y 780..940 (middle 860).
Captions: one pill, bottom edge y 1440, at most 5 words and 2 lines. Brand tag top-right (not a text block).
Text rule: at most 3 text blocks per frame (captions count, the brand tag does not). Source line only on the final card.

| # | id | framing | hero (one main element) | screen zones | start cue | end cue | other cues (element appears at) | job |
|---|----|---------|-------------------------|--------------|-----------|---------|----------------------------------|-----|
| B1 | hook | claim | "UMP TERTINGGI" (frame 1), then "TAPI GAJI RATA-RATANYA DI BAWAH UMP" | claim block y 630..1030 | 0 | Tahun (3.68) | switch at "Tapi" (1.73) | Context on frame 1: the Jakarta claim in full by 1.7 s. VO 3.47 s (cap 3.5). |
| B2 | jakarta-locate | locate-java | Java crop (Banten, DKI, west Jawa Barat), DKI Jakarta lit with pin and label | headline y 460..575; map y 600..1070; label y 1110 | Tahun (3.68) | lima koma tujuh tiga juta (5.97) | "2026" at "dua ribu dua puluh enam" (3.95) | Where DKI Jakarta is. |
| B3 | jakarta-bars | bars | Two full-width bars: "UMP" Rp5,73 jt vs "Gaji rata-rata" Rp5,23 jt (tracks 140 px) | kicker y 470; bars y 470..1270 | lima koma tujuh tiga juta (5.97) | Secara (10.49) | UMP value at "lima koma tujuh tiga juta" (5.97); average value at "lima koma dua tiga juta" (9.01) | Jakarta UMP vs average wage. The claim is not repeated. |
| B4 | national-24 | full-map | "24" then "dari 38 provinsi"; national map sweep (red below UMP, hatch = mixed Papua, teal above) | group y 440..820; map y 830..1210; legend y 1240 | Secara (10.49) | Yang (15.39) | "24" at "dua puluh empat" (11.64); "38" at "tiga puluh delapan" (12.37); legend at the sweep end | 24 of 38 provinces are below UMP. |
| B5 | aceh-locator | locator-bars | "ACEH" title, north-Sumatra locator (600 px frame, Aceh lit and pinned), full-width bars (track 76 px) | title y 430..550; map y 560..900; bars y 940..1312 | Yang (15.39) | Jawa Barat (21.81) | Aceh lit at "Aceh" (16.59); UMP value at "tiga koma sembilan tiga juta" (17.93); average value at "dua koma tujuh satu juta" (20.26) | Aceh has the lowest ratio and the largest gap. |
| B6 | jawa-barat-zoom | zoom-province | Jawa Barat lit (60% of frame width); "JAWA BARAT" kicker, tiles "UMP terendah" and "Rata-rata gaji" | map y 470..970; tiles y 1000..1256 | Jawa Barat (21.81) | UMP cuma batas provinsi (27.94) | UMP tile value at "dua koma tiga dua juta" (24.05); average value at "tiga koma tujuh satu juta" (26.29) | Lowest UMP in Indonesia, average above it. |
| B7 | karawang-umk | tiles-map | Jawa Barat with a labelled pin on Karawang; "UMP = batas provinsi" kicker, tiles "UMP Jabar" Rp2,32 jt vs "UMK Karawang" Rp5,89 jt | map y 470..910; kicker and tiles y 960..1216 | UMP cuma batas provinsi (27.94) | Ini (32.76) | pin at "Karawang" (29.70); UMK value at "lima koma delapan sembilan juta" (31.09) | UMP is a provincial floor; Karawang has its own UMK. The pin is approximate, not a district border. |
| B8 | caveat | caveat-card | Caveat card: "Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh." | card y 690..1000 | Ini (32.76) | Sumbernya (36.38) | none | Honest caveat (average net wage, not proof of a violation). |
| B9 | final-card | close-card | CTA pill "Follow @dzakysrd" and one sources line (30 px, two lines) | pill y 720..840; sources y 900..980 | Sumbernya (36.38) | END (last word + 0.25 s) | sources fade in at "Sumbernya" (36.38) | Sources once, then follow. Close holds about 3 s. |

Framing check: claim > locate-java > bars > full-map > locator-bars > zoom-province > tiles-map > caveat-card > close-card.
No two consecutive beats share a framing.

Persistent overlays (all beats): brand tag (top-right, from 0.6 s) and word-synced captions (one pill, word highlighted yellow).
No per-frame source credit (v2 top-left) and no per-frame map credit (v2 bottom). Both are on the final card and in the post caption.

Numbers on screen are derived from `research/data.csv` (and `research/umk_examples.csv` for Karawang), and each is spoken
at the cue that reveals it. The Karawang pin is a labelled pin placed on the north coast of Jawa Barat, not a district border.
