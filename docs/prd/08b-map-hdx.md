# PRD-08b: check the OCHA/HDX Indonesia boundaries for a 38-province map

## Context
Verified by the main agent on 2026-10-27 UTC, after the user opened network access.

- PRD-08 found no usable 38-province map. Now reachable: data.humdata.org (200), www.naturalearthdata.com (200), www.geoboundaries.org (root 200; its API path reset the connection). Still not reachable: overpass-api.de, commons.wikimedia.org, upload.wikimedia.org, gadm.org.
- HDX CKAN API `https://data.humdata.org/api/3/action/package_show?id=cod-ab-idn` returned: title "Indonesia - Subnational Administrative Boundaries"; license_title "Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO)", license_id "cc-by-igo"; dataset_source "Badan Pusat Statistik (BPS - Statistics Indonesia)"; last_modified 2026-06-23. Resources: `idn_admin_boundaries.gdb.zip` (218753706 bytes), `idn_admin_boundaries.shp.zip` (497626018), `idn_admin_boundaries.geojson.zip` (456203094), `idn_admin_boundaries.xlsx` (14463125). Download URLs redirect to s3.us-east-1.amazonaws.com, which answers 200 with Accept-Ranges. Disk: about 30 GB free.
- Not verified: the number of provinces in the ADM1 layer, and the full licence terms.
- The map must draw all 38 provinces as separate shapes; it will be used in a public, possibly monetised video, and a derived SVG would be stored in this repo. Province names to match: the `province` column of `research/video-02/re_province.csv`.
- Tools: python3 (standard library only), ImageMagick `convert`, `npx --yes mapshaper@<exact version>` allowed in scratch (record the version), unzip.

## Goal
Find out whether the HDX COD-AB Indonesia ADM1 layer has all 38 provinces as separate shapes, what its licence and provenance say, and how small a simplified SVG of it can be. Do not add any map to the repo.

## Changes allowed
- Create `docs/prd/08b-map-hdx.md` (this PRD, verbatim). Everything else goes to scratch.

## Steps
1. Save this PRD verbatim.
2. Metadata. Fetch the package_show JSON above into scratch. Report verbatim these fields if present: title, license_title, license_id, license_url, dataset_source, dataset_date, last_modified, methodology, caveats, notes (first 1000 characters), and every resource's name, format, size and last_modified. If the JSON or the HDX dataset page names a licence URL, fetch it if reachable and quote the lines about commercial use, adaptation, attribution and share-alike. If not reachable, say so.
3. Download `idn_admin_boundaries.geojson.zip` (URL from the JSON, follow redirects) into its own scratch folder. Record bytes and sha256. `unzip -l` it and report the member list. Extract only the admin level 1 member(s). Delete the zip afterwards to save space, after recording its sha256.
4. ADM1 layer: report the CRS if stated, the feature count, the property keys, and every feature's name and code properties. Say whether Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya are separate features, and whether Kalimantan Utara is present. Report any date or version property.
5. Only if the layer has 38 province features:
   a. Match its names against `research/video-02/re_province.csv` (`province` column). List every name that differs, with the obvious pair. Do not rename anything.
   b. Simplify with mapshaper in scratch, for example `npx --yes mapshaper@<version> <in> -simplify 1% keep-shapes -o format=geojson <out>` and also try `0.5%`. Report the exact commands, vertex counts if mapshaper reports them (`-info`), and file sizes before and after.
   c. Preview: a Python script (standard library only) projects lon/lat equirectangularly into an SVG about 1600 px wide from the simplified file, fills Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya in four distinct bright colours and the rest in grey, with thin white borders. Convert to PNG with `convert`. Look at the PNG and report what you see: are all four new Papua provinces visible in the east, any gaps, overlaps, missing islands or slivers. Give the PNG path. Also report the SVG file size.
6. Write a short summary at the end of your report: licence (as quoted), provenance, province count, the four new Papua provinces separate (yes/no), name mismatches, simplified SVG size, and anything unclear.

STOP and report if: a repo file other than this PRD changes; the download fails; a licence statement is unclear (quote it, mark it unclear).

## Acceptance
- `git status --short --untracked-files=all` shows `?? docs/prd/08b-map-hdx.md` plus only files the other sub-agent creates (research/video-02/script_v1.json, voice/samples/video-02/*, docs/prd/09-*). List them; do not touch them.
- Every licence claim is a verbatim quote with its source.

## Budget
0 paid calls. Download about 456 MB (one zip), deleted after extraction. No web searches.

## Report
Paste verbatim: step 2 fields, step 3 sha256 and member list, step 4 results with all names, step 5 results with commands, sizes and the PNG path, the step 6 summary, the git status, and what failed or was not verified.

## Outcome (2026-10-28 WIB, measured)
- HDX COD-AB Indonesia ADM1 (`idn_admin1.geojson`, sha256 7809c678b9f1596736cf74116beb9deecd5c1ced99b0ceb205347af1f3501e46, from the GeoJSON zip with sha256 d285a40f9fc4b726b1bda98ee833d52d23d94fe78b6a47c0a769d2e912ff0970) has 34 provinces, version v01, valid_on 2020-04-01. The HDX notes also say "Admin 1: 34 province (provinsi)". Papua Tengah, Papua Pegunungan, Papua Selatan and Papua Barat Daya are not in it. The main agent re-counted 34.
- Licence: the dataset page says CC BY-IGO; the site footer says CC BY 4.0 for site content. The legal code and the HDX licence page were blocked by the network policy, so the terms are not verified. Moot, because the layer has only 34 provinces.
- Decision (user, 2026-10-28, given in advance: "kalau masih mentok opsi lain aja"): no map in video-02. Scene s4 uses bars of the five lowest re_total provinces (Triwulan IV 2023) without value labels, with only Papua Pegunungan labelled.
