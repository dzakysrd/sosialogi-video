# PRD-19b: re-research with the widened network allowlist

## Context
- PRD-19 (commit 4849618) produced research/electropower/facts.md with 39 claims: LOCKED 0, SNIPPET 27, UNVERIFIED 12, because the main sources were blocked. The user has now widened the allowlist.
- Main agent test (2026-10-30): `curl "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=106.85&latitude=-6.2&format=JSON"` returned JSON with ANN 4.8324 (header: "NASA/POWER Source Native Resolution Climatology", sources SYN1DEG). The period string in the header must be read from the saved response, not assumed.

## Goal
Upgrade as many facts.md rows as possible to LOCKED, with raw responses saved, so a script can be written only from LOCKED facts.

## Changes allowed
docs/prd/19b-electropower-research-2.md (new); research/electropower/facts.md, sources.md (update in place); research/electropower/raw/ (new: saved API JSON and small HTML/text extracts, each under 2 MB; no PDFs over 5 MB); research/electropower/tools/fetch_solar.sh (new, re-runnable script that re-downloads the raw API files). Nothing else.

## Steps
1. NASA POWER (Jakarta, lat -6.2, lon 106.85; also record the exact point used): save the climatology response for ALLSKY_SFC_SW_DWN (GHI, kWh/m2/day), ALLSKY_SFC_SW_DNI and ALLSKY_SFC_SW_DIFF if the API accepts them (if a parameter is rejected, save the error and say so) to raw/. Record monthly and annual values, units, period and source text exactly as in the JSON header. Note that kWh/m2/day on a horizontal surface equals PSH numerically (horizontal, not tilted).
2. Global Solar Atlas for the same point: find a documented, reachable way to get GHI / DNI / DIF / PVOUT for that point (e.g. an API endpoint you find documented on globalsolaratlas.info or via search). Save the raw response. Record values with units (annual or daily totals, as given). If no machine-readable endpoint works, record what failed and do not guess values.
3. Definitions from Wikipedia (en.wikipedia.org pages "Solar irradiance", "Solar cell", "Photovoltaic effect", "Peak sun hours" if it exists, "Pyranometer", "Pyrheliometer", "Standard test conditions" or "Solar panel"): use the MediaWiki API or the raw page (e.g. https://en.wikipedia.org/w/index.php?title=Solar_irradiance&action=raw) and save the relevant extract to raw/. Lock: GHI = DNI x cos(zenith) + DHI and its wording; a solar cell is a p-n junction / described as a form of photodiode or not (quote exactly); light, not heat; temperature effect on efficiency; pyranometer measures global irradiance (and DHI with a shade); pyrheliometer measures direct beam; STC 1000 W/m2, 25 C, AM1.5. Record the Wikipedia page and the reference it cites for each claim (name the cited reference as written).
4. A real module datasheet you can download in full: search for a current crystalline-silicon module datasheet from a major manufacturer whose PDF is reachable (try several: e.g. manufacturer sites; record each failure). From ONE datasheet you actually downloaded, lock: model name, Pmax, Vmp, Imp, Voc, Isc at STC, temperature coefficients of Pmax and Voc. Save a text extract (pdftotext if available) to raw/.
5. ESDM: try to find and lock the ESDM page on the "Dos and Don'ts" PLTS book (www.esdm.go.id is reachable): exact title, date, publisher; and whether the book PDF is downloadable from an esdm.go.id or ebtke.esdm.go.id URL (record URL; do not commit the PDF).
6. Update facts.md: change status per row; add new rows for steps 1, 2, 4; keep the old row text where still UNVERIFIED. Rewrite the "Corrections to the original posts" section with the LOCKED evidence. Update the Counts line. Update sources.md (mark each URL opened/snippet, with HTTP status).
7. Write tools/fetch_solar.sh that re-downloads the step 1 (and step 2 if it worked) raw files with curl and exits non-zero on failure. Run it once and confirm the files are identical (sha256) to what you saved.
8. STOP conditions: if an endpoint returns errors twice, record and move on; no more than about 40 web searches and 60 fetches in total.

## Acceptance
- facts.md counts updated; every LOCKED row points to a URL and to a file in raw/ (or says the page was opened via WebFetch).
- `bash research/electropower/tools/fetch_solar.sh` exits 0.
- `du -sh research/electropower/raw` under 10 MB.

## Budget
No paid API calls.

## Report
Paste verbatim: the NASA POWER monthly + annual GHI (and DNI/DIFF if obtained) with the header period text; Global Solar Atlas values or the failure; the datasheet values with model and URL; the new Counts line; the full new "Corrections" section; list of failed URLs with errors; `du -sh research/electropower/raw`; `git status --short --untracked-files=all`.

## Outcome (2026-10-30, reviewed by the main agent)
- facts.md: 57 claim rows, LOCKED 24, SNIPPET 17, UNVERIFIED 16 (was 39 rows, LOCKED 0).
- Spot-checked by the main agent against raw/: NASA POWER range "January 2001 - December 2025", sources SYN1DEG and POWER, annual GHI 4.8324, DNI 2.6467, DIFF 2.4314 kWh/m2/day; Solar cell lead sentence "converts the energy of light directly into electricity by using the photovoltaic effect" (line 17); GHI = DHI + DNI x cos(z) (Solar irradiance); STC 1,000 W/m2, AM 1.5, 25 C citing Dunlop (Solar panel line 140); series adds voltage, parallel adds current (Solar cell). All matched.
- Still blocked by the proxy: api.globalsolaratlas.info, all module datasheet hosts tried, www.nrel.gov (502), iesr.or.id (403). The sign of the temperature effect and any real module's Vmp/Voc remain unlocked.
- fetch_solar.sh re-download differs only in the API's server timing field "times"; the saved file is the original response (sha256 6fc1cfdc66e14eda98a177ddc0c1cafde35cdc2e6e2684d92f9c63d632f1a4b6). Accepted as is.
