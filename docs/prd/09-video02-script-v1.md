# PRD-09: video-02 script v1 and narration file

## Context
- The user approved the VO text below on 2026-10-28 (WIB), including "Selamat Hari Listrik Nasional." in the close, the hook "1 dari 5", and a 1,000-dot grid for scene 3. Gates: try the video-01 v3 values (hook 3.5 s, close 7.0 s, total 45 s); if one fails later, stop and ask the user.
- Data: `research/video-02/re_national.csv` and `research/video-02/re_province.csv` (Kementerian ESDM; see `research/video-02/sources.md`).
- Format model: `research/script_v3.json` (keys version, status, word_count_target, max_seconds, cta, sources_line, scenes; each scene has id, vo_text, on_screen_text, visual, cue_words, optional caption_display and vo_max_seconds). This script adds a `numbers` list per scene and a `claims` list where a sentence states a fact without a number.
- Narration model: `voice/samples/v3/narration_v3.txt` (the scenes' vo_text joined with one space, in scene order).

## Goal
Write the approved script as `research/video-02/script_v1.json` and the narration as `voice/samples/video-02/narration_v1.txt`, and check them against the data.

## Changes allowed
- Create `docs/prd/09-video02-script-v1.md` (this PRD, verbatim), `research/video-02/script_v1.json`, `voice/samples/video-02/narration_v1.txt`. Nothing else in the repo.

## Steps
1. Save this PRD verbatim.
2. Write `research/video-02/script_v1.json` with exactly this content (2-space indentation, UTF-8, ensure_ascii false, trailing newline):

{
  "version": "v1",
  "status": "DRAFT v1 (2026-10-28 WIB). VO approved by the user. Data: research/video-02/re_national.csv and re_province.csv (Kementerian ESDM). Province-beat visual pending PRD-08b: a 38-province map if a usable one is found, else bars of the five lowest provinces.",
  "word_count_target": [95, 120],
  "max_seconds": 45,
  "cta": "Follow @dzakysrd",
  "sources_line": "Sumber: Kementerian ESDM (HEESI 2024, HEESI 2025, Laporan Kinerja 2023)",
  "scenes": [
    {
      "id": "s1_hook",
      "vo_text": "Dulu, hampir satu dari lima rumah tangga belum berlistrik.",
      "on_screen_text": "frame 1: RUMAH TANGGA BELUM BERLISTRIK (no digits) -> at 'satu dari lima': HAMPIR 1 DARI 5",
      "visual": "claim headline; the number appears at its cue",
      "cue_words": ["satu dari lima"],
      "numbers": [
        {"show": "1 DARI 5", "spoken": "satu dari lima", "derive": "100 - re_national[2013] = 19.49 percent, under 20, so 'hampir 1 dari 5'"}
      ],
      "vo_max_seconds": 3.5
    },
    {
      "id": "s2_series",
      "vo_text": "Itu tahun dua ribu tiga belas, rasio elektrifikasi delapan puluh koma lima satu persen. Tahun dua ribu dua puluh lima, sembilan puluh sembilan koma delapan tiga persen.",
      "on_screen_text": "RASIO ELEKTRIFIKASI / 2013: 80,51% -> 2025: 99,83%",
      "visual": "two big numbers (or two bars), each shown at its spoken cue",
      "cue_words": ["dua ribu tiga belas", "delapan puluh koma lima satu persen", "dua ribu dua puluh lima", "sembilan puluh sembilan koma delapan tiga persen"],
      "numbers": [
        {"show": "2013", "spoken": "dua ribu tiga belas", "derive": "re_national year 2013"},
        {"show": "80,51%", "spoken": "delapan puluh koma lima satu persen", "derive": "re_national[2013]"},
        {"show": "2025", "spoken": "dua ribu dua puluh lima", "derive": "re_national year 2025"},
        {"show": "99,83%", "spoken": "sembilan puluh sembilan koma delapan tiga persen", "derive": "re_national[2025]"}
      ]
    },
    {
      "id": "s3_grid",
      "vo_text": "Artinya, yang belum berlistrik tinggal kurang dari dua per seribu.",
      "on_screen_text": "at 'dua per seribu': KURANG DARI 2 PER 1.000 / rumah tangga belum berlistrik",
      "visual": "grid of 1,000 dots; unlit dots = round(10 * (100 - re_national[year])): DULU (2013) 195 unlit, then SEKARANG (2025) 2 unlit; no digits on the grid",
      "cue_words": ["Artinya", "dua per seribu"],
      "numbers": [
        {"show": "2 PER 1.000", "spoken": "dua per seribu", "derive": "100 - re_national[2025] = 0.17 percent = 1.7 per 1,000, under 2"}
      ]
    },
    {
      "id": "s4_provinces",
      "vo_text": "Setahun terakhir angkanya tidak bergerak. Data provinsi akhir dua ribu dua puluh tiga, terendah Papua Pegunungan: sembilan puluh tiga koma delapan dua persen.",
      "on_screen_text": "SETAHUN TERAKHIR: TIDAK BERGERAK -> AKHIR 2023 / TERENDAH: PAPUA PEGUNUNGAN 93,82%",
      "visual": "short text card first (re_national[2024] = re_national[2025]); then the province view: a 38-province map if PRD-08b finds a usable one, else bars of the five lowest re_total provinces without value labels, only Papua Pegunungan labelled",
      "cue_words": ["Setahun", "dua ribu dua puluh tiga", "Papua Pegunungan", "sembilan puluh tiga koma delapan dua persen"],
      "numbers": [
        {"show": "2023", "spoken": "dua ribu dua puluh tiga", "derive": "re_province year"},
        {"show": "93,82%", "spoken": "sembilan puluh tiga koma delapan dua persen", "derive": "re_province[Papua Pegunungan].re_total, the lowest re_total"}
      ],
      "claims": ["'Setahun terakhir angkanya tidak bergerak': re_national[2024] = re_national[2025] = 99.83"]
    },
    {
      "id": "s5_pln",
      "vo_text": "Yang tersambung PLN baru empat belas koma nol enam persen. Lebih dari separuhnya lampu tenaga surya, dan itu ikut dihitung berlistrik.",
      "on_screen_text": "PAPUA PEGUNUNGAN / TERSAMBUNG PLN 14,06% / LEBIH DARI SEPARUH: LAMPU TENAGA SURYA",
      "visual": "Papua Pegunungan: PLN share as a big number; optional stacked bar PLN / non-PLN / LTSHE without value labels",
      "cue_words": ["PLN", "empat belas koma nol enam persen", "Lebih dari separuhnya", "dihitung berlistrik"],
      "numbers": [
        {"show": "14,06%", "spoken": "empat belas koma nol enam persen", "derive": "re_province[Papua Pegunungan].re_pln"}
      ],
      "claims": ["'Lebih dari separuhnya lampu tenaga surya': re_province[Papua Pegunungan].re_ltshe = 56.14 > 50", "'ikut dihitung berlistrik': definition in research/video-02/sources.md section 3a (LK 2023, printed pages 155-156)"]
    },
    {
      "id": "s6_close",
      "vo_text": "Langkah terakhir memang paling sulit. Selamat Hari Listrik Nasional. Yuk, follow et Dzaky es er de.",
      "on_screen_text": "LANGKAH TERAKHIR PALING SULIT -> final card at 'Yuk': CTA pill Follow @dzakysrd + sources line; caption shows @dzakysrd while 'et Dzaky es er de' is spoken",
      "visual": "closing line; then the final card",
      "cue_words": ["Langkah", "Selamat", "Yuk", "follow"],
      "caption_display": [
        {"spoken": "et Dzaky es er de", "show": "@dzakysrd"}
      ]
    }
  ]
}

3. Look at `voice/samples/v3/narration_v3.txt`: does it end with a newline? Write `voice/samples/video-02/narration_v1.txt` as the six vo_text values joined with one space, in scene order, ending the same way as the v3 file.
4. Checks, with a Python script in scratch (`python3 -I`), print every result:
   a. The JSON parses; top-level keys and scene ids are as above.
   b. Word count per scene and in total, counting words as `vo_text.split()` (whitespace). Total must be within word_count_target; print it either way.
   c. No digit in any vo_text.
   d. Every cue_words entry occurs in its own scene's vo_text (case-insensitive, after removing punctuation).
   e. Every numbers[].spoken occurs in its scene's vo_text the same way.
   f. Data checks from the CSVs (read with the csv module): print re_national 2013, 2024 and 2025 ratio_pct; 100 - 2013 value; 100 - 2025 value; round(10*(100 - value)) for 2013 and 2025; the lowest re_total province and its value; Papua Pegunungan re_pln and re_ltshe. Confirm: 2013 = 80.51, 2025 = 99.83, 2024 = 2025, lowest = Papua Pegunungan 93.82, re_pln = 14.06, re_ltshe > 50.
   g. The narration file equals the join of vo_text (byte compare), and its character count (`wc -m`), which is the expected ElevenLabs credit cost.
5. `git status --short --untracked-files=all`.

STOP and report if any check fails. Do not edit the text to make a check pass.

## Acceptance
- All checks in step 4 pass and are printed.
- git status shows the three files of this PRD, plus only files of the other sub-agent (`docs/prd/08b-map-hdx.md`); list them.

## Budget
0 paid calls.

## Report
Paste verbatim: the step 4 output, `cat` of the narration file, its `wc -m`, and the git status.

## Outcome (2026-10-28 WIB, measured)
- `research/video-02/script_v1.json` and `voice/samples/video-02/narration_v1.txt` written. 106 words (target 95-120), no digits in vo_text, every cue and spoken number found in its own scene, all data checks against the CSVs passed.
- Narration: 689 characters including the final newline, the expected ElevenLabs cost of one full take.
- Reviewed by the main agent: the narration equals the join of the six vo_text values, 106 words, no digits.
- Gates are not checked yet (no audio).
