# Electro Power Indonesia reels: fact ledger (PRD-19, updated in PRD-19b)

Status key:
- LOCKED = the page or API was fetched by me this session (curl), and the figure or wording was seen in the saved response. Each LOCKED row names a URL and a file in raw/.
- SNIPPET = seen only in a web-search result (summary text returned by the search tool, not the page body). Wording is the search tool's summary unless it is in quotation marks.
- UNVERIFIED = not confirmed; source missing, unreachable, or not attributable.

PRD-19 status (before 19b): 39 rows, LOCKED 0, SNIPPET 27, UNVERIFIED 12. PRD-19b re-research: see Counts at the end.

Raw files (research/electropower/raw/):
- nasa_power_climatology_jakarta.json (NASA POWER, point 106.85 E, -6.2 S)
- wiki_Solar_irradiance.wikitext, wiki_Solar_cell.wikitext, wiki_Photovoltaic_effect.wikitext, wiki_Solar_panel.wikitext, wiki_Pyranometer.wikitext, wiki_Pyrheliometer.wikitext (en.wikipedia.org raw wikitext)
- wikipedia_extracts.txt (condensed excerpts of the above)
- esdm_dosdonts_news.html (ESDM news page, HTML)

## Reel A: how PV makes electricity (post: "dipanasi", 12 V 5 A, series/parallel diagram, "Buku Do & Dont PLTS")

| claim | status | exact figure / wording | source URL / file |
|---|---|---|---|
| A PV cell converts light directly into electricity by the photovoltaic effect | LOCKED | Wikipedia "Solar cell": "an electronic device that converts the energy of light directly into electricity by using the photovoltaic effect" | https://en.wikipedia.org/w/index.php?title=Solar_cell&action=raw ; raw/wiki_Solar_cell.wikitext |
| Light frees electron-hole pairs at a p-n junction (mechanism) | LOCKED | Wikipedia "Solar cell": "photons in sunlight hit the solar cell and are absorbed by the semiconductor ... producing electron-hole pairs"; "a large-area p-n junction made from silicon" | same as above |
| Cell output is heat-driven: NOT supported. The mechanism is light; heat is a loss factor | LOCKED | Wikipedia "Solar cell", contrast paragraph: "a solar thermal collector absorbs sunlight, to produce ... direct heat" (a different device); cell mechanism is the photon row above | same as above |
| A p-n "(diode) junction" solar cell | LOCKED | Wikipedia "Photovoltaic effect": "In the case of a semiconductor p–n (diode) junction solar cell, illuminating the material creates an electric current" | https://en.wikipedia.org/w/index.php?title=Photovoltaic_effect&action=raw ; raw/wiki_Photovoltaic_effect.wikitext |
| A solar cell IS a photodiode (the post's "diode" label as a direct equivalence) | UNVERIFIED | The page says the solid-state form of the effect "uses solid-state devices, mainly in photodiodes", and calls the cell a "p-n (diode) junction solar cell". It does not state "a solar cell is a photodiode" | raw/wiki_Photovoltaic_effect.wikitext (not a direct statement) |
| Temperature lowers PV output (the post's "dipanasi" framing is the wrong direction) | SNIPPET | Search summary: "Panel output falls as temperature rises, and the temperature coefficient is the number that quantifies how much." Typical crystalline-silicon range "between about -0.2% and -0.5%/°C" (summary). The sign is confirmed only by search snippets; no datasheet was downloaded this session | https://sinovoltaics.com/solar-basics/measuring-the-temperature-coefficients-of-a-pv-module ; https://solarcalculator.com.au/solar-panel-temperature/ ; https://greentumble.com/effect-of-temperature-on-solar-panel-efficiency (which of the three holds the range sentence: UNVERIFIED) |
| Temperature is an input to cell output and is described by temperature coefficients | LOCKED | Wikipedia "Solar cell": "multiple input factors that affect the output power of solar cells, such as temperature ..."; "A solar cell has a voltage dependent efficiency curve, temperature coefficients, and allowable shadow angles." Wikipedia "Solar panel": coefficients beta (dVoc/dT), alpha (dIsc/dT), delta (dPmax/dT) "can be found in any data sheet" | https://en.wikipedia.org/w/index.php?title=Solar_cell&action=raw ; https://en.wikipedia.org/w/index.php?title=Solar_panel&action=raw ; raw/wiki_Solar_cell.wikitext, raw/wiki_Solar_panel.wikitext. The numbers (sign and size) are NOT in these pages |
| Named datasheet, temperature coefficient of Voc (Ulica Emergo Navitect II 300 W / 325 W): about -0.29 to -0.30 %/°C | SNIPPET | Search summary: "the Emergo sheets list about -0.29 to -0.30 %/°C". PDF not downloadable this session (proxy refused) | https://www.emergo.nl/Emergo/media/Downloads/Ulica-Emergo-Navitect-II-Datasheet-202008-2.pdf |
| Named datasheet, SLP150S-24U: Voc coefficient -(80±10) mV/°C | SNIPPET | Search summary. PDF not downloadable this session | https://www.solar-electric.com/lib/wind-sun/SLP150S-24U-data-sheet.pdf |
| Pmax temperature coefficient from ONE named datasheet (about -0.4 %/°C in the summary) | UNVERIFIED | No datasheet with a Pmax coefficient was downloaded (step 4 failed: see D1, D2). Search results listed other sheets with Pmax about -0.40 to -0.45 %/°C, not downloaded | none attributable |
| Standard test conditions (STC): 1000 W/m², AM1.5, 25 °C module temperature | LOCKED | Wikipedia "Solar panel": "Module performance is generally rated under standard test conditions: irradiance of 1,000 W/m2, solar spectrum of AM 1.5 and module temperature at 25 °C" (cites Dunlop, Photovoltaic systems, 3rd ed., 2012) | https://en.wikipedia.org/w/index.php?title=Solar_panel&action=raw ; raw/wiki_Solar_panel.wikitext |
| Output is DC; an inverter is needed to supply AC loads | LOCKED | Wikipedia "Solar cell": "Arrays of solar cells are used to make solar modules that generate a usable amount of direct current (DC) from sunlight. Strings of solar modules create a solar array ... many times using an inverter to convert the solar power to alternating current (AC)." ("many times" is Wikipedia's wording) | raw/wiki_Solar_cell.wikitext |
| Series adds voltage, parallel adds current | LOCKED | Wikipedia "Solar cell": "Solar cells connected in series creates an additive higher voltage, while connecting in parallel yields an additive higher current." (same sentence in the lead-section wording: "series increases the voltage output, whereas parallel connections enhance the current output") | raw/wiki_Solar_cell.wikitext |
| Worked example: 4 panels of 24 V 4 A in series = 96 V at 4 A | SNIPPET | Search summary (GlobalSpec): "four in series give 96 V at 4 A" | https://electronics360.globalspec.com/article/18770/understanding-the-series-and-parallel-connection-of-solar-panels |
| Worked example: 4 panels of 12 V 4 A in parallel = 12 V at 16 A | SNIPPET | Search summary (EPEVER / GlobalSpec): "Four 12 V, 4 A panels in parallel yield 12 V at 16 A" | https://www.epever.com/?p=33107 ; https://electronics360.globalspec.com/article/18770/understanding-the-series-and-parallel-connection-of-solar-panels |
| A real module, not a 12 V nominal one: SLP150S-24U (150 W): Vmp 37.05 V, Imp 4.16 A, Voc 42.74 V | SNIPPET | Search summary: "150 W maximum power, 37.05 V at Pmax, 4.16 A at Pmax, 42.74 V open-circuit". PDF not downloadable this session | https://www.solar-electric.com/lib/wind-sun/SLP150S-24U-data-sheet.pdf |
| Real 12 V-class module Vmp / Imp / Voc / Isc | UNVERIFIED | 12 V-labelled datasheets appeared in results (SLP180S-12U, SLP020S-12U) but no electrical values were seen and no PDF was downloaded | https://www.solar-electric.com/lib/wind-sun/SLP180S-12U.pdf (no values seen) |
| Post's "Buku Do & Dont PLTS": the book's official title, date and publisher | LOCKED | ESDM news page (Jumat, 31 Agustus 2018): Harris (Direktur Aneka EBT dan EBT, Ditjen EBTKE) with GIZ's Rudolf Rauch launched the book "Instalasi Pembangkit Listrik Tenaga Surya: Dos and Don'ts" at "The 7th Indo-EBTKE ConEx 2018", Balai Kartini, Jakarta. The book was made under the Energising Development (EnDev) Indonesia project; "lebih dari 600 foto" | https://www.esdm.go.id/id/berita-unit/direktorat-jenderal-ebtke/ditjen-ebtke-dan-giz-luncurkan-buku-dos-and-donts-dorong-peningkatan-kualitas-instalasi-plts-off-grid ; raw/esdm_dosdonts_news.html |
| The post's title "Do & Dont" differs from the official "Dos and Don'ts" | LOCKED | Same ESDM page: title "Ditjen EBTKE dan GIZ Luncurkan Buku Dos and Don'ts" and book title "Instalasi Pembangkit Listrik Tenaga Surya: Dos and Don'ts" | raw/esdm_dosdonts_news.html |
| Book PDF downloadable from an esdm.go.id or ebtke.esdm.go.id URL | UNVERIFIED | The ESDM news page has no PDF link (checked in the saved HTML). Search found no official PDF. Author from a bibliography snippet (Bagus Ramadhani, GIZ EnDev 2018) is SNIPPET only | raw/esdm_dosdonts_news.html (no PDF link) |

## Reel B: peak sun hours (post: "rata-rata PSH Jakarta sekitar 4.5 jam", no source)

| claim | status | exact figure / wording | source URL / file |
|---|---|---|---|
| PSH = equivalent hours per day at 1 kW/m²; daily total irradiation in kWh/m² equals PSH numerically | SNIPPET | Search summary: "PSH = daily total irradiance (kWh/m²) ÷ 1 kW/m²"; "a day with 6 kWh/m² ... yielding 6 peak sun hours". NASA units are kW-hr/m^2/day (see N2), so the numeric identity is a unit matter, not a sourced definition | https://palmetto.com/local/peak-sun-hours/ ; https://palmetto.com/solar/what-are-peak-sun-hours ; https://quickestimate.co/glossary/peak-sun-hours |
| PSH is not the length of the day | SNIPPET | Search summary: "One peak sun hour is one hour's worth of sunshine at an irradiance of 1 kilowatt per square meter, which is different from the length of the day" | https://www.consumeraffairs.com/solar-energy/what-are-peak-sun-hours.html |
| Why 1 kW/m²: STC reference irradiance is 1000 W/m² | LOCKED | Wikipedia "Solar panel": standard test conditions "irradiance of 1,000 W/m2" (see A8). Linking this to PSH is the post's reasoning, not a quoted source | https://en.wikipedia.org/w/index.php?title=Solar_panel&action=raw ; raw/wiki_Solar_panel.wikitext |
| Midday summer peak irradiance in a sunny area is about 1 kW/m² (NREL slides) | SNIPPET | Search summary: "NREL's own slides say that typical peak irradiance at midday in summer in a sunny area is about 1 kW/m²". nrel.gov refused by the proxy (see sources.md) | https://nrel.gov/docs/fy24osti/90582.pdf |
| Indonesia national average PSH: 4.8 hours | SNIPPET | Search summary of IESR slide: "nilai rata-rata untuk Indonesia 4,8 jam". iesr.or.id not reachable (403) | https://iesr.or.id/wp-content/uploads/2024/06/Pengantar-PLTS-dan-PLTB-Alvin-Putra-Pintoko-Aji.pdf |
| IESR slide example: PLTS atap in Tebet, Jakarta Selatan uses 4.5 PSH | SNIPPET | Search summary: "contoh perhitungannya memakai 4,5 jam untuk PLTS atap di Tebet, Jakarta Selatan" (an example calculation, not a Jakarta average) | same IESR URL |
| IESR slide formula: daily energy = capacity (Wp) × PSH | SNIPPET | Search summary: "rumus energi harian = kapasitas (Wp) × PSH" | same IESR URL |
| Jakarta average daily solar radiation 4.5–5.0 kWh/m²/day, citing Maulida et al. (2026) | UNVERIFIED | Search summary of a paper; the Maulida paper was not found or opened | candidate only: https://prosiding.pnj.ac.id/index.php/sntm/article/download/5156/3356/30738 |
| PVsyst simulation: "rata-rata global irradiation 4,51 kWh/day", data from Solar Global Atlas, location not clear | UNVERIFIED | Search summary only; location unclear | candidate only: https://prosiding.pnj.ac.id/sntm/article/download/170/171/212 |
| Indonesia national figure ~4.8 kWh/m²/day, linked to DEN in some papers | UNVERIFIED | Search summary; no DEN document seen | none attributable |
| A Polije thesis gives 4.5–4.8 kWh/m²/day with no clear data source (the search tool's reading) | SNIPPET | Search summary: "satu sumber lain (Polije) menyebut 4,5–4,8 kWh/m²/hari tanpa menyebut sumber data yang jelas" | https://sipora.polije.ac.id/24056/2/BAB%201.pdf |
| Jakarta GHI / PSH from BMKG, Global Solar Atlas, PVGIS or Solargis | UNVERIFIED | Not obtained. Global Solar Atlas API host refused (see G1); PVGIS and Solargis not checked this session. NASA POWER is LOCKED separately (N1) | none |
| NASA POWER Jakarta point, horizontal GHI, annual mean 4.8324 kWh/m²/day (climatology 2001–2025) | LOCKED | Header "range": "25-year Meteorological and Solar Monthly & Annual Climatologies (January 2001 - December 2025)"; point coordinates returned [106.85, -6.2, 12.32] (lon, lat, elevation 12.32 m). ANN ALLSKY_SFC_SW_DWN = 4.8324 | https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF&community=RE&longitude=106.85&latitude=-6.2&format=JSON ; raw/nasa_power_climatology_jakarta.json |
| The post's "4.5 jam" as the Jakarta average | LOCKED | NASA POWER annual horizontal GHI is 4.8324 kWh/m²/day, 0.33 above the post's 4.5. Monthly range 4.3853 (FEB) to 5.5483 (SEP). The post's figure is therefore not the NASA annual value. Choosing which figure to publish is the user's decision | raw/nasa_power_climatology_jakarta.json |

## Reel C: irradiance (post: direct vs secondary data; total shortwave on horizontal; DNI cos(theta) + DHI)

| claim | status | exact figure / wording | source URL / file |
|---|---|---|---|
| GHI = DNI × cos(θz) + DHI; θz is the solar zenith angle | LOCKED | Wikipedia "Solar irradiance": "GHI = DHI + DNI × cos (z) = DHI + DirHI", z = solar zenith angle. The page cites a "Solar Resource Glossary" (NREL) for this; that glossary was not reached | https://en.wikipedia.org/w/index.php?title=Solar_irradiance&action=raw ; raw/wiki_Solar_irradiance.wikitext |
| GHI for instantaneous measurement is the sum of direct irradiance (after accounting for the solar zenith angle) and diffuse horizontal irradiance | LOCKED | Wikipedia "Solar irradiance": "For instantaneous measurement, it is the sum of direct irradiance (after accounting for the solar zenith angle, z, of the Sun) and diffuse horizontal irradiance" | raw/wiki_Solar_irradiance.wikitext |
| NREL's own GHI/DNI/DHI definition and the NREL formula | UNVERIFIED | NREL glossary not reached (nrel.gov refused by the proxy); not retried this session | none |
| The zenith angle is measured between the sun and the vertical | SNIPPET | Search summary (Surge PV glossary): "the zenith angle is measured between the sun and the vertical" | https://www.surgepv.com/glossary/dhi-diffuse-horizontal-irradiance |
| Pyranometer measures global irradiance on a planar surface (hemisphere above) | LOCKED | Wikipedia "Pyranometer": "a type of actinometer used for measuring solar irradiance on a planar surface ... the solar radiation flux density (W/m2) from the hemisphere above" | https://en.wikipedia.org/w/index.php?title=Pyranometer&action=raw ; raw/wiki_Pyranometer.wikitext |
| A pyranometer with a shade measures DHI | UNVERIFIED | Not found on the Wikipedia pages read (Pyranometer, Solar irradiance). The shading-ball method was not checked elsewhere | none |
| Pyrheliometer measures direct beam irradiance | LOCKED | Wikipedia "Pyrheliometer": "an instrument that can measure direct beam solar irradiance"; "As the pyrheliometer only 'sees' the solar disk, it needs to be placed on a device that follows the path of the sun" | https://en.wikipedia.org/w/index.php?title=Pyrheliometer&action=raw ; raw/wiki_Pyrheliometer.wikitext |
| Secondary datasets: Global Solar Atlas provides GHI, DNI, DIF, optimally tilted irradiation, PV output; ~250 m (9 arc-seconds); CC-BY-4.0 | SNIPPET | Search summary of the GIS dataset listing (AmeriGEOSS) | https://data.amerigeoss.org/dataset/world-high-resolution-solar-resource-ghi-dif-gti-dni-gis-data-global-solar-atlas |
| NASA POWER header names the satellite sources SYN1DEG and POWER | LOCKED | Header "sources": ["SYN1DEG", "POWER"] | raw/nasa_power_climatology_jakarta.json |
| NASA POWER hourly DHI and direct horizontal irradiance are biased; DNI derived from them is negatively biased | SNIPPET | Search summary of a NASA technical paper. Which of two NTRS records was summarised is UNVERIFIED | https://ntrs.nasa.gov/citations/20240006878 ; https://ntrs.nasa.gov/citations/20240014272 |
| PVGIS: satellite-based, 1'30'' resolution (about 2.5 km); draws on ground data such as BSRN (about 40 stations) | UNVERIFIED | Search summary cites "a JRC slide deck"; deck not attributable | candidate only: https://capacity4dev.europa.eu/media/23847/download/b7f03f7f-c84d-4cd2-b4c5-2d1044d79464_en |
| 2026 study across 18 sites: NASA POWER GHI exceeded PVGIS at all sites, mean relative difference 4.3% | SNIPPET | Search summary: "NASA POWER exceeded PVGIS GHI at all reported sites, with a mean relative difference of 4.3%" | https://ijisrt.com/assets/upload/files/IJISRT26JUN1603.pdf |
| Two ways to get irradiance data: direct measurement (ground station) and secondary (satellite/model) data | UNVERIFIED | Post's own framing; not checked against a named source | none |
| Total shortwave on a horizontal surface = GHI | LOCKED | Wikipedia "Solar irradiance": GHI is "the total irradiance from the Sun on a horizontal surface on Earth" | raw/wiki_Solar_irradiance.wikitext |

## Step 1, 2, 4 rows (PRD-19b)

| claim | status | exact figure / wording | source URL / file |
|---|---|---|---|
| N1. NASA POWER ALLSKY_SFC_SW_DWN (horizontal GHI), ANN | LOCKED | 4.8324 kW-hr/m^2/day (header units). Point lon 106.85, lat -6.2 | raw/nasa_power_climatology_jakarta.json |
| N2. Monthly GHI, JAN to DEC | LOCKED | JAN 4.501, FEB 4.3853, MAR 4.8122, APR 4.8014, MAY 4.6757, JUN 4.6003, JUL 4.8062, AUG 5.2963, SEP 5.5483, OCT 5.2438, NOV 4.7832, DEC 4.5074 (kW-hr/m^2/day) | raw/nasa_power_climatology_jakarta.json |
| N3. NASA POWER ALLSKY_SFC_SW_DNI, ANN (direct normal) | LOCKED | 2.6467 kW-hr/m^2/day; monthly JAN 1.7069 ... AUG 3.8863 ... DEC 1.5408 | raw/nasa_power_climatology_jakarta.json |
| N4. NASA POWER ALLSKY_SFC_SW_DIFF, ANN (diffuse) | LOCKED | 2.4314 kW-hr/m^2/day; monthly JAN 2.6062 ... JUN 2.0455 ... DEC 2.7269 | raw/nasa_power_climatology_jakarta.json |
| N5. Header period and source text | LOCKED | "NASA/POWER Source Native Resolution Climatology Climatologies"; "25-year Meteorological and Solar Monthly & Annual Climatologies (January 2001 - December 2025)"; time_standard "LST"; api version v2.10.1 | raw/nasa_power_climatology_jakarta.json |
| G1. Global Solar Atlas GHI / DNI / DIF / PVOUT for the point | UNVERIFIED | Not obtained. globalsolaratlas.info homepage returned 200, but its API host api.globalsolaratlas.info was refused by the proxy (CONNECT 403). No values were guessed | see sources.md |
| G2. A documented, reachable Global Solar Atlas point endpoint | UNVERIFIED | No official API documentation found by search or on the homepage. Third-party wrappers and Solargis APIs were not used (not Global Solar Atlas, subscription or third-party) | see sources.md |
| D1. Full datasheet values (model, Pmax, Vmp, Imp, Voc, Isc at STC) from one downloaded crystalline-silicon module datasheet | UNVERIFIED | No datasheet PDF could be downloaded: solar-electric.com, mrsolar.com, pluginsolar.co.uk, solartraders.com and manufacturer sites (JA Solar, Jinko, Trina, LONGi, Canadian Solar, LG, Risen, Qcells, VSUN) all refused by the proxy | see sources.md |
| D2. Pmax and Voc temperature coefficients from one downloaded datasheet | UNVERIFIED | Same as D1 | see sources.md |

## Corrections to the original posts

Evidence is LOCKED where a row above says so. SNIPPET and UNVERIFIED items are marked.

1. "Dipanasi sinar matahari" (heated by sunlight), Reel A. LOCKED: a solar cell converts light directly into electricity by the photovoltaic effect; photons create electron-hole pairs in a p-n junction (Wikipedia "Solar cell", raw/wiki_Solar_cell.wikitext). Heat is the job of a different device, the solar thermal collector (same page). The temperature effect is a loss, and its sign is SNIPPET only (search results; no datasheet downloaded). So "heated" describes the wrong mechanism. Script wording is the user's editorial call.

2. "Rata-rata PSH Jakarta sekitar 4.5 jam" (no source), Reel B. LOCKED: NASA POWER (Jakarta point 106.85 E, -6.2 S, 2001–2025 climatology, sources SYN1DEG and POWER) gives an annual horizontal GHI of 4.8324 kWh/m²/day. Monthly values run from 4.3853 (FEB) to 5.5483 (SEP). The post's "about 4.5" is 0.33 below the NASA annual value. The IESR 4.5 figure is an example calculation for one Tebet rooftop (SNIPPET), not a Jakarta average. The national 4.8 figure is SNIPPET (IESR, not reachable). Decision for the user: cite NASA POWER with its value, or change the figure.

3. "12 V" panels, Reel A. The series/parallel rule is LOCKED (Wikipedia "Solar cell"): series adds voltage, parallel adds current. The module voltage claim is still not locked: the only electrical values seen are SNIPPET from SLP150S-24U (a 24 V-class module): Vmp 37.05 V, Imp 4.16 A, Voc 42.74 V. No 12 V-class module values were obtained (UNVERIFIED). So "12 V 5 A" as a panel rating remains unverified.

4. Book title, Reel A. LOCKED: the official title is "Instalasi Pembangkit Listrik Tenaga Surya: Dos and Don'ts", launched 31 August 2018 (Jumat, 31 Agustus 2018) by Ditjen EBTKE and GIZ at The 7th Indo-EBTKE ConEx 2018, Balai Kartini, Jakarta. The post's "Buku Do & Dont PLTS" should use the official title. The PDF was not found (UNVERIFIED).

## Counts

Rows in the three reel tables (PRD-19 rows, split where one row mixed two claims) plus the step 1/2/4 table:
- Reel A: 20 rows (LOCKED 10, SNIPPET 6, UNVERIFIED 4)
- Reel B: 14 rows (LOCKED 3, SNIPPET 7, UNVERIFIED 4)
- Reel C: 14 rows (LOCKED 6, SNIPPET 4, UNVERIFIED 4)
- Step 1/2/4 table: 9 rows (LOCKED 5, SNIPPET 0, UNVERIFIED 4)

Total: 57 rows: LOCKED 24, SNIPPET 17, UNVERIFIED 16 (PRD-19 was 39 rows: LOCKED 0, SNIPPET 27, UNVERIFIED 12).

Counts line: 57 claim rows, LOCKED 24, SNIPPET 17, UNVERIFIED 16.
