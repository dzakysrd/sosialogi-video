# Beat plan: video-01 "UMP vs gaji asli" (DRAFT, provisional data)

Written before the build. The build (`tools/build.mjs`) implements these rows, and `tools/lint.mjs`
checks the framing and cue columns against the timeline it produces. Times are never typed here:
each start and end is a word cue resolved from `assets/words.json` (`cue(word, after)`).

Canvas 1080x1920, 30 fps. Target: Instagram Reels (TikTok-compatible). Safe box for critical content: x 65..940, y 220..1500
(top 220, bottom 420, left 65, right 140 for the action column). All values live in `video.config.json` (`safe`) and are
written as CSS variables into index.html; `tools/lint.mjs` reads the same config.
Hero zone y 330..1260. Captions y 1270..1440 (max 2 lines). Map credit y 1462..1490.
Hook title sits in the vertical centre band y 560..1360 so the profile-grid crop shows it.
Map frame: 1000 px wide, x 40..1040, y 520..1080 (map is graphic, not text, so it may pass x 940).
Brand tag (`video.config.json` brand, currently "@dzakysrd"): top-right, right edge x 940, top 220. Badge: top-left, x 65, top 220.

| # | id | framing | hero (one main element) | screen zones | start cue | end cue | other cues (element appears at) | job |
|---|----|---------|-------------------------|--------------|-----------|---------|----------------------------------|-----|
| B1 | hook | title | Title "UMP vs gaji asli" (two lines, 190 px Anton) | title block y 600..940 (inside band 560..1360); dim full-country map as decorative backdrop y 960..1320 (may pass the safe box) | UMP | Tahun | title words from "UMP" | State the tension in the first second. Opens on the title, never on the brand tag (brand fades in at 0.6 s). |
| B2 | jakarta-locate | full-map | Full-country map, DKI Jakarta lit (glow + pulse), others dimmed | headline y 330..470; map y 520..1080; callout beside Jakarta | Tahun | lima koma tujuh tiga juta | "Jakarta": callout "DKI Jakarta" | Show where the highest UMP is. |
| B3 | jakarta-number | big-number | "Rp5,73 jt" count-up, then slam | label y 420..500 (includes "2026"); number y 520..760; sublabel y 800..850 | lima koma tujuh tiga juta | Jawa Barat | number count-up from "lima" (landing 0.5 s later) | Put the figure on screen as it is spoken. |
| B4 | jabar-zoom | zoom-province | Jawa Barat zoomed so it fills 60% of frame width; "Rp2,32 jt" label on it | map frame y 520..1080 (clipped); label at centre | Jawa Barat | Tapi | "dua koma tiga dua juta": value label | Show the lowest UMP. Dimmed neighbours stay in frame. |
| B5 | aceh-bars | bars | Two bars: UMP Rp3,93 jt (accent) vs gaji rata-rata Rp2,84 jt (bad tone) | title "ACEH" y 340..440; locator map y 480..612 (Aceh lit); bars y 690..1110 | Tapi | Dari | "Aceh": title and locator; "tiga koma sembilan tiga juta": bar 1; "dua koma delapan empat juta": bar 2 | Compare UMP with the average wage for Aceh. |
| B6 | ten-lowest | full-map | Full-country map: 10 lowest-wage provinces, 7 red (below UMP), 3 teal (above UMP) | headline y 330..470 ("dari 10 provinsi", "7"); sub y 500..560; map y 520..1080; legend y 1040..1100 | Dari | Rata-rata | "sepuluh": headline "dari 10 provinsi"; "tujuh provinsi": "7" and colours; "di bawah UMP": sub line; "Lampung", "Sumatera Utara": name labels | Show that 7 of the 10 lowest-wage provinces are below UMP. |
| B7 | close-credit | credit | Source card (on-screen text from script.json) and follow CTA | source card y 430..930; CTA pill y 1050..1150 | Rata-rata | END (last word end + 0.8 s) | "Follow": CTA pill | Credit the data and the map; ask for the follow. |

Framing check: B1 title, B2 full-map, B3 big-number, B4 zoom-province, B5 bars, B6 full-map, B7 credit.
No two consecutive beats share a framing.

Persistent overlays (all beats): badge "DRAFT · data belum final" (top-left), brand tag (top-right, from config),
map credit "Peta: MapSVG (CC BY 4.0), diubah" (bottom, y 1462..1490), word-synced captions (lower third, word highlighted yellow).

Changes from the TikTok plan (Reels safe zones now apply): brand and badge moved from top 180 to top 220; captions moved
to y 1270..1440; map credit moved from y 1488 to y 1462..1490; B1 title moved into the 560..1360 band; nothing critical
sits below y 1500.

Known deviations, decided in the build (listed for review):
- Source credit (B7) and map credit contain years and "4.0" that are not spoken in that beat. These are citation
  text, not data claims, so the lint treats them as citation exemptions (`citation: true`).
- B7 is about 9.5 s long with a mostly static card. Candidate to tighten after review.
