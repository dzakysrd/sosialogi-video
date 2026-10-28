# PRD-12: video-02 cue-driven build (timing, captions, audio, six scenes)

## Context
- `video-02/` (PRD-11) is a copy of `template/`: `tools/build.mjs` reads `scenes.json` (fixed durations) and writes `index.html` from `src/template.html`; `components/sos.js` builds one paused GSAP timeline from the config (`window.SOS.build(cfg)`, builders add tweens at absolute times); `components/sos.css` holds tokens and styles. `tools/lib/` has `cue.mjs` (`makeCue(words)` -> `{cue(word, after), cueSpan(word, after)}`; a cue is the start time of the next exact token match after `after`), `csv.mjs` (`parseCsv`), `nums.mjs` (`intWords`, `digitWords`, `spokenInt`, `fmtPct`, `spokenPct`, `fmtInt`).
- Script: `research/video-02/script_v1.json` (6 scenes: s1_hook 9 words, s2_series 27, s3_grid 10, s4_provinces 23, s5_pln 21, s6_close 16; total 106).
- Voice take: `voice/samples/video-02/el_liam/` (`vo.mp3` 42.096 s, `words.json` 106 entries with `text`, `start`, `end`; `sentences.json` 11 entries). Gates measured in PRD-10: hook 3.34 s, close 6.48 s, total 42.11 s (tail 0.25 s).
- Data: `research/video-02/re_national.csv` (`year,ratio_pct,...`), `research/video-02/re_province.csv` (`province,year,re_pln,re_non_pln,re_ltshe,re_total,...`; empty cell = 0).
- Patterns to port from video-01 v3 (read them): word-synced captions in `video-01/tools/build_v3.mjs` lines 383-432 (chunks of at most 5 words and 34 characters, new chunk at a sentence start, after `,.;:!?` when the chunk has 2+ words, and where a number phrase starts; `caption_display` runs become one caption word; each word gets class `on` from its start to its end) and their style in `video-01/components/video_v3.css` lines 30-36 (`.cap`, `.cap .w.on`); brand tag fades in at 0.6 s; `<audio>` with `data-duration` = the VO length measured with ffprobe.
- Rules from video-01 kept for video-02: every number on screen appears at the start of its spoken cue, never earlier; no count-up animations (they show digits that are not spoken); at most 3 text blocks per frame (captions count, the brand tag does not); the sources line appears only on the final card and is a citation (class `cite`, exempt from the spoken-number rule).
- Design decisions by the main agent (layout values are starting points; keep everything inside the Reels safe box x 65..940, y 220..1500; main content in the hero band y 420..1320; caption pill bottom edge at y 1440):

## Goal
`node video-02/tools/build.mjs` turns the script, the voice take, the data and a scene plan into `video-02/index.html` and `video-02/build/timeline.json`, with every scene boundary and every element on a word cue, word-synced captions, the VO audio, and the gates checked. No render yet (PRD-14).

## Changes allowed
- Create `docs/prd/12-video02-build.md` (this PRD, verbatim).
- In `video-02/`: rewrite `tools/build.mjs`, `components/sos.js`, `components/sos.css`, `src/template.html`, `scenes.json`; create `video.config.json`; generated outputs `index.html`, `build/timeline.json`, `assets/vo/vo.mp3`, `assets/vo/words.json`, `assets/vo/sentences.json`. You may remove the map assets and map code from video-02 if the build no longer needs them (say so).
- Nothing else in the repo. Snapshots and contact sheets go to scratch.

## Steps
1. Save this PRD verbatim.
2. `video-02/video.config.json`:
   {"platform": "Instagram Reels (also fine for TikTok)", "width": 1080, "height": 1920, "fps": 30, "brand": "@dzakysrd",
    "safe": {"top": 220, "bottom": 420, "left": 65, "right": 140}, "hero_band": {"top": 420, "bottom": 1320},
    "hook_max_s": 3.5, "close_max_s": 7.0, "total_max_s": 45, "tail_s": 0.25,
    "loudness": {"I": -14, "TP": -1.5, "LRA": 11},
    "voice": {"dir": "../voice/samples/video-02", "variant": "el_liam"},
    "inputs": {"script": "../research/video-02/script_v1.json", "national": "../research/video-02/re_national.csv", "province": "../research/video-02/re_province.csv", "scenes": "scenes.json"}}
   (Paths are relative to `video-02/`.)
3. `video-02/scenes.json` is the visual plan. One entry per script scene, same ids and order. Elements name their cue (a word or phrase from that scene's vo_text) and take numbers from the data by reference; the build resolves times and values. Write it to express exactly the plan below (choose the JSON shape; keep it readable):
   - s1_hook, type `claim`: kicker "DULU" and lines "RUMAH TANGGA" / "BELUM BERLISTRIK" visible from 0 s (frame 1 has no digits); reveal line "HAMPIR 1 DARI 5" at cue "satu dari lima", data check `one_in_five_2013`. Layout: kicker 44 px accent at about y 560; lines Anton 120 px white; reveal Anton 150 px accent below; one text block.
   - s2_series, type `pair`: title "RASIO ELEKTRIFIKASI" at the scene start; row 1: year from re_national 2013 at cue "dua ribu tiga belas", value fmtPct(re_national 2013) at cue "delapan puluh koma lima satu persen"; row 2: year 2025 at cue "dua ribu dua puluh lima", value fmtPct(re_national 2025) at cue "sembilan puluh sembilan koma delapan tiga persen". Each row: year Anton 72 px dim, value Anton 160 px white, and a bar track 875 px wide, 28 px high, whose fill width = value/100 of the track, growing in 0.6 s from the value's cue. The rows sit in one chart block; title + chart block = 2 text blocks.
   - s3_grid, type `grid`: 1000 dots, 40 columns x 25 rows, dot 16 px, gap 6 px (874 x 544 px), at about y 500. Lit colour accent (#ffd23f), unlit colour #33445c. State 1 from the scene start, label "DULU": unlit = round(10 * (100 - re_national 2013)) = the last 195 dots in reading order. At cue "tinggal": label switches to "SEKARANG" and the unlit dots light up with a stagger over 1.2 s until unlit = round(10 * (100 - re_national 2025)) = 2 (the last 2 dots stay unlit). Headline "KURANG DARI 2 PER 1.000" (Anton 96 px) with subline "rumah tangga belum berlistrik" (36 px) at cue "dua per seribu", data check `under_two_per_1000_2025`. No digits on the grid itself. Blocks: grid with its label (1) + headline (1).
   - s4_provinces: part A, type `textcard`, from the scene start until cue "Data": "SETAHUN TERAKHIR" / "TIDAK BERGERAK" (Anton 110 px, second line accent), data check `flat_last_year`. Part B, type `rankbars`, from cue "Data" to the scene end: title "BELUM BERLISTRIK" (44 px, 800); subtitle "akhir " + the re_province year (2023) at cue "dua ribu dua puluh tiga"; five rows = the five provinces with the lowest re_total, sorted by (100 - re_total) descending, appearing at cue "terendah" with 0.1 s stagger; each row: province name exactly as in the CSV (36 px, 700, column 340 px) and a bar (track 520 px, 40 px high) whose width = (100 - re_total) / max of the five; no numbers on the bars. At cue "Papua Pegunungan": that row turns bad (#ff6b35) and its name accent; others stay neutral (#9fb2cc). Label "PAPUA PEGUNUNGAN: " + fmtPct(re_total) + " BERLISTRIK" under the rows at cue "sembilan puluh tiga koma delapan dua persen", data check `lowest_province`. Blocks: chart (title, subtitle, rows) + label.
   - s5_pln, type `stack`: title "PAPUA PEGUNUNGAN" (Anton 96 px) from the scene start; a stacked bar 875 px wide, 90 px high, segments in this order with widths proportional to the values: PLN = re_pln (#2dd4bf), non-PLN = re_non_pln (#9fb2cc), lampu surya = re_ltshe (#ffd23f), belum = 100 - re_total (#ff6b35); a legend row under it with the four names (no digits); bar grows in 0.8 s from the scene start. Message area (one block, replaced as the VO goes on): at cue "empat belas koma nol enam persen": "TERSAMBUNG PLN" + fmtPct(re_pln) (Anton 170 px, teal) and the PLN segment outlined; at cue "Lebih dari separuhnya": "LEBIH DARI SEPARUH:" / "LAMPU TENAGA SURYA" (accent) and the lampu surya segment outlined, data check `ltshe_over_half`; at cue "dihitung berlistrik": add the line "IKUT DIHITUNG BERLISTRIK". Blocks: title + chart (bar and legend) + message would be 3 plus the caption; so put title and chart in one block.
   - s6_close, type `close`: at cue "Langkah": "LANGKAH TERAKHIR" / "PALING SULIT" (Anton 110 px); at cue "Selamat": add "SELAMAT HARI LISTRIK NASIONAL" (48 px, 800, accent) in the same block; at cue "Yuk": that block fades out and the final card shows a CTA pill "Follow @dzakysrd" (accent background, 64 px, 800) at about y 720..840 and the sources line from the script's `sources_line` (class `cite`, 30 px, at most 2 lines, about y 900..980).
4. Named data checks (the build fails with a clear message if any is false; print each with its values):
   - `one_in_five_2013`: 18 <= 100 - re_national[2013] < 20.
   - `under_two_per_1000_2025`: 1 <= 10 * (100 - re_national[2025]) < 2.
   - `flat_last_year`: re_national[2024] == re_national[2025] (as strings).
   - `lowest_province`: Papua Pegunungan has the strictly lowest re_total.
   - `ltshe_over_half`: re_ltshe[Papua Pegunungan] > 50.
5. `video-02/tools/build.mjs` (rewrite; ES module, style like the template build: validate first and print every problem, then write):
   a. Load config, script, scenes.json, CSVs, and the voice variant; copy `vo.mp3`, `words.json`, `sentences.json` to `video-02/assets/vo/`; measure the VO length with ffprobe.
   b. Checks: words.json length == script word count (106); word texts equal the script tokens (compare letters and digits only); no digit in any vo_text; scenes.json ids == script ids in order.
   c. Timing: scene i starts at the start of its first word (scene 1 at 0); ends where the next scene starts; the last ends at TOTAL = last word end + tail_s. Every element time = `cue(phrase, sceneStart - 0.001)`, and it must fall inside its scene; fail otherwise.
   d. Numbers: every element text that contains a digit is registered as `{text, spoken, t, scene, derive}`; `spoken` must occur in the scene's vo_text and `t` is the cue of `spoken`. Percent values come from `fmtPct` of the CSV string and their spoken form from `spokenPct`; years from the CSV and `spokenInt`; "HAMPIR 1 DARI 5" is spoken "satu dari lima" and "2 PER 1.000" is spoken "dua per seribu" (literal pairs, each tied to its data check). The sources line is exempt (citation).
   e. Gates from the config: hook = end of scene 1's last word - start of its first word; close = TOTAL - start of scene 6; total = TOTAL. Fail if over; print all three.
   f. Captions: port the video-01 v3 algorithm (see Context) including `caption_display` from the script.
   g. Write `index.html` (from `src/template.html`; inline the CSS as the template does; brand tag "@dzakysrd" top-right inside the safe box, fading in at 0.6 s; `<audio id="vo" src="assets/vo/vo.mp3" data-start="0" data-duration="<VO length>">`) and `build/timeline.json` with: total, vo_seconds, gates, scenes [{id, start, end}], every resolved cue time, the numbers registry, the caption chunks with their word times, and the data-check results.
   h. Print a summary: scenes with start/end, gates, number of caption chunks, and the numbers registry.
6. `components/sos.js` and `components/sos.css`: builders for `claim`, `pair`, `grid`, `textcard`, `rankbars`, `stack`, `close`, plus captions and brand, all on one paused timeline at the absolute times from the config. Every element that carries text has `data-tb` on its block container (one per text block), the sources line has class `cite`, captions have class `cap`. Text appears by a short fade or rise (about 0.2-0.3 s) starting exactly at its cue; numbers are never animated through other values. Scenes fade in over 0.2 s at their start (scene 1 is visible at 0) and fade out over 0.2 s before their end. Safe-box CSS variables come from the config.
7. Verify:
   a. `cd video-02 && node tools/build.mjs` (paste the full output).
   b. `cd video-02 && npx --yes hyperframes@0.8.206 check` (paste the summary and every error or warning).
   c. Frames: from `build/timeline.json`, take these times: every scene start + 0.4 s; the middle of every scene; every number's t + 0.6 s; the grid at cue "tinggal" + 0.6 s and + 1.4 s; the final card at the "Yuk" cue + 1.0 s; and TOTAL - 0.3 s. Use `npx --yes hyperframes@0.8.206 snapshot --at <comma-separated times>` in `video-02/` (find where it writes the PNGs; move them to `<scratch>/frames/` so nothing stays in the repo), name each by its time. Make a contact sheet with `montage` (4 columns, each tile 270x480 with the time as its label) at `<scratch>/sheet.jpg`. Look at the sheet and at the full-size frames for s1, s3, s4 and s5 with the Read tool, and report what you see: overlaps, text outside the safe box, cut-off text, unreadable contrast, empty frames, a number visible before its cue.
   d. `git status --short --untracked-files=all` (after moving the snapshots out).

STOP and report if: a data check or a gate fails (do not change data, text, gates or cue words to make it pass); the word check fails; a cue does not resolve inside its scene; `hyperframes check` reports errors you cannot fix within the allowed files.

## Acceptance
- The build prints all five data checks true and the three gates under their limits (expected from PRD-10: hook 3.34, close 6.48, total 42.11).
- Every number in the registry has t equal to the cue of its spoken form.
- `hyperframes check`: 0 errors (warnings listed).
- Contact sheet and the listed full-size frames looked at, with findings reported.
- git status lists only the PRD and files under `video-02/`.

## Budget
0 paid calls.

## Report
Paste verbatim: the build output, the check summary, the numbers registry, the gate values, the list of frame times and the contact-sheet path, your findings per scene from the frames, and the git status. Say what you did not verify.

## Outcome (2026-10-28 WIB, measured)
- `node video-02/tools/build.mjs` builds `index.html` and `build/timeline.json`: 6 scenes on word cues, total 42.114 s, VO 42.096 s; data checks all true; gates hook 3.344 s, close 6.48 s, total 42.114 s; 9 numbers registered, each at the cue of its spoken form; 33 caption chunks.
- `hyperframes check`: 0 errors; warnings: one dense-track lint warning (33 caption chunks plus the brand) and six craft `line_unread` warnings (short caption chunks and the s3 headline on screen about 0.9 s).
- The map assets and map code were removed from video-02 (no map in this video, PRD-08b). Two size fixes: the hook reveal is 140 px and the province names are 32 px, to stay in the safe box.
- Reviewed by the main agent: the 25-frame contact sheet and full-size frames at 11.985 s and 25.55 s. Found for a follow-up PRD: the s3 headline "KURANG DARI 2 PER 1.000" is on screen too briefly; the s4 province chart is visually weak and its frames before "terendah" are mostly empty; caption chunks split number phrases ("satu dari" / "lima ...", "dua per" / "seribu") and leave single words ("persen", "sulit", "berlistrik").
- Not done yet: lint port, render and loudness (PRD-14).
