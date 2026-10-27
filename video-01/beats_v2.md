# Beat plan: video-01 v2 "UMP vs gaji asli" (data: BPS Feb 2026, kolom Total)

Canvas 1080x1920, 30 fps, Instagram Reels (TikTok-compatible). Written before the v2 build; `tools/lint_v2.mjs`
reads the framing column (column 3) and checks it against the timeline.
Times are word cues from `assets/v2/words.json`, except the hook card (fixed 2.5 s, the first frame already shows the claim).
Safe box: x 65..940, y 220..1500. Hero band: y 340..1240. Captions: y 1270..1440. Map credit: y 1462..1490.
Source credit (small, top-left) appears from the Jawa Barat beat (B6) to the end.

| # | id | framing | hero (one main element) | screen zones | start cue | end cue | other cues (element appears at) | job |
|---|----|---------|-------------------------|--------------|-----------|---------|----------------------------------|-----|
| B1 | hook | claim | Claim card: "JAKARTA" + "DI BAWAH UMP" (no number) | claim block y 560..1080 | 0 (fixed) | 2.5 s (fixed, card <= 2.5 s) | none | Contrast on frame 1. The claim is text, not a static title card. |
| B2 | jakarta-locate | locate-java | Java zoom, DKI Jakarta lit with pin and callout | headline y 380..490; map y 560..940; callout y 1000 | 2.5 s fixed | Tahun dua ribu dua puluh enam (3.86) -> lima koma tujuh tiga juta (6.35) | "2026" at "dua ribu dua puluh enam" (4.15) | Show where the highest UMP is (DKI Jakarta). |
| B3 | jakarta-bars | bars | Two bars: UMP Rp5,73 jt vs rata-rata Rp5,23 jt | kicker y 470; rows y 600..1150 | lima koma tujuh tiga juta (6.35) | Secara (11.40) | UMP value at "lima koma tujuh tiga juta" (6.35); average value at "lima koma dua tiga juta" (9.69) | Compare UMP with average wage in Jakarta. |
| B4 | national-24 | full-map | Map: 24 red of 38 provinces (sweep); "24" then "dari 38 provinsi" | kicker y 380; "24" y 450..680; "dari 38 provinsi" y 696..796; map y 820..1200; legend y 1186..1234 | Secara (11.40) | Yang (16.76) | "24" at "dua puluh empat" (12.65); "38" at "tiga puluh delapan" (13.43) | Nationally 24 of 38 provinces are below UMP. |
| B5 | aceh-locator | locator-bars | Sumatra locator (600 px frame, Aceh lit) + two bars | title "ACEH" y 340..460; map y 470..900; bars y 930..1236 | Yang (16.76) | Tapi (24.48) | Aceh lit at "Aceh" (18.40); UMP value at "tiga koma sembilan tiga juta" (19.70); average value at "dua koma tujuh satu juta" (22.75) | Aceh has the lowest ratio and the largest gap. |
| B6 | jawa-barat-zoom | zoom-province | Jawa Barat zoomed (60% of frame width) with two value tiles | headline y 340..440; sub y 462; map y 520..1020; tiles y 1050..1230 | Tapi (24.48) | UMP itu batas provinsi (32.69) | "UMP terendah" at "terendah" (26.77); UMP tile at "dua koma tiga dua juta" (28.10); average tile at "tiga koma tujuh satu juta" (30.86) | Lowest UMP in Indonesia, average above it. |
| B7 | explainer | explainer | "UMP / batas provinsi" then the UMK card and Karawang value | UMP y 380..560; sub y 570; card y 690..920; kicker y 960; value y 1030..1220 | UMP itu batas provinsi (32.69) | Ini (41.08) | UMK card at "UMK" (36.44); Karawang kicker at "Karawang" (37.75); value at "lima koma delapan sembilan juta" (39.19) | UMP is a provincial floor; each kabupaten/kota has a UMK (Karawang example). |
| B8 | close | close-card | Caveat card (average net wage of workers, not proof of a violation) + CTA pill | card y 500..890; pill y 940..1074 | Ini (41.08) | END (last word + 0.25 s) | CTA pill at "perusahaan" (43.54), holds to the end | Honest caveat, then follow. Close is 4.97 s. |

Framing check: B1 claim, B2 locate-java, B3 bars, B4 full-map, B5 locator-bars, B6 zoom-province, B7 explainer, B8 close-card.
No two consecutive beats share a framing.

Persistent overlays (all beats): brand tag (top-right, from 0.6 s, no DRAFT badge in v2), map credit (bottom, y 1462..1490),
word-synced captions (lower third, word highlighted yellow), source credit (top-left, from 24.48 s).

Numbers on screen are derived from `research/data.csv` (and `research/umk_examples.csv` for Karawang) and spoken at the
cue that reveals them. The map label "Papua: tiga dari empat prov. di bawah UMP" is spelled in words, so it needs no citation exemption.
