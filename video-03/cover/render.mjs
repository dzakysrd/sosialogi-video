// Renders the video-03 Reels cover (two variants) with Playwright.
// Run from the repo root: node video-03/cover/render.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, 'cover.html');
const outDir = path.resolve(here, '..', 'out');

const VARIANTS = [
  { v: 'a', file: 'cover_a.png' },
  { v: 'b', file: 'cover_b.png' },
];
const SAFE = { x0: 65, x1: 1015, y0: 300, y1: 1500 };
const SELECTORS = ['.kicker', '.head .line', '.num', '.foot', '.brand', '.icons'];

let failCount = 0;
const fail = (msg) => { failCount++; console.log('FAIL: ' + msg); };

const browser = await chromium.launch();
try {
  for (const { v, file } of VARIANTS) {
    console.log(`== variant ${v} ==`);
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const url = pathToFileURL(htmlPath).href + '?v=' + v;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__coverReady === true, null, { timeout: 15000 });
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        display: document.fonts.check('400 100px SosDisplay'),
        body800: document.fonts.check('800 40px SosBody'),
        body600: document.fonts.check('600 44px SosBody'),
        error: window.__coverError || null,
      };
    });
    console.log('fonts: ' + JSON.stringify(fonts));
    if (fonts.error) fail(`${v}: font load error ${fonts.error}`);
    if (!fonts.display) fail(`${v}: document.fonts.check('400 100px SosDisplay') is false`);
    if (!fonts.body800 || !fonts.body600) fail(`${v}: Inter fonts not loaded`);

    const boxes = await page.evaluate((sels) => {
      const out = [];
      for (const s of sels) {
        const els = document.querySelectorAll(s);
        els.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const label = els.length > 1 ? `${s}[${i}]` : s;
          out.push({ label, x: r.left, y: r.top, r: r.right, b: r.bottom });
        });
      }
      return out;
    }, SELECTORS);

    for (const b of boxes) {
      console.log(`${b.label.padEnd(14)} x=${b.x.toFixed(1)} y=${b.y.toFixed(1)} right=${b.r.toFixed(1)} bottom=${b.b.toFixed(1)}`);
      if (b.x < SAFE.x0 || b.r > SAFE.x1 || b.y < SAFE.y0 || b.b > SAFE.y1) {
        fail(`${v}: ${b.label} outside safe area`);
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        if (a.x < c.r && c.x < a.r && a.y < c.b && c.y < a.b) {
          fail(`${v}: ${a.label} overlaps ${c.label}`);
        }
      }
    }

    const fontSize = await page.evaluate(() => getComputedStyle(document.querySelector('.num')).fontSize);
    console.log(`number font-size: ${fontSize}`);

    await page.screenshot({ path: path.join(outDir, file), type: 'png' });
    console.log(`wrote ${path.join(outDir, file)}`);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(failCount === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failCount} problem(s))`);
process.exitCode = failCount === 0 ? 0 : 1;
