# HANDOFF

Snapshot of the repo as of 2026-10-27. Facts here were checked against the files. Items marked **[session note]** came from the previous session and are not in the repo.

## Goal

Data-explainer vertical videos (Instagram Reels / TikTok, 1080x1920, 30 fps) for IG @dzakysrd, style reference @sosialogi. Built with HyperFrames `0.8.206` (pinned in every script in `video-01/tools/`) plus Indonesian TTS voiceover.

Video #1: "UMP vs gaji asli". Compares the 2026 provincial minimum wage (UMP) with the average net monthly wage of workers, from BPS Feb 2026, for 38 provinces.

## Folder map

- `template/`: reusable 1080x1920 HyperFrames template. `scenes.json` drives timings and text. All assets are vendored, with no CDN. `README.md` documents it. `demo.mp4` is its demo render.
- `voice/`: `tts.py`, edge-tts Indonesian voiceover with per-word timestamps (`words.json`, `sentences.json`). Loudness is -14 LUFS with true peak <= -1 dBTP. Options include `--max-pause` and `--tail-pad`. `samples/` holds voice previews (`ardi`, `gadis`, and `v3/v1..v3`). `tts_elevenlabs.py` is the ElevenLabs equivalent with the same outputs; it caches API responses in `raw/` and logs credit use in `voice/elevenlabs_usage.csv`. ElevenLabs previews are in `samples/elevenlabs/preview/` and the full v3 take in `samples/v3/el_liam/`.
- `docs/prd/`: one PRD per delegated task (01 ElevenLabs TTS script, 02 voice previews, 03a loudness fix and Liam take, 03b v3 render, 04a-04c spoken username in the close, 05 workflow skill, 06 video-02 base), each with its measured outcome.
- `.claude/skills/data-explainer-video/`: project skill with the working mode and the per-video workflow (PRD-05). The root `CLAUDE.md` points to it.
- `research/`: `bps_upah_feb2026.csv` (the BPS download, unedited), `data.csv` (merged 38-province table), `tools/merge.py` (re-runnable merge), `script.json` / `script_v2.json` / `script_v3.json` (narration per version), `findings.md`, `sources.md`, `umk_examples.csv`.
- `video-01/`: video #1 project.
  - `tools/`: `build.mjs` (v1), `build_v2.mjs`, `build_v3.mjs`. `lint.mjs`, `lint_v2.mjs`, `lint_v3.mjs`. `geometry.mjs`, `make-map.mjs`. `render.sh`, `render_v2.sh`, `render_v3.sh`.
  - `index.html` is the v2 composition. `index_v3.html` is v3. `beats.md`, `beats_v2.md`, `beats_v3.md` are the shot plans.
  - `video.config.json`, `video.v2.config.json`, `video.v3.config.json` hold per-version settings: safe box, loudness, voice variant, inputs.
  - `assets/`: `vo.mp3`, `words.json`, `sentences.json` for each version (root = v1, `v2/`, `v3/`). Also fonts and the map SVG.
  - `components/`, `vendor/` (GSAP and licenses).
  - `out/`: `draft.mp4` (v1), `v2.mp4`, `v3.mp4`, `v3_caption.txt`, contact sheets (`sheet.jpg`, `v2_sheet.jpg`, `v3_sheet.jpg`), and cue stills.
  - `build/`: `timeline.json` (v1), `v2/` and `v3/` timelines and contact sheets, `geometry.json` (province geometry cache), `v1/index_v1_snapshot.html`, render logs.
- `thirdparty/REVIEW.md`: review of the third-party `hyperframe-pro` skill pack, with upstream URL and commit 9a135673. The clone itself is not in the repo.
- `spike/`: early HyperFrames test (`hf-test/`) and `test.mp4`.

## Video #1 status

- **v1**: `out/draft.mp4`, 45.5 s.
- **v2**: `out/v2.mp4`, 46.1 s. The render completed (`build/render/v2_render2.log`). The "complete and reviewed" status comes from the previous session. No review record is in the repo.
- **v3**: `out/v3.mp4`, 43.80 s (1314 frames, 1080x1920, 30 fps), rendered 2026-10-27 with voice variant `el_liam_cta2` (ElevenLabs Liam; the close was re-voiced so the CTA says "Yuk, follow et Dzaky es er de." and the caption shows `@dzakysrd`). `lint_v3.mjs` passed (`build/render/v3_lint.log`). Audio -13.9 LUFS integrated, true peak -4.4 dBTP (ebur128). Contact sheet `out/v3_sheet.jpg` (31 frames). Gates: hook 3.40 s (3.5), Jawa Barat 12.27 s (12.5, raised from 11.0 by the user on 2026-10-27), close 6.13 s (7.0), total 43.80 s (45).
  - To redo it, run `bash video-01/tools/render_v3.sh` (build, lint, render, two-pass loudnorm). It needs node, npx, ffmpeg, python3, network access for `npx hyperframes@0.8.206`, and the HyperFrames browser (`npx hyperframes@0.8.206 browser ensure`).

## v3 content (verified in files)

- Hook (B1): "UMP TERTINGGI" on frame 1, then at "Tapi" the claim "TAPI GAJI RATA-RATANYA DI BAWAH UMP" (`beats_v3.md`). Caption: "UMP Jakarta tertinggi se-Indonesia, tapi rata-rata gaji bersih buruhnya di bawah UMP."
- Less on-screen text: the sources line appears once, on the final card (B9), and in `out/v3_caption.txt`.
- Voice: ElevenLabs premade voice Liam (`TX3LPaxmHKxFdv7VOQHJ`), model `eleven_multilingual_v2`, default voice settings, `--max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2`. The earlier edge-tts take (Ardi, variant `v2`) was too stiff for the user. A free account cannot use Voice Library voices through the API (HTTP 402 `paid_plan_required`), so only premade voices work on the free plan. The caption credits "Suara: ElevenLabs". The close was re-voiced with splice mode (PRD-04a, 04c): "Sumbernya ada di layar." was dropped, and the CTA became "Yuk, follow et Dzaky es er de." (the user's pronunciation of @dzakysrd). Takes: `el_liam` -> `el_liam_cta` -> `el_liam_cta2`.

## Video #2 status

- Topic: Hari Listrik Nasional (27 October). Data: the electrification ratio (rasio elektrifikasi), angle "progress" (user, 2026-10-28). No `video-02/` folder yet.
- Base: option C, chosen by the user on 2026-10-28 (WIB) in PRD-06 (`docs/prd/06-video02-base.md`). `template/` is the scene engine (`scenes.json`-driven). Ported in from video-01: word-cue timing (`video-01/tools/lib/cue.mjs`), word-synced captions (the caption block of `video-01/tools/build_v3.mjs`), the two-pass loudnorm (`video-01/tools/render_v3.sh`) and the generic lint checks.
- Safe box: the video-01 v3 Reels values (top 220, bottom 420, left 65, right 140), not the template's TikTok values.
- Gaps in both bases: number formats are Rupiah only (no percent, kWh or GW), no line chart, no share chart, and the map has 34 provinces.
- Research done (PRD-07, PRD-07b): `research/video-02/re_national.csv` (2013-2025; 2013-2022 are chart labels from LK 2023 Gambar 48, and 2019-2022 also match text in two ESDM reports) and `research/video-02/re_province.csv` (38 provinces, Triwulan IV 2023, LK 2023 Tabel 58, split into PLN, non-PLN and LTSHE). Definition, sources and open issues: `research/video-02/sources.md`. Raw PDFs are not committed; run `bash research/video-02/tools/fetch.sh`. No newer per-province table in text form was found (Ditjen LK 2024 has only a map image).
- Next: the script, then a port PRD for only the components the script needs.

## Rules and decisions (enforced in code or docs)

- Every number on screen must be spoken at its cue. `lint_v3.mjs` checks this, and also checks that the VO has no digits.
- The word "melanggar" must not appear in the VO. Checked in `build_v2.mjs`, `build_v3.mjs`, `lint_v2.mjs`, `lint_v3.mjs`.
- Caveat on card B8 and in the caption: "Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh." It means average net wage, not proof of non-compliance.
- Reels safe box: x 65 to 940, y 220 to 1500 (`video.v3.config.json` margins: top 220, bottom 420, left 65, right 140). Hero band: y 420 to 1320.
- Map: `video-01/assets/map/indonesia-34.svg` has 34 provinces, from `@svg-maps/indonesia` 2.0.0 (CC BY 4.0). The caption credits "MapSVG, CC BY 4.0, diubah". The data has 38 provinces. Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya are not drawn on the map. Karawang is a labelled pin, not a district border (`beats_v3.md`).
- UMP 2026 figures come from media (detik.com, kompas.tv, citing Kemnaker). They are labelled as such in the caption, which says they have not yet been checked against an official source.
- Wage data: BPS table "Rata-rata Upah/Gaji Bersih Sebulan Buruh/Karyawan/Pegawai menurut Provinsi dan Jenis Pekerjaan Utama", column Total, February 2026. The user downloaded the CSV from bps.go.id, and it is stored unchanged in `research/bps_upah_feb2026.csv` (sha256 recorded in `sources.md`).
- Fonts (Anton, Inter) are vendored in `video-01/assets/fonts/`. GSAP is in `video-01/vendor/`. Licences are in `vendor/LICENSES/`.

## Not in the repo (regenerable, git-ignored)

- `thirdparty/hyperframe-pro/`: re-clone from the URL in `thirdparty/REVIEW.md` at commit 9a135673.
- `video-01/build/**/*.png`, `*.html`, `build/render/*.mp4`, `probe/` folders, and snap symlinks: rebuilt by running the scripts. `build/v1/index_v1_snapshot.html` is kept as the v1 composition snapshot.
- Frame dumps: `out/snap/*.png`, `out/v2_frames/`, `**/frames/`. Also `voice/samples/*/checks/`.
- Tool state and caches: `.hyperframes/`, `__pycache__/`, `node_modules/`, `.cache/`, `.DS_Store`.
- `.env.local`, which holds the ElevenLabs CLI's local slot. Never print or commit it.
- HyperFrames' Chrome lives outside the repo at `/root/.cache/hyperframes/chrome`. `build/v3/snap.sh` uses it.
- `build/geometry.json` is committed as a cache. Regenerating it needs headless Chrome (`tools/geometry.mjs`).

## Next steps (ordered)

1. Done: the user reviewed `out/v3.mp4` (voice `el_liam_cta2`, CTA "Yuk, follow et Dzaky es er de.", 0.16 s pause after "Yuk,") and approved it on 2026-10-27 ("Udah ok overall"). The reviewer measured timing and loudness but did not judge the audio by ear.
2. ElevenLabs credits: 1,384 of 10,000 used this period (resets 2026-11-26), per `voice/elevenlabs_usage.csv` and the subscription endpoint.
3. **[session note]** The free plan is reported as non-commercial with attribution required. Not checked here; check ElevenLabs' terms before any monetised use.
4. Optional: the HyperFrames CLI lint reports 12 structural warnings for `index_v3.html` (file size, dense tracks, nested structure). Not errors; not reviewed.

## Session notes (not in the repo, not re-verified)

- Working mode: the main Claude plans, reviews and writes PRDs. Coding goes to haiku sub-agents, escalating to sonnet (medium) if haiku struggles. Now written in the root `CLAUDE.md` and the data-explainer-video skill.
- The BPS website blocks requests from servers (Cloudflare). Do not try to get around this.
- Network: allowed domains include speech.platform.bing.com, kemnaker.go.id, satudata.kemnaker.go.id, detik.com, kompas.tv and api.elevenlabs.io. CDNs and Google Fonts are blocked, so assets are vendored from npm.
- The ElevenLabs key is read from the `ELEVENLABS_API_KEY` environment variable (51 characters). The scripts do not use `.env.local`.
