# Sources used (PRD-19)

Status of access in this session:
- **Opened (page body read): none.** No page was read in full.
- **Snippet:** the URL appeared in a WebSearch result and the figure/quote comes from that result's summary text. Title is as shown in the result list.
- **Failed to open (WebFetch):**
  - https://www.nrel.gov/grid/solar-resource/spectra.html: `getaddrinfo ENOTFOUND www.nrel.gov` (host did not resolve)
  - https://iesr.or.id/wp-content/uploads/2024/06/Pengantar-PLTS-dan-PLTB-Alvin-Putra-Pintoko-Aji.pdf: `getaddrinfo ENOTFOUND iesr.or.id`
  - https://en.wikipedia.org/wiki/Solar_irradiance: `getaddrinfo ENOTFOUND en.wikipedia.org`
  - https://nrel.gov/docs/fy24osti/90582.pdf: `getaddrinfo ENOTFOUND nrel.gov`
  - After these four DNS failures the tool guidance said to stop trying more sites, so no further WebFetch calls were made.
- Blocked hosts from the brief (power.larc.nasa.gov, globalsolaratlas.info) were not contacted.

WebSearch calls used: 18 (of about 40 allowed).

## Sources with a per-URL role

| URL | Title as shown | Publisher / date | Opened or snippet | Used for |
|---|---|---|---|---|
| https://digitalocean.wpcompress.com/blog/photovoltaic-cell-how-they-work | Photovoltaic Cell: How They Work? | not shown | snippet | A1 (PV mechanism) |
| https://www.techniques-ingenieur.fr/en/resources/article/ti301/photovoltaic-technologies-d3942/photovoltaics-how-a-cell-works-losses-and-strategies-to-limit-them-1 | Photovoltaics: how a cell works, losses, and strategies to limit them | Techniques de l'Ingenieur; date not shown | snippet | A1 |
| https://sinovoltaics.com/solar-basics/measuring-the-temperature-coefficients-of-a-pv-module | Measuring the temperature coefficients of a PV module | Sinovoltaics; date not shown | snippet | A3 (candidate; attribution of the -0.2 to -0.5 %/°C range not confirmed) |
| https://solarcalculator.com.au/solar-panel-temperature/ | The effect of temperature on solar panel performance | Solar Calculator (AU); date not shown | snippet | A3 (candidate) |
| https://greentumble.com/effect-of-temperature-on-solar-panel-efficiency | How Hot Do Solar Panels Get? Effect of Temperature on PV Panel Efficiency | Greentumble; date not shown | snippet | A3 (candidate) |
| https://www.emergo.nl/Emergo/media/Downloads/Ulica-Emergo-Navitect-II-Datasheet-202008-2.pdf | Ulica Emergo Navitect II Datasheet 202008 2 | Emergo (distributor; sheet says info copied from manufacturer datasheet); dated 202008 in filename | snippet | A3 (Voc coefficient about -0.29 to -0.30 %/°C) |
| https://www.solar-electric.com/lib/wind-sun/SLP150S-24U-data-sheet.pdf | SLP150S 24U data sheet | solar-electric.com; date not shown | snippet | A3 (Voc -(80±10) mV/°C); A7 (Vmp, Imp, Voc) |
| https://www.solar-electric.com/lib/wind-sun/SLP180S-12U.pdf | SLP180S 12U | solar-electric.com; date not shown | snippet (title only; no values seen) | A7 (UNVERIFIED 12 V-class values) |
| https://www.solar-electric.com/lib/wind-sun/SLP020S-12U-020031201A-DS.pdf | SLP020S 12U 020031201A DS | solar-electric.com; date not shown | snippet (title only) | A7 (candidate) |
| https://www.mrsolar.com/content/pdf/SolarLand/Panels/SLP100S-12.pdf | SLP100S 12 | mrsolar.com; date not shown | snippet | B2 (STC 1000 W/m², AM1.5, 25 °C) |
| https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10020754 | String inverter system | USPTO patent full text; date not shown | snippet | A4 (DC output, inverter needed) |
| https://electronics360.globalspec.com/article/18770/understanding-the-series-and-parallel-connection-of-solar-panels | Understanding the series and parallel connection of solar panels | GlobalSpec (Electronics360); date not shown | snippet | A5, A6 |
| https://www.bluettipower.com/blogs/knowledge/solar-panel-series-vs-parallel | solar panel series vs parallel | Bluetti (vendor blog); date not shown | snippet | A5 |
| https://www.epever.com/?p=33107 | - 12 December 2025 (as shown) | EPEVER (vendor); date shown in title as 12 December 2025 | snippet | A5, A6 |
| https://www.esdm.go.id/id/berita-unit/direktorat-jenderal-ebtke/ditjen-ebtke-dan-giz-luncurkan-buku-dos-and-donts-dorong-peningkatan-kualitas-instalasi-plts-off-grid | Ditjen EBTKE dan GIZ Luncurkan Buku Dos and Don'ts, Dorong Peningkatan Kualitas Instalasi PLTS Off-Grid | Kementerian ESDM (Ditjen EBTKE); date not shown in snippet (launch 2018 per summary) | snippet | A8 |
| https://www.surgepv.com/glossary/dhi-diffuse-horizontal-irradiance | Definition D | Surge PV (glossary); date not shown | snippet | C1 (GHI = DNI × cos θz + DHI) |
| https://en.wikipedia.org/wiki/Solar_irradiance | Solar irradiance | Wikipedia; date not shown | snippet only (fetch failed: DNS) | C2, C4 |
| https://palmetto.com/local/peak-sun-hours/ | Peak Sun Hours | Palmetto (vendor); date not shown | snippet | B1 |
| https://palmetto.com/solar/what-are-peak-sun-hours | what are peak sun hours | Palmetto (vendor); date not shown | snippet | B1 |
| https://quickestimate.co/glossary/peak-sun-hours | What are peak sun hours? | QuickEstimate (glossary); date not shown | snippet | B1 |
| https://www.consumeraffairs.com/solar-energy/what-are-peak-sun-hours.html | What Are Peak Sun Hours? | ConsumerAffairs; date not shown | snippet | B1 |
| https://nrel.gov/docs/fy24osti/90582.pdf | nrel.gov (title as shown in result list) | NREL slides (per search summary); FY24 OSTI number; date not shown | snippet only (fetch failed: DNS) | B3 |
| https://iesr.or.id/wp-content/uploads/2024/06/Pengantar-PLTS-dan-PLTB-Alvin-Putra-Pintoko-Aji.pdf | Pengantar PLTS dan PLTB Alvin Putra Pintoko Aji | IESR (Institute for Essential Services Reform); URL dated 2024/06 | snippet only (fetch failed: DNS) | B4, B5, B6 (Indonesia 4.8 h; Tebet 4.5 h example; PSH = Wp × PSH formula) |
| https://sipora.polije.ac.id/24056/2/BAB%201.pdf | polije.ac.id (title as shown) | Politeknik Negeri Jember thesis chapter; date not shown | snippet | B9 |
| https://prosiding.pnj.ac.id/index.php/sntm/article/download/5156/3356/30738 | prosiding.pnj.ac.id (title as shown) | PNJ proceedings (SNTM); date not shown | snippet (candidate only; the paper citing Maulida et al. was not confirmed as this URL) | B6 (UNVERIFIED) |
| https://prosiding.pnj.ac.id/sntm/article/download/170/171/212 | prosiding.pnj.ac.id (title as shown) | PNJ proceedings; 2025 per search summary; date not shown | snippet (candidate only) | B8 (UNVERIFIED) |
| https://data.amerigeoss.org/dataset/world-high-resolution-solar-resource-ghi-dif-gti-dni-gis-data-global-solar-atlas | World - High Resolution Solar Resource (GHI, DIF, GTI, DNI) GIS Data, (Global Solar Atlas) | AmeriGEOSS catalogue (dataset of Global Solar Atlas / World Bank ESMAP / Solargis); metadata date not shown | snippet | C5 |
| https://ntrs.nasa.gov/citations/20240006878 | (title not shown) | NASA NTRS; date not shown | snippet (candidate; which of the two NTRS records was summarised is UNVERIFIED) | C6 |
| https://ntrs.nasa.gov/citations/20240014272 | (title not shown) | NASA NTRS; date not shown | snippet (candidate only) | C6 (UNVERIFIED) |
| https://capacity4dev.europa.eu/media/23847/download/b7f03f7f-c84d-4cd2-b4c5-2d1044d79464_en | b7f03f7f c84d 4cd2 b4c5 2d1044d79464 en | EU Capacity4dev; date not shown; not confirmed as the JRC deck | snippet (candidate only) | C7 (UNVERIFIED) |
| https://ijisrt.com/assets/upload/files/IJISRT26JUN1603.pdf | ijisrt.com (title as shown) | IJISRT; 2026 per search summary | snippet | C7 |
| https://www.jetro.go.jp/en/database/j-messe/tradefair/detail/125354 | Electric & Power Indonesia 2023 | JETRO J-messe database; date not shown | snippet | brand.md (trade show; not the client) |
| https://industri.kontan.co.id/news/plts-atap-banyak-dikeluhkan-begini-penjelasan-pln | plts atap banyak dikeluhkan begini penjelasan pln | Kontan; date not shown | snippet (headline only) | audience.md |
| https://industri.kontan.co.id/news/pengguna-plts-atap-keluhkan-permen-esdm-no-492018-begini-penjelasannya | pengguna plts atap keluhkan permen esdm no 492018 begini penjelasannya | Kontan; date not shown | snippet (headline only) | audience.md |
| https://www.fortuneidn.com/news/pengguna-plts-sayangkan-aturan-ekspor-listrik-ke-jaringan-pln-dihapus-00-29s55-p8q1b0 | Pengguna PLTS sayangkan aturan ekspor listrik ke jaringan PLN dihapus | Fortune Indonesia; date not shown | snippet (headline only) | audience.md |
| https://industri.kontan.co.id/news/pembatasan-plts-atap-bikin-pelaku-usaha-kesulitan-ini-tanggapan-pln | pembatasan plts atap bikin pelaku usaha kesulitan ini tanggapan pln | Kontan; date not shown | snippet (headline only) | audience.md |
| https://katadata.co.id/yuliawati/berita/632d5158476db/pln-kelebihan-pasokan-listrik-warga-dan-pengusaha-sulit-pasang-plts?page=2 | PLN Kelebihan Pasokan Listrik, Warga dan Pengusaha Sulit Pasang PLTS | Katadata; date not shown (URL id suggests 2022) | snippet (headline only) | audience.md |
| https://www.idxchannel.com/news/youtuber-internasional-buat-konten-plts-cirata-erick-thohir-thank-you-so-much | youtuber internasional buat konten plts cirata erick thohir thank you so much | IDX Channel; date not shown | snippet (headline only; creator not named in snippet) | brand.md (checked; not linked to the client) |

## Notes on attribution
- Search summaries sometimes merged several results into one sentence. Where I could not tie a sentence to one URL, the fact file marks it UNVERIFIED instead of guessing.
- Search results included a Wikipedia URL and NREL PDF URL that did not resolve when opened. Their content is therefore snippet-only and cannot be upgraded to LOCKED.
