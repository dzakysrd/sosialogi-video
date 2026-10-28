// Builds the video-02 Reels cover (1080x1920): build/cover.html from research/video-02/re_national.csv and the video's
// style (components/sos.css :root tokens and @font-face rules), then screenshots it with the headless Chrome to
// out/v2_cover.png. The dot grid is the video's: 40 x 25 dots, the last N in reading order unlit, N = round(10 * (100 - ratio[2013])).
// Run from video-02/: node tools/cover.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { parseCsv } from "./lib/csv.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const CHROME = process.env.CHROME_BIN ?? "/root/.cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/chrome-headless-shell-linux64/chrome-headless-shell";
const W = 1080, H = 1920;
const COLS = 40, ROWS = 25, DOT = 12, GAP = 5; // the video's grid (sos.css .dot-grid, build.mjs grid)
const TOTAL = COLS * ROWS;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- data (every number comes from here) ----------
const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
const nat = parseCsv(readFileSync(P(cfg.inputs.national), "utf8"));
const natRow = (year) => {
  const r = nat.find((x) => x.year === String(year));
  if (!r) throw new Error(`no re_national row for ${year}`);
  return r;
};
const lastYear = Math.max(...nat.map((x) => Number(x.year)));
const YEARS_AGO = lastYear - 2013; // "12 tahun lalu" = 2013 to 2025
const gap13 = 100 - Number(natRow(2013).ratio_pct); // share not electrified in 2013
if (!(gap13 >= 18 && gap13 < 20)) throw new Error(`100 - re_national[2013].ratio_pct = ${gap13.toFixed(2)}, outside 18 <= x < 20`);
const N = Math.round(10 * gap13); // unlit dots
const LIT = TOTAL - N;

// ---------- style: the video's tokens and fonts, read from components/sos.css ----------
const sosCss = readFileSync(P("components/sos.css"), "utf8");
const rootBlock = sosCss.match(/:root\s*\{[^}]*\}/)?.[0];
const fontFaces = sosCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];
if (!rootBlock || fontFaces.length < 5) throw new Error("components/sos.css: :root block or @font-face rules not found");
// @font-face paths in sos.css are relative to components/ ("../assets/fonts/..."); build/ is the same depth, so they stay valid.

// ---------- markup ----------
const dots = [];
for (let i = 0; i < TOTAL; i++) dots.push(`<span class="dot${i >= LIT ? " unlit" : ""}"></span>`);

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080">
<title>video-02 cover</title>
<style>
${fontFaces.join("\n")}
${rootBlock}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ground); }
body { font-family: var(--font-body); color: var(--ink); }
#cover { position: absolute; left: 0; top: 440px; width: ${W}px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.kicker { font: 800 44px/1.2 var(--font-body); letter-spacing: 0.08em; padding-left: 0.08em; color: var(--accent); white-space: nowrap; }
.hero { margin-top: 10px; font: 400 140px/1 var(--font-display); color: var(--accent); white-space: nowrap; }
.claim { margin-top: 16px; font: 400 110px/0.95 var(--font-display); color: var(--ink); white-space: nowrap; }
.grid { margin-top: 40px; display: grid; grid-template-columns: repeat(${COLS}, ${DOT}px); grid-template-rows: repeat(${ROWS}, ${DOT}px); gap: ${GAP}px; width: ${COLS * DOT + (COLS - 1) * GAP}px; height: ${ROWS * DOT + (ROWS - 1) * GAP}px; }
.dot { width: ${DOT}px; height: ${DOT}px; border-radius: 50%; background: var(--accent); }
.dot.unlit { background: var(--unlit); }
.tail { margin-top: 40px; font: 800 56px/1.2 var(--font-body); color: var(--ink); white-space: nowrap; }
#boxes { display: none; }
</style>
</head>
<body>
<div id="cover">
<div class="kicker" data-box="kicker">${esc(YEARS_AGO)} TAHUN LALU</div>
<div class="hero" data-box="hero">HAMPIR 1 DARI 5</div>
<div class="claim" data-box="claim">RUMAH TANGGA<br>BELUM BERLISTRIK</div>
<div class="grid" data-box="grid">${dots.join("")}</div>
<div class="tail" data-box="tail">SEKARANG?</div>
</div>
<pre id="boxes"></pre>
<script>
(function () {
  var faces = ["400 140px SosDisplay", "400 110px SosDisplay", "800 44px SosBody", "800 56px SosBody"];
  Promise.all(faces.map(function (f) { return document.fonts.load(f); })).catch(function () {}).then(function () {
    var boxes = {};
    document.querySelectorAll("[data-box]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      boxes[el.getAttribute("data-box")] = [r.left, r.top, r.right, r.bottom].map(function (v) { return Math.round(v * 10) / 10; });
    });
    var fonts = [];
    document.fonts.forEach(function (f) { fonts.push(f.family + " " + f.weight + " " + f.status); });
    document.getElementById("boxes").textContent = JSON.stringify({ boxes: boxes, fonts: fonts });
  });
})();
</script>
</body>
</html>
`;

mkdirSync(P("build"), { recursive: true });
mkdirSync(P("out"), { recursive: true });
const htmlPath = P("build/cover.html");
writeFileSync(htmlPath, html, "utf8");

// ---------- render ----------
if (!existsSync(CHROME)) throw new Error(`headless Chrome not found: ${CHROME} (set CHROME_BIN)`);
const pageUrl = pathToFileURL(htmlPath).href;
// Root runs this container, so Chrome needs --no-sandbox.
const chromeFlags = ["--headless", "--no-sandbox", "--hide-scrollbars", `--window-size=${W},${H}`, "--virtual-time-budget=3000"];
const outPng = P("out/v2_cover.png");
execFileSync(CHROME, [...chromeFlags, `--screenshot=${outPng}`, pageUrl], { stdio: ["ignore", "ignore", "ignore"], timeout: 120000 });
const dumped = execFileSync(CHROME, [...chromeFlags, "--dump-dom", pageUrl], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 120000 });
const m = dumped.match(/<pre id="boxes"[^>]*>([\s\S]*?)<\/pre>/);
const measured = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")) : null;

// ---------- report ----------
const unlitInHtml = (html.match(/class="dot unlit"/g) ?? []).length;
const litInHtml = (html.match(/class="dot"/g) ?? []).length;
console.log(`last year ${lastYear}; ${YEARS_AGO} tahun lalu`);
console.log(`100 - re_national[2013].ratio_pct = ${gap13.toFixed(2)}; N = round(10 * ${gap13.toFixed(2)}) = ${N} unlit; ${LIT} lit; grid ${COLS} x ${ROWS} = ${TOTAL}`);
console.log(`html dots: unlit ${unlitInHtml}, lit ${litInHtml}`);
if (measured) {
  console.log(`measured boxes [left, top, right, bottom]: ${JSON.stringify(measured.boxes)}`);
  console.log(`font faces: ${JSON.stringify(measured.fonts)}`);
} else {
  console.log("measured boxes: none (the page did not report them)");
}
console.log(`wrote ${htmlPath}`);
console.log(`screenshot ${outPng}`);
