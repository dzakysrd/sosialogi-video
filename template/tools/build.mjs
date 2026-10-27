// Generates index.html from scenes.json (+ assets). Run: node tools/build.mjs  (or npm run build)
// - Validates scenes.json and fails loudly on mistakes.
// - Computes start times, writes the static scene/overlay skeleton that HyperFrames lints and times.
// - Inlines the province map and the normalised config. Adds <audio> only if the audio file exists.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const p = (...parts) => join(ROOT, ...parts);

const TYPES = new Set(["title", "map", "bignumber", "bars"]);
const TONES = new Set(["good", "bad", "neutral", "ink", "accent"]);
const FORMATS = new Set(["full", "short"]);
const POS = new Set(["above", "below", "left", "right"]);

const errors = [];
const fail = (msg) => errors.push(msg);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r3 = (n) => Math.round(n * 1000) / 1000;

const cfgRaw = JSON.parse(readFileSync(p("scenes.json"), "utf8"));
const mapSvgRaw = readFileSync(p("assets/map/indonesia-34.svg"), "utf8").replace(/<\?xml[^>]*>\s*/, "").trim();
const mapIds = new Set([...mapSvgRaw.matchAll(/<path\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));

const fps = Number(cfgRaw.fps ?? 30);
if (!Number.isFinite(fps) || fps < 1) fail("fps must be a positive number");
if (!Array.isArray(cfgRaw.scenes) || cfgRaw.scenes.length === 0) fail("scenes must be a non-empty array");
const fmtOk = (f, where) => { if (f !== undefined && !FORMATS.has(f)) fail(`${where}: format must be full|short, got "${f}"`); };
const toneOk = (t, where) => { if (t !== undefined && !TONES.has(t)) fail(`${where}: tone must be good|bad|neutral|ink|accent, got "${t}"`); };

(cfgRaw.scenes || []).forEach((s, i) => {
  const where = `scenes[${i}] (${s.type})`;
  if (!TYPES.has(s.type)) fail(`${where}: unknown type; use title|map|bignumber|bars`);
  if (typeof s.duration !== "number" || !(s.duration > 0)) fail(`${where}: duration must be a number > 0 (seconds)`);
  if (s.caption !== undefined && typeof s.caption !== "string") fail(`${where}: caption must be text`);
  if (s.type === "title") {
    if (typeof s.text !== "string" || !s.text.trim()) fail(`${where}: text is required`);
  }
  if (s.type === "map") {
    fmtOk(s.format, where);
    if (!Array.isArray(s.provinces) || s.provinces.length === 0) fail(`${where}: provinces must be a non-empty array`);
    (s.provinces || []).forEach((pr, j) => {
      if (!mapIds.has(pr.id)) fail(`${where}.provinces[${j}]: unknown province id "${pr.id}" (see assets/map/indonesia-34.svg)`);
      if (typeof pr.value !== "number") fail(`${where}.provinces[${j}]: value must be a number`);
      toneOk(pr.tone, `${where}.provinces[${j}]`);
      if (pr.pos !== undefined && !POS.has(pr.pos)) fail(`${where}.provinces[${j}]: pos must be above|below|left|right`);
    });
    if (Array.isArray(s.focus)) (s.focus || []).forEach((id) => { if (!mapIds.has(id)) fail(`${where}: focus id "${id}" is not a province`); });
    else if (s.focus !== undefined && s.focus !== "provinces" && s.focus !== "all") fail(`${where}: focus must be "provinces", "all" or a list of ids`);
  }
  if (s.type === "bignumber") {
    fmtOk(s.format, where); fmtOk(s.alt, where); toneOk(s.tone, where);
    if (typeof s.value !== "number") fail(`${where}: value must be a number`);
  }
  if (s.type === "bars") {
    fmtOk(s.format, where);
    if (!Array.isArray(s.bars) || s.bars.length < 2 || s.bars.length > 5) fail(`${where}: bars must have 2 to 5 entries`);
    (s.bars || []).forEach((b, j) => {
      if (typeof b.label !== "string") fail(`${where}.bars[${j}]: label is required`);
      if (typeof b.value !== "number" || !(b.value > 0)) fail(`${where}.bars[${j}]: value must be a number > 0`);
      toneOk(b.tone, `${where}.bars[${j}]`);
    });
  }
});

if (errors.length) {
  console.error("build: scenes.json has errors:\n - " + errors.join("\n - "));
  process.exit(1);
}

// Normalise: start times, index, and the file-based audio status.
let t = 0;
const scenes = cfgRaw.scenes.map((s, index) => {
  const start = r3(t);
  const duration = r3(s.duration);
  t += s.duration;
  return { ...s, index, start, duration };
});
const total = r3(t);

const audioFile = cfgRaw.audio?.file ?? "assets/vo.mp3";
const hasAudio = existsSync(p(audioFile));
const audioVolume = Number(cfgRaw.audio?.volume ?? 1);

// ---------- DOM skeleton ----------
const sceneSections = scenes
  .map(
    (s) =>
      `      <section id="scene-${s.index}-${s.type}" class="clip scene" data-index="${s.index}" data-type="${s.type}" data-start="${s.start}" data-duration="${s.duration}" data-track-index="${s.index}"></section>`
  )
  .join("\n");

const overlays = [];
if (cfgRaw.brand) {
  overlays.push(`      <div id="overlay-brand" class="overlay brand clip" data-anim="fade" data-start="0" data-duration="${total}" data-track-index="4">${esc(cfgRaw.brand)}</div>`);
}
if (cfgRaw.demo) {
  overlays.push(`      <div id="overlay-demo" class="overlay demo-badge clip" data-anim="fade" data-start="0" data-duration="${total}" data-track-index="4">DEMO</div>`);
}
if (cfgRaw.source) {
  overlays.push(`      <div id="overlay-source" class="overlay source clip" data-anim="fade" data-start="0" data-duration="${total}" data-track-index="4">${esc(cfgRaw.source)}</div>`);
}
for (const s of scenes) {
  if (s.caption) {
    overlays.push(`      <div id="caption-${s.index}" class="overlay caption clip" data-anim="caption" data-start="${s.start}" data-duration="${s.duration}" data-track-index="5">${esc(s.caption)}</div>`);
  }
}

const audio = hasAudio
  ? `      <audio id="vo" src="${esc(audioFile)}" data-start="0" data-duration="${total}" data-volume="${audioVolume}" preload="auto"></audio>`
  : "";

// JSON in a <script> tag: escape "<" so no "</script>" can appear in the data.
const configJson = JSON.stringify({
  demo: !!cfgRaw.demo,
  fps,
  total,
  brand: cfgRaw.brand ?? "",
  source: cfgRaw.source ?? "",
  scenes,
}).replace(/</g, "\\u003c");

// The stylesheet is inlined: the HyperFrames compiler only sees @font-face rules that are in the page itself,
// and an external stylesheet makes the local fonts look undeclared (it then pulls Inter from Google Fonts).
// Paths are written relative to components/, so "../assets/" becomes "assets/" in the inlined copy.
const styleRaw = readFileSync(p("components/sos.css"), "utf8").replace(/url\("\.\.\/assets\//g, 'url("assets/');
const template = readFileSync(p("src/template.html"), "utf8");
// Function replacers: plain-string replacement would interpret "$" sequences in the inlined data.
const fill = (src, key, value) => src.replace(`{{${key}}}`, () => value);
const html = [
  ["TOTAL", String(total)],
  ["FPS", String(fps)],
  ["SCENES", sceneSections],
  ["OVERLAYS", overlays.join("\n")],
  ["AUDIO", audio],
  ["STYLE", styleRaw],
  ["MAP_SVG", mapSvgRaw],
  ["CONFIG_JSON", configJson],
].reduce((acc, [key, value]) => fill(acc, key, value), template);

if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error("build: unreplaced placeholder left in index.html");
writeFileSync(p("index.html"), html, "utf8");

console.log(`build: wrote index.html, ${scenes.length} scenes, total ${total}s @ ${fps}fps`);
for (const s of scenes) console.log(`  [${s.index}] ${s.type.padEnd(9)} ${String(s.start).padStart(6)}s  +${s.duration}s`);
console.log(hasAudio ? `  audio: ${audioFile} (volume ${audioVolume})` : `  audio: none (${audioFile} not found; render is silent)`);
