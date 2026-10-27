# Sosialogi video template (HyperFrames)

Reusable 1080x1920 (TikTok, 9:16) data-explainer template. One config file (`scenes.json`) drives
the timings and text, so the next video only swaps data and audio. Built on HyperFrames
`hyperframes@0.8.206` (pinned in every script) and GSAP `3.14.2`. Everything is vendored: no CDN,
no Google Fonts, no network at build or render time.

Status: the demo (`demo.mp4`, 12 s, placeholder numbers marked DEMO) renders and passes
`hyperframes check` with 0 errors and 0 warnings.

## Quick start

```bash
npm run build                 # scenes.json -> index.html (required after every edit)
npm run check                 # build + HyperFrames lint/runtime/layout/motion/contrast
npm run render                # build + render -> video.mp4 (1080x1920, 30 fps)
npx --yes hyperframes@0.8.206 snapshot --at 1,3,5   # PNG frames to look at
```

The demo was rendered with `npx --yes hyperframes@0.8.206 render --resolution portrait --fps 30 -o demo.mp4`.

## Files

| Path | What it is | Edit it? |
|---|---|---|
| `scenes.json` | The config: brand, source line, audio, and every scene with its text and numbers | **Yes, this is the only file to change per video** |
| `assets/vo.mp3` | Optional voiceover (not in the demo) | Add or replace |
| `index.html` | Generated page (timings, overlays, inline map, inline config). Do not hand-edit | No, generated |
| `tools/build.mjs` | Validates `scenes.json`, computes start times, writes `index.html` | Only to change structure |
| `src/template.html` | Page skeleton used by the build | Only to change structure |
| `components/sos.js` | Scene components: `TitleCard`, `MapHighlight`, `BigNumber`, `BarCompare`, overlay animation | To add or change components |
| `components/sos.css` | Design tokens (colours, fonts, safe zones) and component styles | To restyle |
| `tools/make-map.mjs` | Rebuilds `assets/map/indonesia-34.svg` from the vendored source map | Rarely |
| `assets/map/indonesia-34.svg` | Inline-ready province map: one `<path>` per province, `id` and `data-name` | Generated |
| `assets/map/source/` | Vendored upstream map files (provenance) | No |
| `vendor/gsap.min.js`, `vendor/LICENSES/` | GSAP and licence texts | No |
| `assets/fonts/` | Vendored woff2 fonts (Anton, Inter) | No |
| `demo.mp4`, `frames/` | Demo render and 4 frames pulled from that MP4 | Generated |

## Editing `scenes.json`

Top level:

| Key | Meaning |
|---|---|
| `demo` | `true` shows the red **DEMO** badge top-left. Set `false` for a real video. |
| `fps` | Frame rate written to the root (default 30). The render command also passes `--fps 30`. |
| `brand` | Brand tag, top-right (yellow pill). Placeholder `/NamaAkun`. |
| `source` | Source line at the bottom. For the map, credit the map as well (see Map data below). |
| `audio` | `{ "file": "assets/vo.mp3", "volume": 1 }`. See Adding audio. |
| `scenes` | Ordered list. Each scene's start time is the sum of the durations before it. |

Every scene has `type`, `duration` (seconds, > 0) and an optional `caption` (subtitle shown at the
bottom, fades in and out with the scene).

| `type` | Required fields | Optional fields |
|---|---|---|
| `title` | `text` (words in `*asterisks*` are yellow) | `kicker` (small yellow line above) |
| `map` | `provinces`: list of `{ "id", "value", "tone" }` | `title`, `format` (`short`/`full`, default `short`), `focus` (`"provinces"` default = zoom to the listed provinces, `"all"` = whole map, or a list of ids), per-province `pos` (`above`/`below`/`left`/`right`) |
| `bignumber` | `label`, `value` (number, rupiah) | `format` (`full` default, or `short`), `alt` (second format shown under the number), `sublabel`, `tone` |
| `bars` | `bars`: 2 to 5 items of `{ "label", "value", "tone" }` | `title`, `format` (`full` default) |

Tones: `good` (teal), `bad` (orange-red), `neutral` (light slate), `ink` (white), `accent` (yellow).

Number formats: `full` gives `Rp5.729.876` (dot as thousands separator). `short` gives `Rp5,73 jt`
(comma as decimal separator, two decimals, "jt" = juta).

Province ids are the map's ids, for example `id-jk` (DKI Jakarta), `id-jb` (Jawa Barat),
`id-pa` (Papua). The full list is in `assets/map/indonesia-34.svg` (each `<path>` has `id` and
`data-name`). `npm run build` rejects unknown ids, bad tones, bad formats, wrong bar counts and
non-positive durations, and prints every problem at once.

Example scene:

```json
{ "type": "bignumber", "duration": 3, "label": "UMP Jawa Barat 2026", "value": 5729876,
  "format": "full", "alt": "short", "sublabel": "Per bulan, per 2026", "tone": "ink",
  "caption": "Dibandingkan rata-rata upah." }
```

After editing: `npm run build`, then `npm run check`, then look at frames
(`npx --yes hyperframes@0.8.206 snapshot --at <seconds>`) at each scene start and in the middle.

## Adding audio (optional voiceover)

1. Put the voiceover at `assets/vo.mp3` (or change `audio.file` in `scenes.json`).
2. Run `npm run build`. The build adds an `<audio>` element that spans the whole video, at `audio.volume`.
3. Render as usual. The audio is muxed into the MP4 (AAC).

If the file is missing the build leaves out the `<audio>` element and the render is silent. That
path is the default and has been rendered. The voiceover path was tested with a generated 12 s tone
in a scratch copy: the render produced an AAC track of 12.0 s.

Captions are per scene (`caption`), not word-timed. Word-level subtitles would need a transcript
file and are not part of this template.

## Rendering

```bash
npm run render                                    # -> video.mp4
npx --yes hyperframes@0.8.206 render --resolution portrait --fps 30 -o demo.mp4   # named output
```

Verify the output: `ffprobe -v error -show_entries stream=width,height,r_frame_rate -of csv=p=0 video.mp4`
should report `1080,1920` and `30/1`.

## Design rules built in

- Colour tokens are CSS variables in `components/sos.css` (`--ground`, `--land`, `--good`, `--bad`,
  `--neutral`, `--ink`, `--ink-dim`, `--accent`, `--demo`).
- TikTok safe zones (px on the 1080x1920 canvas): top 160, right 140, bottom 380. Left 60 is kept
  clear for margin. All key text sits in x 60 to 940 and y 520 to about 1450. The brand tag sits at
  top 180, with the brand tag's right edge at x 940 (the right safe-zone boundary). The DEMO badge is at
  top 180, left 60. The source line sits just above the bottom zone (bottom 400). Captions sit at bottom 470.
- Fonts: local `@font-face` only, under the family names `SosDisplay` (Anton) and `SosBody` (Inter).
  Do not rename them to `Anton`, `Inter` or `Arial` in the CSS: HyperFrames' compiler treats those
  names as Google Fonts and tries to fetch them, which breaks the offline build.
- The stylesheet is inlined into `index.html` by the build for the same reason (the compiler only sees
  `@font-face` rules in the page itself).

## Components (`components/sos.js`)

All builders add tweens to one paused master timeline at absolute times, so any frame can be seeked
deterministically. Animated properties: `opacity`, `x`, `y`, `scale`, `width` (bars), `fill` (map
provinces) and `textContent` (count-up numbers).

- `TitleCard(tl, sec, { text, kicker }, t0)`: words pop in one by one (`back.out`, 0.12 s stagger).
- `MapHighlight(tl, sec, { provinces, focus, format, title }, t0)`: fills the listed provinces with
  their tone colour, zooms (`scale`/`x`/`y` on the map group) to the listed provinces' bounding box
  (max 4x), then shows labels (name and value) and dots. Zoom is computed from SVG `getBBox()`.
- `BigNumber(tl, sec, { label, value, format, alt, sublabel, tone }, t0)`: count-up from 0 to `value`
  (over 1.5 s) in the chosen format, with optional alt format and sublabel.
- `BarCompare(tl, sec, { bars, format, title }, t0)`: 2 to 5 horizontal bars grow to scale (longest
  bar = 480 px), value appears after each bar. Bars are scaled to the largest value.
- Overlays (brand tag, DEMO badge, source line, captions): static DOM written by the build, faded in
  and out by `animateOverlays`.
- Count-up uses a GSAP property tween with a `modifiers` formatter, not `onUpdate`. The runtime seeks
  with suppressed events, so `onUpdate` text is not reliable.

Entry point: `window.SOS.build(cfg)` returns the timeline. `index.html` registers it as
`window.__timelines["main"]`.

## Vendored assets

Versions are exact. SHA-256 checksums are the first 12 characters.

| Asset | Version / source | Licence | Used for | Files (sha256 prefix) |
|---|---|---|---|---|
| GSAP | `gsap@3.14.2` (npm `dist/gsap.min.js`) | GreenSock "Standard 'no charge' licence" (https://gsap.com/standard-license). The npm package has no LICENSE file; the notice is in the file header. | Animation | `vendor/gsap.min.js` (`c174bfce53a7`) |
| Anton | `@fontsource/anton@5.3.0` (Anton Project Authors, 2020) | SIL Open Font License 1.1 (`vendor/LICENSES/OFL-Anton-5.3.0.txt`) | Headlines, big numbers (`SosDisplay`) | `assets/fonts/anton-latin-400-normal.woff2` (`d0fa07ff63dd`) |
| Inter | `@fontsource/inter@5.3.0` (Inter Project Authors) | SIL OFL 1.1 (`vendor/LICENSES/OFL-Inter-5.3.0.txt`) | Body and labels (`SosBody`), weights 400/600/700/800 | `assets/fonts/inter-latin-{400,600,700,800}-normal.woff2` (`8909904ab6c8`, `f9a06e79cd3a`, `6f56409fd3d6`, `a7d0a50f15d3`) |
| Indonesia province map (source) | `@svg-maps/indonesia@2.0.0` (npm). Based on "Map of Indonesia" by MapSVG (https://mapsvg.com/maps/indonesia) | CC BY 4.0 (`vendor/LICENSES/CC-BY-4.0-legalcode.txt`) | Province shapes | `assets/map/source/indonesia-svgmaps-2.0.0.svg` (`fd24b0607f1d`), plus `svgmaps-indonesia-index.js` and `svgmaps-indonesia-package.json` |
| Indonesia province map (derived) | `assets/map/indonesia-34.svg`, made by `tools/make-map.mjs` from the source above | CC BY 4.0 (same as source; changes are stated in the SVG header) | Inline map in `index.html` | `assets/map/indonesia-34.svg` |

Licence text for CC BY 4.0 comes from the SPDX license list (`spdx-license-list@6.12.0`, file
`licenses/CC-BY-4.0.json`), which has the full legal code. That package is not a dependency.

HyperFrames CLI (`hyperframes@0.8.206`, Apache-2.0) runs through `npx` and is not vendored. The
system `ffmpeg`/`ffprobe` 6.1.1 is used only to verify the MP4 and extract frames.

## Map data: source, licence, and what is missing

- **Used:** `@svg-maps/indonesia@2.0.0`, CC BY 4.0. It has **34 provinces**, the layout before the
  2022 Papua split. Each province is one `<path>` with `id` (for example `id-jb`) and `data-name`
  (Indonesian display name). Brunei, Sabah, Sarawak and Timor-Leste are not in the file.
- **Attribution required on the video:** CC BY 4.0 needs credit wherever the map appears. The demo
  `source` line carries it (`Peta: MapSVG (CC BY 4.0), diubah`). Keep that text in `source` for every video.
- **Not in the map (34 vs 38):** `Papua Barat Daya`, `Papua Tengah`, `Papua Pegunungan` and
  `Papua Selatan` (created 2022). They are inside the `Papua` and `Papua Barat` shapes, so the UMP
  for those four cannot be shown separately on this map. This is an open decision for the data task
  (see Open issues).

Candidates checked and not used:

| Package | Result | Why not used |
|---|---|---|
| `indonesia-geodata@0.1.3` (npm, claims MIT) | 38 provinces, correct ISO 3166-2 ids, including the four new Papua provinces | No LICENSE file in the package, and no source named. Its schema (`NAME_ENG`, `CNTRY`, `TYPE`, `TYPE_ENG`) and file names (`indonesiaLow/High`) match amCharts' geodata. The package's GitHub repo returns 403 through the proxy, so provenance could not be checked. Its vertices do not match amCharts' coordinates, so it is re-processed. Licence unverified. |
| `@amcharts/amcharts5-geodata@5.1.6` | Indonesia file has the 34 old provinces plus Brunei, two Malaysian Borneo states and Timor-Leste | Licence is the amCharts "linkware" licence, which requires branding and forbids distributing the software on its own. Not a clean licence for geometry. |
| `@highcharts/map-collection@2.3.3` | Has Indonesia (`countries/id`) | Requires a paid Highcharts Maps licence. |
| `@react-map/indonesia@1.0.9` (MIT) | 34 provinces, plus Sabah, Sarawak and Brunei | No source named. Disputed-territory disclaimer in the README. |
| `@geo-maps/*` | Country and earth-level data | No province-level data. |

## Open issues

1. **38 provinces for UMP 2026.** The template uses the 34-province map. For the data task, choose
   one: (a) keep 34 and show the four new Papua provinces as Papua/Papua Barat with a note;
   (b) use `indonesia-geodata` after its licence and source are confirmed with the author; or (c) get
   a clearly licensed 38-province map. Not decided here, and no geometry was drawn or invented.
2. Label positions use each province's bounding-box centre, not a true centroid. For island
   provinces (Maluku, Nusa Tenggara) check the label position in a snapshot and set `pos`, or add an
   anchor override if needed.
3. The map is a horizontal strip. At full view it fills the 880 px safe width and is about 320 px
   tall. Zoomed views are cropped by the frame edge on purpose.
4. Scene durations are the demo timings (1.8 / 4.0 / 3.0 / 3.2 s). Each label is on screen long
   enough to read by the craft rule used in `check` (about 0.5 s plus 0.3 s per word).
5. The render printed a note that software-GL capture was slower than BeginFrame. The output was
   correct, and the render took about 27 s for 12 s of video.
