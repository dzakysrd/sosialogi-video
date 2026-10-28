# PRD-24: video-03 caption and handoff

## Context
- The user approved `video-03/out/v1.mp4` on 2026-10-28 ("udah ok lanjut").
- Caption model: `video-02/out/v2_caption.txt`. Figures from `research/video-03/neet_province.csv` and `tpt_age.csv`. Download URLs of the BPS tables are not confirmed (`research/video-03/sources.md`), so the caption names the tables and bps.go.id without URLs.
- ElevenLabs credits: 3,062 of 10,000 used this period, from the character-cost header after the last call (the subscription counter lagged and showed 2,911).

## Goal
`video-03/out/v1_caption.txt` and an updated `HANDOFF.md`.

## Changes allowed
- This PRD; `video-03/out/v1_caption.txt`; `HANDOFF.md`.

## Steps
1. Save this PRD verbatim.
2. Write `video-03/out/v1_caption.txt` exactly as the "Caption" appendix (UTF-8, trailing newline).
3. Check (python3 -I, in scratch): each of these strings appears in the caption and matches the CSV value with a decimal comma: 19,44 (neet INDONESIA), 29,52 (SULAWESI UTARA), 5,33 (BALI), 23,34 (tpt_age 15-19). Print each check.
4. Update `HANDOFF.md`:
   a. First line after the heading: change "Snapshot of the repo as of 2026-10-27." to "Snapshot of the repo as of 2026-10-28."
   b. Insert the "Video #3 section" appendix as a new section directly before the line `## Rules and decisions (enforced in code or docs)`.
   c. In "## Next steps (ordered)": replace item 2's text with "ElevenLabs credits: 3,062 of 10,000 used this period (resets 2026-11-26), from the character-cost header of the last call on 2026-10-28 (the subscription endpoint lagged at 2,911)." Replace item 5's text with "Done: video-03 (Hari Sumpah Pemuda) is on branch `claude/video03-research`; see Video #3 status. Next video: start from the video-03 engine (`video-03/`), which reads its data tables from `video.config.json`."
   d. In "## Folder map", after the `video-01/` bullet block and before `thirdparty/`, add: "- `video-03/`: video #3 (Hari Sumpah Pemuda), the video-02 engine with data tables from `video.config.json` (`inputs.tables`), pair subtitle / title number / row labels and a close number. Research in `research/video-03/`, voice in `voice/samples/video-03/`, PRDs 18-24."
   Print `git diff --stat HANDOFF.md` and the new section.
5. Commit (expected `git status --short --untracked-files=all`: ` M HANDOFF.md`, `?? docs/prd/24-video03-caption-handoff.md`, `?? video-03/out/v1_caption.txt`; anything else STOP). Leak check: if the key is set, `grep -rcF -- "$ELEVENLABS_API_KEY" HANDOFF.md docs/prd/24-video03-caption-handoff.md video-03/out/v1_caption.txt | grep -v ':0$'` prints nothing. Commit via -F (file in /tmp/claude-0/-home-user-sosialogi-video/0c422472-a2b9-53c1-95d9-e918179901d9/scratchpad) with exactly:

Add the video-03 caption and update the handoff (PRD-24)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0146dBavbgHbn5BNBXYwUzi3

(use it exactly as written, trailer included)
6. `git push -u origin claude/video03-research` (retry only on network errors after 2, 4, 8, 16 s). Report `git log -1 --stat`, push output, `git status --short`.

## Budget
0 paid calls. No network except git push.

## Appendix: Caption
Hampir 1 dari 5 anak muda Indonesia tidak sekolah, tidak bekerja, dan tidak ikut pelatihan.

• NEET usia 15–24 tahun (BPS, 2025): 19,44% secara nasional.
• Provinsi tertinggi: Sulawesi Utara, 29,52%. Terendah: Bali, 5,33%.
• Tingkat pengangguran terbuka usia 15–19 tahun: 23,34% dari angkatan kerjanya, tertinggi di antara kelompok umur (BPS, 2025).

Catatan: NEET bukan ukuran malas. Yang sedang mencari kerja atau mengurus keluarga ikut terhitung. Tingkat pengangguran terbuka dihitung dari angkatan kerja (yang bekerja atau mencari kerja), bukan dari semua remaja. "Pemuda" menurut UU No. 40/2009 berusia 16–30 tahun; data di sini memakai usia 15–24 dan 15–19 tahun. BPS tidak mencantumkan bulan pada kedua tabel ini.

Selamat Hari Sumpah Pemuda ke-98 (28 Oktober 1928).

Sumber: BPS (bps.go.id, Tabel Statistik): "Persentase Usia Muda (15-24 Tahun) Yang Sedang Tidak Sekolah, Bekerja Atau Mengikuti Pelatihan (Persen), 2025" dan "Tingkat Pengangguran Terbuka Berdasarkan Kelompok Umur, 2025".

Suara: elevenlabs.io (link afiliasi: https://try.elevenlabs.io/8lsqn9kliaot)
Riset data & naskah dibantu Claude. Mau coba? Link referral ada di bio: kamu dapat 1 minggu Claude Pro gratis, dan aku dapat kredit pemakaian kalau kamu lanjut berlangganan. Kuota 3 orang.

#HariSumpahPemuda #SumpahPemuda #AnakMuda #DataIndonesia

## Appendix: Video #3 section
## Video #3 status

- Topic: Hari Sumpah Pemuda (28 October). Angle A, "Pemuda dan kerja" (chosen by the main agent; the user left the choice open, 2026-10-28). Branch `claude/video03-research`; PR not opened.
- Data (PRD-18): three BPS XLSX files downloaded by the user, stored unchanged in `research/video-03/raw/` (sha256 in `sources.md`): NEET 15-24 by province 2025, TPT by five-year age group 2025, TPT by province Februari 2026. `tools/extract.py` writes `neet_province.csv`, `tpt_age.csv`, `tpt_province.csv`. BPS gives no month for the 2025 tables; download URLs are not confirmed. TPT-by-age has no 15-24 group; it must not be averaged from 15-19 and 20-24.
- Script: `research/video-03/script_v2.json` (110 words). Drafted by the main agent, reviewed by a copywriter sub-agent, approved by the user; close line "Itu PR pemuda hari ini." chosen by the user (option B).
- Voice: ElevenLabs Liam, take `voice/samples/video-03/el_liam_close2` (splice of `el_liam` from "Terendah Bali"). Credits for video-03: 653 + 151.
- Gates: hook 3.5 s, close 7.5 s (raised from 7.2 by the user on 2026-10-28 for the close-B line), total 45 s. Measured: hook 3.40, close 7.41, total 43.08.
- Build (PRD-22, PRD-23): `video-03/tools/build.mjs` reads its tables from `video.config.json` `inputs.tables`; data checks `neet_one_in_five`, `neet_highest_sulut`, `neet_lowest_bali`, `tpt_1519_highest`, `years_since_1928`. Lint PASS.
- Output: `video-03/out/v1.mp4` (43.1 s, 1080x1920, 30 fps, -14.0 LUFS, true peak -4.2 dBFS). Approved by the user on 2026-10-28. Caption: `video-03/out/v1_caption.txt`.
- Open before posting: the Claude referral line ("Kuota 3 orang") is copied from video-02 and not re-checked; ElevenLabs free-plan terms (Next steps 3).
- Cosmetic, not fixed: `video-03/tools/lint.mjs` prints "lint video-02 (PRD-14)" in its header.
