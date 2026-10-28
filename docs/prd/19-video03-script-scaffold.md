# PRD-19: video-03 script v1 and scaffold

## Context
- Data: `research/video-03/neet_province.csv`, `tpt_age.csv`, `tpt_province.csv` (PRD-18). Period of the 2025 tables is not stated by BPS; the video says "2025" only.
- Script text: drafted by the main agent, reviewed by a copywriter sub-agent, approved by the user on 2026-10-28 ("ok lanjut"). The "Rata-Rata 4,85%" contrast was left out (the file does not define "Rata-Rata"; it would also push the total over 45 s).
- Engine: `video-02/` (scene types claim, pair, grid, textcard, rankbars, stack, close). `video-02/tools/build.mjs` reads `re_national.csv` and `re_province.csv`; rewiring it to the video-03 data is a later PRD.
- `video-02/tools/lib/nums.mjs` has `fmtPct` ("29.52" -> "29,52%") and `spokenPct` ("29,52%" -> "dua puluh sembilan koma lima dua persen"), and `spokenInt` for years.

## Goal
1. `research/video-03/script_v1.json` with the approved text and every number tied to the data.
2. `video-03/` as a copy of the video-02 engine without video-02's outputs.

## Changes allowed
- `docs/prd/19-video03-script-scaffold.md` (this PRD).
- `research/video-03/script_v1.json`.
- `video-03/`: copies listed in step 4, plus `meta.json`, `package.json`.
- Nothing else.

## Steps
1. Save this PRD verbatim.
2. Write `research/video-03/script_v1.json` exactly as the JSON in the Appendix (2-space indent, UTF-8, trailing newline).
3. Checks (a node or python3 -I script in scratch, not in the repo). Print every check:
   - No digit in any `vo_text`.
   - Every `numbers[].spoken` and every `cue_words[]` entry occurs in its scene's `vo_text` (exact substring).
   - For every `numbers[]` entry whose `show` ends in "%": `spokenPct(show) === spoken` using `video-02/tools/lib/nums.mjs`, and `show === fmtPct(<CSV value>)` for the CSV cell named in `derive` (province or age_group row, column neet_pct or tpt_pct).
   - `spokenInt("2025") === "dua ribu dua puluh lima"`.
   - Data claims: INDONESIA neet_pct < 20; SULAWESI UTARA has the highest and BALI the lowest neet_pct among the 38 non-national rows; 15-19 has the highest tpt_pct among the 10 age groups (Rata-Rata excluded); 2026 - 1928 = 98.
   - Word count: total words of all `vo_text` joined with spaces, split on whitespace. Expected 106. Print per scene.
4. Scaffold `video-03/`: copy from `video-02/` unchanged: `AGENTS.md`, `CLAUDE.md`, `assets/fonts/*`, `components/*`, `hyperframes.json`, `scenes.json`, `src/template.html`, `tools/build.mjs`, `tools/lint.mjs`, `tools/render.sh`, `tools/test_nums.mjs`, `tools/lib/*`, `vendor/gsap.min.js`, `vendor/LICENSES/*`, `video.config.json`. Do NOT copy `index.html`, `out/`, `build/`, `assets/vo/`. `cmp` each copy and print the result.
   - `meta.json`: `{"id": "video-03", "name": "video-03-hari-sumpah-pemuda", "createdAt": "<current UTC, ISO 8601>"}`.
   - `package.json`: video-02's with `"name": "video-03-hari-sumpah-pemuda"`; print the diff against video-02's.
   - `scenes.json`, `video.config.json` and the tools stay video-02's for now (a later PRD changes them). Do not run any build or render in `video-03/` in the repo.
5. `node video-02/tools/test_nums.mjs` must still pass (unchanged); print the last 5 lines.
6. `git status --short --untracked-files=all`: only this PRD, `research/video-03/script_v1.json` and files under `video-03/`.

## Acceptance
All step 3 checks pass; every copy identical; git status as in step 6.

## Budget
0 paid calls. No network.

## Report
Step 3 output in full, `cmp` results, package.json diff, step 5 and 6 output.

## Appendix: script_v1.json
{
  "version": "v1",
  "status": "v1 (2026-10-28): approved by the user.",
  "word_count_target": [95, 120],
  "max_seconds": 45,
  "cta": "Follow @dzakysrd",
  "sources_line": "Sumber: BPS (NEET 15-24 menurut provinsi 2025; TPT menurut kelompok umur 2025)",
  "scenes": [
    {
      "id": "s1_hook",
      "vo_text": "Hampir satu dari lima anak muda tidak sekolah, tidak kerja.",
      "on_screen_text": "frame 1: ANAK MUDA TIDAK SEKOLAH, TIDAK KERJA (no digits) -> at 'satu dari lima': HAMPIR 1 DARI 5",
      "visual": "claim headline; the number appears at its cue",
      "cue_words": ["satu dari lima"],
      "numbers": [
        {"show": "1 DARI 5", "spoken": "satu dari lima", "derive": "neet_province[INDONESIA].neet_pct = 19.44, under 20, so 'hampir 1 dari 5'"}
      ],
      "vo_max_seconds": 3.5
    },
    {
      "id": "s2_neet",
      "vo_text": "Tidak ikut pelatihan juga. Data BPS dua ribu dua puluh lima: sembilan belas koma empat empat persen, usia lima belas sampai dua puluh empat.",
      "on_screen_text": "NEET = TIDAK SEKOLAH, TIDAK BEKERJA, TIDAK IKUT PELATIHAN / BPS 2025 / 19,44% / USIA 15-24",
      "visual": "big number with the NEET definition; each number at its cue",
      "cue_words": ["pelatihan", "dua ribu dua puluh lima", "sembilan belas koma empat empat persen", "lima belas sampai dua puluh empat"],
      "numbers": [
        {"show": "2025", "spoken": "dua ribu dua puluh lima", "derive": "neet_province year"},
        {"show": "19,44%", "spoken": "sembilan belas koma empat empat persen", "derive": "neet_province[INDONESIA].neet_pct"},
        {"show": "15-24", "spoken": "lima belas sampai dua puluh empat", "derive": "age band in the NEET table title"}
      ]
    },
    {
      "id": "s3_caveat",
      "vo_text": "Ini bukan ukuran malas. Yang sedang cari kerja atau mengurus keluarga ikut terhitung.",
      "on_screen_text": "BUKAN UKURAN MALAS / YANG CARI KERJA & MENGURUS KELUARGA IKUT TERHITUNG",
      "visual": "text card",
      "cue_words": ["bukan ukuran malas", "cari kerja", "mengurus keluarga"],
      "numbers": [],
      "claims": ["NEET counts everyone aged 15-24 not in school, work or training, whatever the reason (table title, research/video-03/sources.md Definitions); job seekers and those caring for family meet that definition"]
    },
    {
      "id": "s4_tpt",
      "vo_text": "Yang paling berat, remaja lima belas sampai sembilan belas tahun. Di angkatan kerjanya, dua puluh tiga koma tiga empat persen menganggur.",
      "on_screen_text": "USIA 15-19 / TINGKAT PENGANGGURAN TERBUKA 23,34% / dari angkatan kerja",
      "visual": "big number; optional bars of TPT by age group without value labels, only 15-19 labelled",
      "cue_words": ["lima belas sampai sembilan belas", "angkatan kerjanya", "dua puluh tiga koma tiga empat persen"],
      "numbers": [
        {"show": "15-19", "spoken": "lima belas sampai sembilan belas", "derive": "tpt_age age_group 15-19"},
        {"show": "23,34%", "spoken": "dua puluh tiga koma tiga empat persen", "derive": "tpt_age[15-19].tpt_pct"}
      ],
      "claims": ["'paling berat': tpt_age[15-19] is the highest of the 10 age groups (Rata-Rata excluded)", "TPT = unemployed as a share of the labour force (working or looking for work)"]
    },
    {
      "id": "s5_provinces",
      "vo_text": "Anak muda NEET per provinsi: tertinggi Sulawesi Utara, dua puluh sembilan koma lima dua persen. Terendah Bali, lima koma tiga tiga persen.",
      "on_screen_text": "NEET PER PROVINSI / TERTINGGI: SULAWESI UTARA 29,52% / TERENDAH: BALI 5,33%",
      "visual": "rankbars of the 38 provinces (or top and bottom five) without value labels; only Sulawesi Utara and Bali labelled",
      "cue_words": ["NEET per provinsi", "Sulawesi Utara", "dua puluh sembilan koma lima dua persen", "Bali", "lima koma tiga tiga persen"],
      "numbers": [
        {"show": "29,52%", "spoken": "dua puluh sembilan koma lima dua persen", "derive": "neet_province[SULAWESI UTARA].neet_pct, the highest"},
        {"show": "5,33%", "spoken": "lima koma tiga tiga persen", "derive": "neet_province[BALI].neet_pct, the lowest"}
      ]
    },
    {
      "id": "s6_close",
      "vo_text": "Selamat Hari Sumpah Pemuda yang ke sembilan puluh delapan. Yuk, follow et Dzaky es er de.",
      "on_screen_text": "SELAMAT HARI SUMPAH PEMUDA KE-98 -> final card at 'Yuk': CTA pill Follow @dzakysrd + sources line; caption shows @dzakysrd while 'et Dzaky es er de' is spoken",
      "visual": "closing line; then the final card",
      "cue_words": ["Selamat", "sembilan puluh delapan", "Yuk", "follow"],
      "numbers": [
        {"show": "KE-98", "spoken": "ke sembilan puluh delapan", "derive": "2026 - 1928 = 98 (Sumpah Pemuda, 28 Oktober 1928)"}
      ],
      "caption_display": [
        {"spoken": "et Dzaky es er de", "show": "@dzakysrd"}
      ]
    }
  ]
}

## Outcome (2026-10-28, measured)
- `research/video-03/script_v1.json` written; all checks pass (no digits in the VO, every spoken number and cue in its scene, every percent tied to its CSV cell, data claims hold). 106 words. Re-checked by the main agent.
- `video-03/` scaffolded from `video-02/` (all copies identical; `package.json` differs only in the name). `scenes.json`, `video.config.json` and the tools are still video-02's; a later PRD rewires them.
