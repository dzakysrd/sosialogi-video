#!/usr/bin/env python3
"""Merge the BPS average net wage table (Feb 2026, column "Total") into research/data.csv.

Source: research/bps_upah_feb2026.csv (untouched copy of the file the user downloaded from bps.go.id).
Target: research/data.csv. UMP columns are kept as they are; every avg_wage* column, gap and ratio is
recomputed from the BPS file. Re-runnable: running it twice gives the same bytes.

Fails loudly (exit 1, data.csv not written) if a province name does not map, a value is missing, the
table layout is not what this script expects, or the planner's reference numbers do not reproduce.

Run: python3 research/tools/merge.py
"""
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # research/
BPS = ROOT / "bps_upah_feb2026.csv"
DATA = ROOT / "data.csv"
COL = 25                                             # CSV index of "Total" / "February"
SOURCE = ("BPS, tabel Rata-rata Upah/Gaji Bersih Sebulan Buruh/Karyawan/Pegawai menurut Provinsi dan "
          "Jenis Pekerjaan Utama (kolom Total, Feb 2026); file diunduh pengguna dari bps.go.id")
PERIOD = "Februari 2026"
NOTE_BASE = "UMP: unverified-media (detik+kompas.tv, keduanya mengutip Instagram Kemnaker 5 Jan 2026)."

# BPS upper-case name -> province name used in data.csv (and in the map shapes).
NAME_MAP = {
    "ACEH": "Aceh", "SUMATERA UTARA": "Sumatera Utara", "SUMATERA BARAT": "Sumatera Barat",
    "RIAU": "Riau", "JAMBI": "Jambi", "SUMATERA SELATAN": "Sumatera Selatan", "BENGKULU": "Bengkulu",
    "LAMPUNG": "Lampung", "KEP. BANGKA BELITUNG": "Kepulauan Bangka Belitung", "KEP. RIAU": "Kepulauan Riau",
    "DKI JAKARTA": "DKI Jakarta", "JAWA BARAT": "Jawa Barat", "JAWA TENGAH": "Jawa Tengah",
    "DI YOGYAKARTA": "DI Yogyakarta", "JAWA TIMUR": "Jawa Timur", "BANTEN": "Banten", "BALI": "Bali",
    "NUSA TENGGARA BARAT": "Nusa Tenggara Barat", "NUSA TENGGARA TIMUR": "Nusa Tenggara Timur",
    "KALIMANTAN BARAT": "Kalimantan Barat", "KALIMANTAN TENGAH": "Kalimantan Tengah",
    "KALIMANTAN SELATAN": "Kalimantan Selatan", "KALIMANTAN TIMUR": "Kalimantan Timur",
    "KALIMANTAN UTARA": "Kalimantan Utara", "SULAWESI UTARA": "Sulawesi Utara",
    "SULAWESI TENGAH": "Sulawesi Tengah", "SULAWESI SELATAN": "Sulawesi Selatan",
    "SULAWESI TENGGARA": "Sulawesi Tenggara", "GORONTALO": "Gorontalo", "SULAWESI BARAT": "Sulawesi Barat",
    "MALUKU": "Maluku", "MALUKU UTARA": "Maluku Utara", "PAPUA BARAT": "Papua Barat",
    "PAPUA BARAT DAYA": "Papua Barat Daya", "PAPUA": "Papua", "PAPUA SELATAN": "Papua Selatan",
    "PAPUA TENGAH": "Papua Tengah", "PAPUA PEGUNUNGAN": "Papua Pegunungan",
}

# Planner's own check of this merge (PRD). If these do not reproduce, stop and report.
PLANNER = {
    "below_ump_count": 24,
    "total": 38,
    "lowest_ratio": ("Aceh", 0.69, 3932552, 2708851),
    "jakarta": ("DKI Jakarta", 0.91, 5729876, 5229472),
    "highest_ratio": ("Jawa Barat", 1.60, 2317601, 3712133),
}


def die(msg):
    print(f"merge: FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def read_bps():
    rows = list(csv.reader(BPS.open(encoding="utf-8-sig", newline="")))
    if rows[2][COL] != "Total" or rows[4][COL] != "February" or rows[3][COL] != "2026":
        die(f"BPS header at column {COL} is not Total / 2026 / February")
    out, mean = {}, None
    for r in rows[5:]:
        name = r[0].strip()
        if not name:
            continue
        val = r[COL].strip()
        if name == "MEAN":
            mean = int(val)
            continue
        if name not in NAME_MAP:
            die(f"unmapped BPS province name: {name!r}")
        if not re.fullmatch(r"\d+", val):
            die(f"{name}: Total February is not a whole number: {val!r}")
        out[NAME_MAP[name]] = int(val)
    if len(out) != 38:
        die(f"expected 38 provinces in BPS file, found {len(out)}")
    if mean is None:
        die("MEAN row not found")
    return out, mean


def read_data():
    with DATA.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    names = [r["province"] for r in rows]
    if len(rows) != 38 or len(set(names)) != 38:
        die(f"data.csv has {len(rows)} rows, expected 38 unique provinces")
    for r in rows:
        if not re.fullmatch(r"\d+(\.\d+)?", r["ump_2026"]):
            die(f"{r['province']}: ump_2026 is not numeric: {r['ump_2026']!r}")
    return rows


def main():
    bps, bps_mean = read_bps()
    rows = read_data()
    missing = [r["province"] for r in rows if r["province"] not in bps]
    extra = sorted(set(bps) - {r["province"] for r in rows})
    if missing or extra:
        die(f"province mismatch: missing in BPS {missing}, extra in BPS {extra}")

    out_rows = []
    for r in rows:
        p = r["province"]
        ump = float(r["ump_2026"])
        avg = bps[p]
        gap = avg - ump
        ratio = round(avg / ump, 3)
        note = NOTE_BASE + " Upah rata-rata: BPS Feb 2026 kolom Total."
        if "." in r["ump_2026"]:
            note += f" UMP tercatat dengan desimal ({r['ump_2026']}) di sumber media; cek ulang ke Kemnaker."
        out_rows.append({
            "province": p,
            "ump_2026": r["ump_2026"],
            "ump_source_url": r["ump_source_url"],
            "avg_wage": str(avg),
            "avg_wage_period": PERIOD,
            "avg_wage_source": SOURCE,
            "gap": str(round(gap)),
            "ratio": f"{ratio:.3f}",
            "notes": note,
        })

    # Planner reproduction check (computed from the merged rows, before writing).
    by = {r["province"]: r for r in out_rows}
    below = [p for p, r in by.items() if float(r["avg_wage"]) < float(r["ump_2026"])]
    ratios = sorted(((float(r["ratio"]), p) for p, r in by.items()))
    checks = [
        ("below UMP count", len(below), PLANNER["below_ump_count"]),
        ("provinces", len(out_rows), PLANNER["total"]),
    ]
    lo_name, lo_ratio, lo_ump, lo_avg = PLANNER["lowest_ratio"]
    checks += [("lowest ratio province", ratios[0][1], lo_name),
               ("lowest ratio", round(ratios[0][0], 2), lo_ratio)]
    jk_name, jk_ratio, jk_ump, jk_avg = PLANNER["jakarta"]
    checks += [("Jakarta ratio", round(float(by[jk_name]["ratio"]), 2), jk_ratio),
               ("Jakarta UMP", int(float(by[jk_name]["ump_2026"])), jk_ump),
               ("Jakarta avg", int(by[jk_name]["avg_wage"]), jk_avg)]
    hi_name, hi_ratio, hi_ump, hi_avg = PLANNER["highest_ratio"]
    checks += [("highest ratio province", ratios[-1][1], hi_name),
               ("highest ratio", round(ratios[-1][0], 2), hi_ratio),
               ("Jawa Barat UMP", int(float(by[hi_name]["ump_2026"])), hi_ump),
               ("Jawa Barat avg", int(by[hi_name]["avg_wage"]), hi_avg)]
    lo_ump_v, lo_avg_v = int(float(by[lo_name]["ump_2026"])), int(by[lo_name]["avg_wage"])
    checks += [("Aceh UMP", lo_ump_v, lo_ump), ("Aceh avg", lo_avg_v, lo_avg)]
    bad = [(n, got, want) for n, got, want in checks if got != want]
    print("planner check:")
    for n, got, want in checks:
        print(f"  {'ok ' if got == want else 'BAD'} {n}: got {got}, planner {want}")
    if bad:
        die(f"planner numbers do not reproduce: {bad}")

    fields = ["province", "ump_2026", "ump_source_url", "avg_wage", "avg_wage_period", "avg_wage_source",
              "gap", "ratio", "notes"]
    with DATA.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(out_rows)

    mean_unweighted = round(sum(bps.values()) / len(bps))
    print(f"merge: wrote {DATA.name}: {len(out_rows)} provinces, {len(below)} below UMP")
    print(f"merge: BPS MEAN row {bps_mean}; unweighted mean of the 38 values {mean_unweighted}")


if __name__ == "__main__":
    main()
