// Tests for video-02 number helpers and the script/data tie-ins.
// Run from the repo root: node video-02/tools/test_nums.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { intWords, spokenInt, fmtPct, spokenPct, fmtInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(resolve(repo, rel), "utf8");

// One line per check. The first failure prints the error and exits 1.
function check(label, fn) {
  try {
    fn();
  } catch (e) {
    console.log(`FAIL ${label}\n${e.message}`);
    process.exit(1);
  }
  console.log(`ok   ${label}`);
}

// fmtPct
check('fmtPct("80.51") -> "80,51%"', () => assert.equal(fmtPct("80.51"), "80,51%"));
check('fmtPct("88.3") -> "88,3%"', () => assert.equal(fmtPct("88.3"), "88,3%"));
check('fmtPct("100.00") -> "100,00%"', () => assert.equal(fmtPct("100.00"), "100,00%"));
check('fmtPct("14.06") -> "14,06%"', () => assert.equal(fmtPct("14.06"), "14,06%"));
check('fmtPct("abc") throws', () => assert.throws(() => fmtPct("abc")));
check('fmtPct("1,5") throws', () => assert.throws(() => fmtPct("1,5")));

// spokenPct
check('spokenPct("80,51%") -> "delapan puluh koma lima satu persen"', () =>
  assert.equal(spokenPct("80,51%"), "delapan puluh koma lima satu persen"));
check('spokenPct("99,83%") -> "sembilan puluh sembilan koma delapan tiga persen"', () =>
  assert.equal(spokenPct("99,83%"), "sembilan puluh sembilan koma delapan tiga persen"));
check('spokenPct("93,82%") -> "sembilan puluh tiga koma delapan dua persen"', () =>
  assert.equal(spokenPct("93,82%"), "sembilan puluh tiga koma delapan dua persen"));
check('spokenPct("14,06%") -> "empat belas koma nol enam persen"', () =>
  assert.equal(spokenPct("14,06%"), "empat belas koma nol enam persen"));
check('spokenPct("88,3%") -> "delapan puluh delapan koma tiga persen"', () =>
  assert.equal(spokenPct("88,3%"), "delapan puluh delapan koma tiga persen"));
check('spokenPct("100,00%") -> "seratus koma nol nol persen"', () =>
  assert.equal(spokenPct("100,00%"), "seratus koma nol nol persen"));
check('spokenPct("80.51") throws', () => assert.throws(() => spokenPct("80.51")));

// spokenInt
check('spokenInt("2013") -> "dua ribu tiga belas"', () => assert.equal(spokenInt("2013"), "dua ribu tiga belas"));
check('spokenInt("2023") -> "dua ribu dua puluh tiga"', () => assert.equal(spokenInt("2023"), "dua ribu dua puluh tiga"));
check('spokenInt("2025") -> "dua ribu dua puluh lima"', () => assert.equal(spokenInt("2025"), "dua ribu dua puluh lima"));

// intWords
check("intWords(1) -> \"satu\"", () => assert.equal(intWords(1), "satu"));
check("intWords(2) -> \"dua\"", () => assert.equal(intWords(2), "dua"));
check("intWords(5) -> \"lima\"", () => assert.equal(intWords(5), "lima"));
check("intWords(1000) -> \"seribu\"", () => assert.equal(intWords(1000), "seribu"));

// fmtInt
check('fmtInt(1000) -> "1.000"', () => assert.equal(fmtInt(1000), "1.000"));
check('fmtInt(5) -> "5"', () => assert.equal(fmtInt(5), "5"));
check("fmtInt(-1) throws", () => assert.throws(() => fmtInt(-1)));
check("fmtInt(1.5) throws", () => assert.throws(() => fmtInt(1.5)));

// Script tie-in: every percent and four-digit number in the script speaks as expected.
const script = JSON.parse(read("research/video-02/script_v1.json"));
const numbers = script.scenes.flatMap((s) => s.numbers ?? []);
let pctCount = 0;
let yearCount = 0;
for (const { show, spoken } of numbers) {
  if (show.endsWith("%")) {
    check(`script "${show}" -> "${spoken}"`, () => assert.equal(spokenPct(show), spoken));
    pctCount++;
  } else if (/^\d{4}$/.test(show)) {
    check(`script "${show}" -> "${spoken}"`, () => assert.equal(spokenInt(show), spoken));
    yearCount++;
  }
}
check(`script: ${pctCount} percent and ${yearCount} four-digit entries were checked`, () =>
  assert.ok(pctCount > 0 && yearCount > 0));

// Data tie-in: the printed CSV values format to the script's on-screen strings.
const national = parseCsv(read("research/video-02/re_national.csv"));
const province = parseCsv(read("research/video-02/re_province.csv"));
const need = (row, what) => {
  if (!row) throw new Error(`missing row: ${what}`);
  return row;
};
const nat2013 = need(national.find((r) => r.year === "2013"), "re_national 2013");
const nat2025 = need(national.find((r) => r.year === "2025"), "re_national 2025");
const papua = need(province.find((r) => r.province === "Papua Pegunungan"), "re_province Papua Pegunungan");

check('fmtPct(re_national 2013 ratio_pct) === "80,51%"', () => assert.equal(fmtPct(nat2013.ratio_pct), "80,51%"));
check('fmtPct(re_national 2025 ratio_pct) === "99,83%"', () => assert.equal(fmtPct(nat2025.ratio_pct), "99,83%"));
check('fmtPct(Papua Pegunungan re_total) === "93,82%"', () => assert.equal(fmtPct(papua.re_total), "93,82%"));
check('fmtPct(Papua Pegunungan re_pln) === "14,06%"', () => assert.equal(fmtPct(papua.re_pln), "14,06%"));

const shows = new Set(numbers.map((n) => n.show));
for (const s of ["80,51%", "99,83%", "93,82%", "14,06%"]) {
  check(`script has show "${s}"`, () => assert.ok(shows.has(s)));
}
