# PRD-08: find a 38-province Indonesia map with a clear licence

## Context
Verified by the main agent on 2026-10-27 UTC.

- Both video bases use `assets/map/indonesia-34.svg` from `@svg-maps/indonesia@2.0.0` (CC BY 4.0), 34 provinces. Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya are not separate shapes (`template/README.md`, "Map data" and "Open issues").
- `template/README.md` already rejected: `indonesia-geodata@0.1.3` (no licence file, provenance unclear), `@amcharts/amcharts5-geodata` (linkware licence), `@highcharts/map-collection` (paid licence), `@react-map/indonesia` (34 provinces), `@geo-maps/*` (no province level). Do not re-check them.
- video-02 shows the electrification ratio of the four new Papua provinces (`research/video-02/re_province.csv`, 38 province names). The map must draw all 38 provinces as separate shapes.
- Use: rendered into a public Instagram Reels / TikTok video by @dzakysrd, possibly monetised later, and the derived SVG would be stored in this git repo. The licence must allow commercial use, modification and redistribution. Attribution is fine. Share-alike (for example ODbL or CC BY-SA) must be reported as such; the main agent decides.
- Reachable from this container: registry.npmjs.org (200), raw.githubusercontent.com (200 for a file), api.github.com (200). Not reachable: github.com web pages (403), www.geoboundaries.org, data.humdata.org, www.naturalearthdata.com, overpass-api.de (no response). Do not try to get around a block.
- Tools: python3 (no shapely, geopandas or matplotlib), ImageMagick `convert`, node and npx. `npx --yes mapshaper@<exact version>` is allowed for inspecting and converting in scratch; record the version.

## Goal
Find, for each candidate source, the licence, provenance and province count, and say whether it has the four new Papua provinces as separate shapes. Do not add any map to the repo.

## Changes allowed
- Create `docs/prd/08-map-38-provinces.md` (this PRD, verbatim). Everything else goes to scratch. No other repo file may change.

## Steps
1. Save this PRD verbatim.
2. Candidates, in this order. For each one report: the exact URL or `npm name@version` fetched; the licence, quoted verbatim from the source (licence file, package.json `license` field, README or metadata) with the file or URL it came from; provenance (who made it and from what data, as stated by the source); number of province-level features and the list of their names; whether Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya are separate features; file format, size in bytes and coordinate system if stated.
   a. geoBoundaries, Indonesia ADM1. Use api.github.com or raw.githubusercontent.com for the wmgeolab geoBoundaries repository, or an npm package that bundles it. Find the file location through the GitHub API (repository contents), not by guessing. If the data is in Git LFS and cannot be fetched, say so.
   b. Natural Earth admin-1 states and provinces (10m), from the nvkelso/natural-earth-vector repository on raw.githubusercontent.com (find the path through the GitHub API). Filter to Indonesia.
   c. npm: run `npm search` with "indonesia geojson", "indonesia provinsi", "indonesia province map" and "indonesia 38". Check at most 6 packages whose description or files suggest province boundaries and that are not in the rejected list. For each: `npm view <pkg> name version license repository homepage`, then `npm pack <pkg>@<version>` into scratch and inspect the files (LICENSE, README, data files).
   d. Anything else you find with at most 5 web searches, only if it is reachable from this container. Report search hits you could not open as "not reachable", without details.
   Downloads: at most 150 MB in total. Prefer simplified files when a source offers them.
3. For each candidate that has all 38 provinces as separate features AND a licence that allows commercial use and modification:
   a. Match its province names against the `province` column of `research/video-02/re_province.csv`. Report every name that does not match exactly, and the obvious pair if there is one (do not rename anything).
   b. Draw a preview in scratch: a Python script (standard library only) projects lon/lat with a simple equirectangular projection into an SVG about 1600 px wide, fills Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya in four distinct bright colours and every other province in grey, with thin white borders. Convert it to PNG with `convert`. Look at the PNG and report what you see (are the four shapes where expected in the east, are there gaps or overlaps). Give the PNG path.
   c. Report the vertex count and the SVG size before and after one simplification with mapshaper (`-simplify 5%` or similar; state the exact command).
4. Write a summary table to `<scratch>/report.md`: candidate, licence, provinces, four new Papua provinces separate (yes/no), commercial use allowed (yes/no/unclear), share-alike (yes/no), notes.

STOP and report if: a repo file other than this PRD changes; a step would need a host that is not reachable; a licence is unclear (report it as unclear; do not interpret it in your favour).

## Acceptance
- Every candidate in step 2 a-c has an entry, even if the entry is "not reachable" or "no province data".
- Every licence claim has a verbatim quote and its source file or URL.
- `git status --short --untracked-files=all` shows only `?? docs/prd/08-map-38-provinces.md`.

## Budget
0 paid calls. Downloads at most 150 MB. At most 5 web searches.

## Report
Paste `report.md` in full, the per-candidate details from step 2, the step 3 results with PNG paths, the git status line, and what failed or was not verified.

## Outcome (2026-10-28 WIB, measured)
- No source was found with all 38 provinces as separate shapes and a licence that allows commercial use and modification.
- Natural Earth 10m admin-1 (public domain; repository commit ca96624, file version 5.1.1): 33 Indonesian features, without Kalimantan Utara and without the four new Papua provinces. The main agent re-counted 33.
- `@paramira/geo-packs@0.1.0` and the geo-atlas-data mirror: 34 features, ODbL 1.0 (share-alike), source "OpenStreetMap, Wambacher". The main agent re-counted 34 in geo-packs.
- geoBoundaries gbOpen IDN ADM1: stored in Git LFS, which this container cannot fetch. Count and per-file licence not verified; a third-party mirror lists it as 34 features.
- Not usable: a GADM extract (GADM terms, not fetched), name and code tables without geometry, and unreachable hosts (data.humdata.org, overpass-api.de, www.naturalearthdata.com, www.geoboundaries.org, dev.to).
- api.github.com answered 403 for repositories not attached to the session; the Context line "api.github.com (200)" came from a probe of the API root only.
- Decision pending: the user picks a fallback for the province beat.
