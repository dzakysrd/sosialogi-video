// Province geometry measured in headless Chrome (the same engine the renderer uses), cached in build/geometry.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const base = "/root/.cache/hyperframes/chrome";
  if (!existsSync(base)) throw new Error("headless Chrome not found; set CHROME_BIN");
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (name === "chrome-headless-shell") return p;
    }
  }
  throw new Error("chrome-headless-shell not found under " + base);
}

export function getGeometry(svgPath, outDir) {
  const svg = readFileSync(svgPath, "utf8").replace(/<\?xml[^>]*>\s*/, "");
  const hash = createHash("sha256").update(svg).digest("hex").slice(0, 16);
  const cache = join(outDir, "geometry.json");
  if (existsSync(cache)) {
    const c = JSON.parse(readFileSync(cache, "utf8"));
    if (c.hash === hash) return c;
  }
  mkdirSync(join(outDir, "probe"), { recursive: true });
  const probe = join(outDir, "probe", "geo.html");
  const page = `<!doctype html><html><body><template id="t">${svg}</template><pre id="out"></pre><script>
    const s = document.importNode(document.getElementById("t").content.querySelector("svg"), true);
    document.body.appendChild(s);
    const vb = s.getAttribute("viewBox").trim().split(/\\s+/).map(Number);
    const provs = {};
    s.querySelectorAll("path[id]").forEach(p => { const b = p.getBBox();
      provs[p.id] = { name: p.getAttribute("data-name"), x: b.x, y: b.y, w: b.width, h: b.height }; });
    document.getElementById("out").textContent = JSON.stringify({ viewBox: vb, provs });
  </script></body></html>`;
  writeFileSync(probe, page);
  const out = execFileSync(findChrome(), ["--headless", "--no-sandbox", "--disable-gpu", "--dump-dom", "file://" + probe],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(out);
  if (!m) throw new Error("geometry probe produced no output");
  const parsed = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  const geo = { hash, viewBox: parsed.viewBox, provs: parsed.provs };
  writeFileSync(cache, JSON.stringify(geo, null, 1) + "\n");
  return geo;
}
