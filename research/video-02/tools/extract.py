#!/usr/bin/env python3
"""PRD-07b: build re_national.csv and re_province.csv from the PDFs in raw/.

Run:  python3 -I research/video-02/tools/extract.py

Reads research/video-02/raw/*.pdf one page at a time with
`pdftotext -layout -f N -l N` and writes research/video-02/re_national.csv and
research/video-02/re_province.csv. Exits 1 with "FAIL:" if a raw file is missing
or its sha256 differs from SHA256, if an expected title or label is not on its
page, or if a row does not parse. Values are kept as printed; the CSVs use a
dot as the decimal separator.

Two kinds of national row:
- "text": read from the text layer by row_regex. The printed value must appear
  in the text of that page.
- "chart_label": hard-coded in CHART_LABELS. They are transcribed from a raster
  chart (LK 2023 Gambar 48), which is not in the text layer, so only the caption
  "Gambar 48" is checked there.
"""
import csv
import hashlib
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.dirname(HERE)
RAW_DIR = os.path.join(VIDEO_DIR, "raw")
OUT_NATIONAL = os.path.join(VIDEO_DIR, "re_national.csv")
OUT_PROVINCE = os.path.join(VIDEO_DIR, "re_province.csv")

LK23 = "content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf"
HEESI24 = "content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf"
HEESI25 = "content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf"

# sha256 of the raw files, as recorded in sources.md.
SHA256 = {
    LK23: "4372c7fe6bcca5273918fc554922c0ed7fc88fc728384bf6c9d2a19497b5e953",
    HEESI24: "fd4ca2f12d6d93296c3c26fab5ba4eeba0532f4dfb5a25d370e6816b6c2fec47",
    HEESI25: "7e4a75eb00b99208f3004b8b934b6cb304241699f6ffe97526f938c1738fdec2",
}

NATIONAL_HEADER = ["year", "ratio_pct", "source", "pdf_page", "locator", "method"]
PROVINCE_HEADER = ["province", "year", "re_pln", "re_non_pln", "re_ltshe", "re_total",
                   "source", "pdf_page", "locator"]

# Text-layer national rows. Group 1 of row_regex is the value as printed.
TEXT_SPECS = [
    {   # LK 2023 Tabel 61, printed page 167
        "year": "2023", "source": "LK 2023", "file": LK23,
        "pdf_page": 183, "title_pages": [183],
        "title_regex": r"Tabel 61\. Rasio Elektrifikasi Nasional Tahun 2023",
        "row_regex": r"Rasio Elektrifikasi Nasional\s+100%\s+(\d+,\d+)%",
        "locator": "Tabel 61",
    },
    {   # HEESI 2024: heading on PDF 9 (printed vii), ratio line on PDF 10 (printed viii)
        "year": "2024", "source": "HEESI 2024", "file": HEESI24,
        "pdf_page": 10, "title_pages": [9, 10],
        "title_regex": r"Concise Energy Profile 2024",
        "row_regex": r"ELECTRIFICATION RATIO 2024\s+(\d+\.\d+)\s*%",
        "locator": "Indonesia's Concise Energy Profile 2024, D",
    },
    {   # HEESI 2025: heading and ratio line on PDF 11 (printed xi)
        "year": "2025", "source": "HEESI 2025", "file": HEESI25,
        "pdf_page": 11, "title_pages": [11],
        "title_regex": r"Concise Energy Profile 2025",
        "row_regex": r"RATIO ELECTRIFICATION 2025\s+(\d+\.\d+)\s*%",
        "locator": "Indonesia's Concise Energy Profile 2025, D",
    },
]

# Gambar 48 in LK 2023, PDF page 174 (printed 158), bar chart titled "RE 2013 - 2022".
# The chart is a raster image, so these labels are not in the text layer. They were
# read by hand from a 300 dpi render (PRD-07b step 3: an independent read gave the
# same labels). Decimal comma as printed; converted to a dot in the CSV.
CHART_FILE = LK23
CHART_PAGE = 174
CHART_TEXT = "Gambar 48"
CHART_LOCATOR = "Gambar 48 (chart RE 2013 - 2022)"
CHART_LABELS = [
    (2013, "80,51"), (2014, "84,35"), (2015, "88,3"), (2016, "91,16"), (2017, "95,35"),
    (2018, "98,3"), (2019, "98,89"), (2020, "99,2"), (2021, "99,45"), (2022, "99,63"),
]

# Tabel 58 in LK 2023, provinces, Triwulan IV 2023. NO 1-35 are on PDF 173 and
# NO 36-38 plus the TOTAL row are on PDF 174.
TABEL58_FILE = LK23
TABEL58_PAGES = [173, 174]
TABEL58_TITLE = "Tabel 58. Sebaran Rasio Elektrifikasi per Provinsi pada Triwulan IV"
TABEL58_LOCATOR = "Tabel 58 (Triwulan IV 2023)"
TABEL58_TOTAL_EXPECTED = ["98,33", "1,05", "0,41", "99,79"]
VAL = r"(\d{1,3},\d{2}|-)"
VALUES_RE = re.compile(r"^(?P<head>.*?)\s+" + VAL + r"\s+" + VAL + r"\s+" + VAL + r"\s+" + VAL + r"\s*$")
HEAD_RE = re.compile(r"^(\d{1,2}|TOTAL)?\s*(.*)$")


def fail(msg):
    sys.exit("FAIL: " + msg)


def check_sha256(name):
    path = os.path.join(RAW_DIR, name)
    if not os.path.isfile(path):
        fail("missing raw file %s" % path)
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    if h.hexdigest() != SHA256[name]:
        fail("sha256 of %s is %s, expected %s" % (name, h.hexdigest(), SHA256[name]))


def page_text(name, page):
    path = os.path.join(RAW_DIR, name)
    cmd = ["pdftotext", "-layout", "-f", str(page), "-l", str(page), path, "-"]
    res = subprocess.run(cmd, capture_output=True, check=False)
    if res.returncode != 0:
        fail("pdftotext exit %d for %s page %d" % (res.returncode, name, page))
    return res.stdout.decode("utf-8")


def to_dot(printed):
    return printed.replace(",", ".")


def cell(printed):
    return "" if printed == "-" else to_dot(printed)


def hundredths(printed):
    return 0 if printed == "-" else int(printed.replace(",", ""))


def build_national():
    rows = []
    text_rows = 0
    text_matched = 0
    for spec in TEXT_SPECS:
        check_sha256(spec["file"])
        title = " ".join(page_text(spec["file"], p) for p in spec["title_pages"])
        if not re.search(spec["title_regex"], title):
            fail("%r not on %s page(s) %s" % (spec["title_regex"], spec["file"], spec["title_pages"]))
        text = page_text(spec["file"], spec["pdf_page"])
        found = re.findall(spec["row_regex"], text)
        if len(found) != 1:
            fail("%r found %d times on %s page %d" % (spec["row_regex"], len(found), spec["file"], spec["pdf_page"]))
        value = found[0]
        text_rows += 1
        if value in text:
            text_matched += 1
        else:
            fail("printed value %r not in page text of %s page %d" % (value, spec["file"], spec["pdf_page"]))
        rows.append({"year": spec["year"], "ratio_pct": to_dot(value), "source": spec["source"],
                     "pdf_page": spec["pdf_page"], "locator": spec["locator"], "method": "text"})

    check_sha256(CHART_FILE)
    if CHART_TEXT not in page_text(CHART_FILE, CHART_PAGE):
        fail("%r not on %s page %d" % (CHART_TEXT, CHART_FILE, CHART_PAGE))
    for year, printed in CHART_LABELS:
        rows.append({"year": str(year), "ratio_pct": to_dot(printed), "source": "LK 2023",
                     "pdf_page": CHART_PAGE, "locator": CHART_LOCATOR, "method": "chart_label"})

    rows.sort(key=lambda r: int(r["year"]))
    years = [int(r["year"]) for r in rows]
    if years != list(range(2013, 2026)):
        fail("years are %r, expected 2013-2025 with no gaps" % years)
    return rows, text_matched, text_rows


def parse_tabel58():
    check_sha256(TABEL58_FILE)
    pages = {n: page_text(TABEL58_FILE, n) for n in TABEL58_PAGES}
    if TABEL58_TITLE not in pages[TABEL58_PAGES[0]]:
        fail("%r not on %s page %d" % (TABEL58_TITLE, TABEL58_FILE, TABEL58_PAGES[0]))
    rows, total = [], None
    pending, open_row = "", None
    for n in TABEL58_PAGES:
        if total is not None:
            break
        in_table = False
        for line in pages[n].split("\n"):
            s = line.strip()
            if not s:
                continue
            if re.match(r"NO\s+PROVINSI", s):
                in_table = True
                continue
            if not in_table:
                continue
            m = VALUES_RE.match(line.rstrip())
            if m is None:
                # Name-only line: the second line of a wrapped name, or a header or footer line.
                if open_row is not None:
                    open_row["province"] += " " + s
                    open_row = None
                else:
                    pending = s
                continue
            head = HEAD_RE.match(m.group("head").strip())
            no, name = head.group(1), head.group(2).strip()
            vals = [m.group(i) for i in (2, 3, 4, 5)]
            if no == "TOTAL":
                total = vals
                break
            if no is None:
                fail("values line without NO on %s page %d: %r" % (TABEL58_FILE, n, line))
            incomplete = name == ""
            if incomplete:
                name = pending
            if not name:
                fail("no province name for NO %s on %s page %d" % (no, TABEL58_FILE, n))
            row = {"no": int(no), "province": name, "vals": vals, "pdf_page": n}
            rows.append(row)
            pending = ""
            open_row = row if incomplete else None
    if total is None:
        fail("TOTAL row not found in %s" % TABEL58_FILE)
    nos = [r["no"] for r in rows]
    if nos != list(range(1, 39)):
        fail("expected NO 1..38, got %r" % nos)
    if total != TABEL58_TOTAL_EXPECTED:
        fail("TOTAL row reads %r, expected %r" % (total, TABEL58_TOTAL_EXPECTED))
    return rows, total, pages


def build_province():
    rows, total, pages = parse_tabel58()
    out = []
    matched = 0
    max_diff, max_name, over = 0, "", []
    for r in rows:
        pln, non_pln, ltshe, tot = r["vals"]
        if not all(v == "-" or v in pages[r["pdf_page"]] for v in r["vals"]):
            fail("printed values of NO %d not in page text" % r["no"])
        matched += 1
        diff = hundredths(pln) + hundredths(non_pln) + hundredths(ltshe) - hundredths(tot)
        if abs(diff) > max_diff:
            max_diff, max_name = abs(diff), r["province"]
        if abs(diff) > 2:
            over.append("%s: %+.2f" % (r["province"], diff / 100.0))
        out.append({"province": r["province"], "year": "2023", "re_pln": cell(pln),
                    "re_non_pln": cell(non_pln), "re_ltshe": cell(ltshe), "re_total": cell(tot),
                    "source": "LK 2023", "pdf_page": r["pdf_page"], "locator": TABEL58_LOCATOR})
    stats = {"rows": len(rows), "total": total, "max_diff": max_diff / 100.0,
             "max_name": max_name, "over": over}
    return out, matched, stats


def write_csv(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(header)
        for r in rows:
            writer.writerow([r[h] for h in header])


def main():
    national, text_matched, text_rows = build_national()
    province, prov_matched, stats = build_province()
    write_csv(OUT_NATIONAL, NATIONAL_HEADER, national)
    write_csv(OUT_PROVINCE, PROVINCE_HEADER, province)

    chart_rows = sum(1 for r in national if r["method"] == "chart_label")
    print("wrote %s (%d rows)" % (OUT_NATIONAL, len(national)))
    print("national: matched %d/%d text rows (printed value in pdftotext -layout text of its page); "
          "chart_label rows %d (raster; 'Gambar 48' found on PDF page %d)"
          % (text_matched, text_rows, chart_rows, CHART_PAGE))
    print("wrote %s (%d rows)" % (OUT_PROVINCE, len(province)))
    print("province: %d rows parsed (NO 1..38) from Tabel 58; TOTAL row not written, check passed: "
          "RE PLN %s / RE Non PLN %s / RE LTSHE %s / RE TOTAL %s"
          % (stats["rows"], TABEL58_TOTAL_EXPECTED[0], TABEL58_TOTAL_EXPECTED[1],
             TABEL58_TOTAL_EXPECTED[2], TABEL58_TOTAL_EXPECTED[3]))
    print("province: matched %d/%d rows (all printed values in pdftotext -layout text of their page)"
          % (prov_matched, len(province)))
    print("province: largest |PLN + Non PLN + LTSHE - TOTAL| = %.2f (%s)" % (stats["max_diff"], stats["max_name"]))
    print("province: rows above 0.02: %s" % (", ".join(stats["over"]) if stats["over"] else "none"))


if __name__ == "__main__":
    main()
