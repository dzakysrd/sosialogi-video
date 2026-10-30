# PRD-19: research and fact ledger for the Electro Power Indonesia reels series

## Context
- New client series, not @dzakysrd: 3 Instagram Reels (1080x1920) for IG @electropoweri (Electro Power Indonesia; YouTube channel "Electro Power Indonesia", handle @rikikhomarudin, trainer shown in thumbnails as Ir. Riki Khomarudin). Topics come from three of their existing IG carousel posts (Jan 2025):
  - Reel A "Bagaimana PLTS menghasilkan listrik": the post says the panel has a diode with + and - poles, "dipanasi sinar matahari" it produces DC; DC is like a battery. Diagram: 12 V 5 A one panel; 2 in series = 24 V 5 A; 3 in parallel = 12 V 15 A; 8 in series = 96 V 5 A. Source cited on the post: "Buku Do & Dont PLTS".
  - Reel B "Paparan sinar matahari": Peak sun hours (PSH) = hours per day at an average irradiance of 1 kW/m2; area under the daily curve equals the PSH rectangle; "rata-rata PSH Jakarta sekitar 4.5 jam" (no source on the post).
  - Reel C "Irradiasi matahari": two ways to get irradiance data, direct measurement and secondary data; total shortwave received by a horizontal surface; diagram DNI*cos(theta) + DHI (diffuse).
- The CTA of each reel will sell their classes/materials.
- Main agent's concerns to check: (1) "dipanasi" (heated) is likely wrong: PV converts light, and higher temperature lowers output; (2) the Jakarta 4.5 h figure has no source; (3) 12 V panels are a simplification of real Vmp/Voc.

## Goal
A fact ledger the script writer can use without inventing anything, plus brand/CTA facts and audience phrasing.

## Changes allowed
Create only these files: docs/prd/19-electropower-research.md, research/electropower/facts.md, research/electropower/sources.md, research/electropower/brand.md, research/electropower/audience.md. Nothing else.

## Steps
1. Reel A facts: how a PV cell makes electricity (photovoltaic effect, p-n junction, light/photons not heat); whether a solar cell is accurately described as a "diode"; effect of temperature on PV output with a temperature coefficient taken from ONE real, named module datasheet (manufacturer page or PDF); output is DC and needs an inverter for AC household use; series adds voltage / parallel adds current (same current/voltage modules); one real module's Vmp, Imp, Voc, Isc from a named datasheet to show "12 V" is a simplification. Prefer sources: NREL, US DOE (energy.gov), university pages, IEA, manufacturer datasheets, Indonesian ESDM.
2. Reel B facts: PSH definition; why 1 kW/m2 (STC 1000 W/m2, IEC 61215 / STC definition); that daily irradiation in kWh/m2/day equals PSH numerically; Jakarta (or DKI / nearby) average daily GHI or PSH from a named source (NASA POWER, Global Solar Atlas, Solargis, PVGIS, BMKG, ESDM, IESR or a peer-reviewed paper) with the exact figure, the period, and whether it is horizontal or tilted. Record ALL figures you find and where each came from; do not average them yourself.
3. Reel C facts: definitions of GHI, DNI, DHI; the relation GHI = DNI x cos(zenith angle) + DHI (from NREL or another primary source; record which angle is used); instruments: pyranometer (GHI; with shading device for DHI), pyrheliometer (DNI); named secondary datasets (NASA POWER, Global Solar Atlas, PVGIS, Solargis, Meteonorm) with what each provides.
4. Brand: what Electro Power Indonesia sells (classes, trainings, materials), prices and links ONLY if found on a page you opened or a snippet you quote (label which). Their website or link-in-bio if findable. Their IG handle, YouTube handle. Do not guess.
5. Audience phrasing (Indonesian): 5-10 real questions/complaints people write about PLTS atap / panel surya (e.g. on forums, Kaskus, Reddit r/indonesia, Q&A sites, YouTube titles, news comment quotes), each with the exact quote and URL. Only quotes you actually saw.
6. STOP conditions: if WebSearch is unavailable, stop and report that. Do not spend more than about 40 searches in total.

## Acceptance
- research/electropower/facts.md: a table per reel with columns: claim | status (LOCKED = page opened this session and figure seen; SNIPPET = seen only in a search snippet; UNVERIFIED) | exact figure/wording | source URL. Plus a section "Corrections to the original posts" stating, for each of the 3 concerns, what the sources say.
- sources.md: every URL used, with title as shown on the page, publisher, date if shown, and opened/snippet.
- brand.md and audience.md as above, with URLs.
- No figure anywhere without a URL.

## Budget
No paid API calls. About 40 web searches max.

## Report
Paste the full content of facts.md and brand.md verbatim, the count of LOCKED/SNIPPET/UNVERIFIED rows, the list of pages that failed to open (with error), and `git status --short`.

## Outcome (2026-10-30, reviewed by the main agent)
- 39 claim rows in facts.md: LOCKED 0, SNIPPET 27, UNVERIFIED 12. No page could be opened: WebFetch failed DNS for nrel.gov, iesr.or.id and en.wikipedia.org; curl through the proxy also got no response from www.nrel.gov, iesr.or.id, en.wikipedia.org, www.solar-electric.com and www.instagram.com; www.esdm.go.id answered 200. power.larc.nasa.gov and globalsolaratlas.info are refused by the proxy (403).
- Brand: no public page about Electro Power Indonesia, its classes, prices or links was found. CTA facts must come from the user.
- Audience: 5 news headlines, 0 real viewer quotes.
- Review notes: the series/parallel arithmetic and the "light, not heat" correction are consistent with general physics but still need a primary source (NREL or a datasheet opened in full) before they count as LOCKED. The Jakarta 4.5 h figure has no verified source. Some cited pages are weak (a patent PDF, vendor blogs); do not use them as on-screen sources.
- Not ready for scripting until the network allowlist is widened or the user supplies sources.
