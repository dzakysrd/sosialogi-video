// Builds assets/map/indonesia-34.svg from the vendored @svg-maps/indonesia@2.0.0 SVG.
// Run once: node tools/make-map.mjs
// The source map is already a 2D projection (MapSVG). Nothing is reprojected here; the
// viewBox is kept as-is and the SVG is scaled by the browser.
import { readFileSync, writeFileSync } from "node:fs";

const SRC_SVG = "assets/map/source/indonesia-svgmaps-2.0.0.svg";
const SRC_INDEX = "assets/map/source/svgmaps-indonesia-index.js";
const OUT_SVG = "assets/map/indonesia-34.svg";

// svg id -> [display name used in videos, label as shipped in the source SVG (aria-label)]
const PROVINCES = {
  "id-ac": ["Aceh", "Aceh"],
  "id-su": ["Sumatera Utara", "Sumatera Utara"],
  "id-sb": ["Sumatera Barat", "Sumatera Barat"],
  "id-ri": ["Riau", "Riau"],
  "id-ja": ["Jambi", "Jambi"],
  "id-ss": ["Sumatera Selatan", "Sumatera Selatan"],
  "id-be": ["Bengkulu", "Bengkulu"],
  "id-la": ["Lampung", "Lampung"],
  "id-bb": ["Kepulauan Bangka Belitung", "Bangka Belitung"],
  "id-kr": ["Kepulauan Riau", "Kepulauan Riau"],
  "id-jk": ["DKI Jakarta", "Jakarta Raya"],
  "id-jb": ["Jawa Barat", "Jawa Barat"],
  "id-bt": ["Banten", "Banten"],
  "id-jt": ["Jawa Tengah", "Jawa Tengah"],
  "id-yo": ["DI Yogyakarta", "Yogyakarta"],
  "id-ji": ["Jawa Timur", "Jawa Timur"],
  "id-ba": ["Bali", "Bali"],
  "id-nb": ["Nusa Tenggara Barat", "Nusa Tenggara Barat"],
  "id-nt": ["Nusa Tenggara Timur", "Nusa Tenggara Timur"],
  "id-kb": ["Kalimantan Barat", "Kalimantan Barat"],
  "id-kt": ["Kalimantan Tengah", "Kalimantan Tengah"],
  "id-ki": ["Kalimantan Timur", "Kalimantan Timur"],
  "id-ks": ["Kalimantan Selatan", "Kalimantan Selatan"],
  "id-ku": ["Kalimantan Utara", "Kalimantan Utara"],
  "id-sa": ["Sulawesi Utara", "Sulawesi Utara"],
  "id-st": ["Sulawesi Tengah", "Sulawesi Tengah"],
  "id-sr": ["Sulawesi Barat", "Sulawesi Barat"],
  "id-sn": ["Sulawesi Selatan", "Sulawesi Selatan"],
  "id-sg": ["Sulawesi Tenggara", "Sulawesi Tenggara"],
  "id-go": ["Gorontalo", "Gorontalo"],
  "id-ma": ["Maluku", "Maluku"],
  "id-mu": ["Maluku Utara", "Maluku Utara"],
  "id-pa": ["Papua", "Papua"],
  "id-pb": ["Papua Barat", "Papua Barat"],
};

const src = readFileSync(SRC_SVG, "utf8");
const index = readFileSync(SRC_INDEX, "utf8");

// Cross-check the source labels against the package's own index (name <-> id pairs).
const pkgPairs = new Map();
for (const m of index.matchAll(/"name":"([^"]+)","id":"([^"]+)"/g)) pkgPairs.set(m[2], m[1]);

const viewBox = /viewBox="([^"]+)"/.exec(src)?.[1];
if (!viewBox) throw new Error("viewBox not found in source SVG");

const paths = [];
for (const m of src.matchAll(/<path\b([^>]*?)\/?>/g)) {
  const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
  paths.push(attrs);
}

const problems = [];
const seen = new Set();
const out = [];
for (const p of paths) {
  const id = p.id;
  const entry = PROVINCES[id];
  if (!entry) { problems.push(`no name mapping for ${id}`); continue; }
  const [displayName, sourceLabel] = entry;
  if (p["aria-label"] !== sourceLabel) problems.push(`source label mismatch for ${id}: svg says "${p["aria-label"]}", table says "${sourceLabel}"`);
  if (pkgPairs.get(id) !== sourceLabel) problems.push(`package index mismatch for ${id}: index says "${pkgPairs.get(id)}", table says "${sourceLabel}"`);
  if (!p.d) problems.push(`empty path data for ${id}`);
  seen.add(id);
  out.push(`    <path id="${id}" data-name="${displayName}" data-source-label="${sourceLabel}" d="${p.d}"/>`);
}
for (const id of Object.keys(PROVINCES)) if (!seen.has(id)) problems.push(`mapping has no path in source: ${id}`);
if (paths.length !== 34) problems.push(`expected 34 paths, found ${paths.length}`);
if (problems.length) {
  console.error("make-map: refusing to write, problems found:\n - " + problems.join("\n - "));
  process.exit(1);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Peta provinsi Indonesia (34 provinsi)">
  <!-- Derived from "Map of Indonesia" by MapSVG (https://mapsvg.com/maps/indonesia), via the npm package @svg-maps/indonesia@2.0.0,
       licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: Brunei, Sabah, Sarawak, Timor-Leste removed (not in the
       source copy); ids kept; data-name (display name) and data-source-label added; wrapped in one group; no reprojection. -->
  <g id="provinces">
${out.join("\n")}
  </g>
</svg>
`;
writeFileSync(OUT_SVG, svg, "utf8");
console.log(`make-map: wrote ${OUT_SVG} with ${out.length} provinces, viewBox "${viewBox}"`);
