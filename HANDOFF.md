# HANDOFF

Snapshot of the repo as of 2026-10-27. Facts here were checked against the files. Items marked **[session note]** came from the previous session and are not in the repo.

## Goal

Data-explainer vertical videos (Instagram Reels / TikTok, 1080x1920, 30 fps) for IG @dzakysrd, style reference @sosialogi. Built with HyperFrames `0.8.206` (pinned in every script in `video-01/tools/`) plus Indonesian TTS voiceover.

Video #1: "UMP vs gaji asli". Compares the 2026 provincial minimum wage (UMP) with the average net monthly wage of workers, from BPS Feb 2026, for 38 provinces.

## Folder map

- `template/`: reusable 1080x1920 HyperFrames template. `scenes.json` drives timings and text. All assets are vendored, with no CDN. `README.md` documents it. `demo.mp4` is its demo render.
- `voice/`: `tts.py`, edge-tts Indonesian voiceover with per-word timestamps (`words.json`, `sentences.json`). Loudness is -14 LUFS with true peak <= -1 dBTP. Options include `--max-pause` and `--tail-pad`. `samples/` holds voice previews (`ardi`, `gadis`, and `v3/v1..v3`).
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
- **v3**: `out/v3.mp4`, 39.4 s (composition 39.403 s, 1183 frames). Integrated loudness measures -14.0 LUFS (ebur128). **This file is not current. Do not ship it as final.**
  - `video-01/tools/build_v3.mjs` and `video-01/index_v3.html` were modified at 08:25, after `out/v3.mp4` was written at 08:24.
  - A later render (`build/render/v3_render.log`, 08:26) was cancelled at frame 727/1183 (SIGTERM, "Target closed"). No render exists for the current code.
  - No lint result is saved. `build/v3/probe/lint-probe-v3.html` exists, but there is no pass or fail record. Treat lint as unconfirmed.
  - To redo it, run `bash video-01/tools/render_v3.sh`. It runs `build_v3.mjs`, then `lint_v3.mjs`, then the HyperFrames render, then a two-pass loudnorm to -14 LUFS with true peak -1.5 dBTP, writing `out/v3.mp4`. It needs node, npx, ffmpeg, python3, and network access for `npx hyperframes@0.8.206`.

## v3 content (verified in files)

- Hook (B1): "UMP TERTINGGI" on frame 1, then at "Tapi" the claim "TAPI GAJI RATA-RATANYA DI BAWAH UMP" (`beats_v3.md`). Caption: "UMP Jakarta tertinggi se-Indonesia, tapi rata-rata gaji bersih buruhnya di bawah UMP."
- Less on-screen text: the sources line appears once, on the final card (B9), and in `out/v3_caption.txt`.
- Voice: v3 uses variant `v2` (Ardi, rate +8%, pitch +0Hz) from `voice/samples/v3/v2/`, per `video.v3.config.json` and `beats_v3.md`. The user's feedback was that this voice is too stiff **[session note]**, which is why ElevenLabs is next.

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

1. Verify the ElevenLabs key: `npx -y @elevenlabs/cli@latest onboard check --env-path .env.local`. **[session note]** The key comes from the `ELEVENLABS_API_KEY` environment variable, which is visible only in a new session. `.env.local` is just the CLI's local slot.
2. Build `voice/tts_elevenlabs.py`. It must produce `vo.mp3`, `words.json` and `sentences.json` in the same format as `voice/tts.py`. Use the `/with-timestamps` endpoint and convert character alignment to words. Keep the same loudness target (-14 LUFS, TP <= -1 dBTP) and the same `--max-pause` and `--tail-pad` options. **[session note]** Endpoint name not checked against API docs.
3. Make about 12 s previews with 2 to 3 voices that support Indonesian (multilingual model), for the user to pick from. Watch credit usage. **[session note]** Free plan, 10,000 credits.
4. Re-run v3 with the chosen voice. Point `voice.dir` in `video.v3.config.json` at the new samples, then run `bash video-01/tools/render_v3.sh`. Check lint, the render, and the contact sheet.
5. If staying on the free plan, add "Suara: ElevenLabs" to `out/v3_caption.txt`. **[session note]** The free plan is reported as non-commercial with attribution required. Those terms are not checked here, so check ElevenLabs' terms first.

## Session notes (not in the repo, not re-verified)

- Working mode: the main Claude plans, reviews and writes PRDs. Coding goes to haiku sub-agents, escalating to sonnet (medium) if haiku struggles. Not written in `CLAUDE.md`.
- The BPS website blocks requests from servers (Cloudflare). Do not try to get around this.
- Network: allowed domains include speech.platform.bing.com, kemnaker.go.id, satudata.kemnaker.go.id, detik.com, kompas.tv and api.elevenlabs.io. CDNs and Google Fonts are blocked, so assets are vendored from npm.
- The previous session started ElevenLabs CLI onboarding with `npx -y @elevenlabs/cli@latest onboard init`.
