#!/usr/bin/env python3
"""Extract the BPS XLSX tables in research/video-03/raw/ into three CSV files.

Run from the repo root:  python3 -I research/video-03/tools/extract.py
Reads only raw/. Writes tpt_age.csv, neet_province.csv and tpt_province.csv
into research/video-03/. Values are the str() of the cell value, unchanged.
"""
import csv
import os

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.dirname(HERE)
RAW_DIR = os.path.join(VIDEO_DIR, "raw")

FILE_TPT_AGE = "Tingkat_Pengangguran_Terbuka_Berdasarkan_Kelompok_Umur_2025.xlsx"
FILE_NEET = ("Persentase_Usia_Muda_15-24_Tahun_Yang_Sedang_Tidak_Sekolah_"
             "Bekerja_Atau_Mengikuti_Pelatihan_2025.xlsx")
FILE_TPT_PROV = "Tingkat_Pengangguran_Terbuka_Menurut_Provinsi_2026.xlsx"

TITLE_TPT_AGE = "Tingkat Pengangguran Terbuka Berdasarkan Kelompok Umur"
TITLE_NEET = ("Persentase Usia Muda (15-24 Tahun) Yang Sedang Tidak Sekolah, "
              "Bekerja Atau Mengikuti Pelatihan")
TITLE_TPT_PROV = "Tingkat Pengangguran Terbuka Menurut Provinsi"

AGE_GROUPS = ["15-19", "20-24", "25-29", "30-34", "35-39", "40-44",
              "45-49", "50-54", "55-59", "60 keatas", "Rata-Rata"]
NATIONAL = "INDONESIA"
N_PROVINCES = 38
MISSING_MARKERS = ("-", "")
PERIOD_NOT_STATED = "not stated"


def open_sheet(file_name):
    path = os.path.join(RAW_DIR, file_name)
    wb = openpyxl.load_workbook(path, data_only=True)
    if len(wb.worksheets) != 1:
        raise ValueError(f"{file_name}: expected 1 sheet, found {len(wb.worksheets)}")
    return wb.worksheets[0]


def cell_str(value):
    """Python str() of the cell value; None stays None."""
    if value is None:
        return None
    return str(value)


def is_missing(text):
    return text is None or text.strip() in MISSING_MARKERS


def check_title_and_year(ws, file_name, title, year):
    title_text = cell_str(ws["B2"].value)
    if title_text is None or title not in title_text:
        raise ValueError(f"{file_name}: title cell B2 is {title_text!r}, expected to contain {title!r}")
    year_text = cell_str(ws["B3"].value)
    if year_text != year:
        raise ValueError(f"{file_name}: year cell B3 is {year_text!r}, expected {year!r}")


def read_tpt_age():
    ws = open_sheet(FILE_TPT_AGE)
    check_title_and_year(ws, FILE_TPT_AGE, TITLE_TPT_AGE, "2025")
    rows = []
    for r in range(4, ws.max_row + 1):
        label = cell_str(ws.cell(r, 1).value)
        value = cell_str(ws.cell(r, 2).value)
        if label is None and value is None:
            continue
        if label not in AGE_GROUPS:
            raise ValueError(f"{FILE_TPT_AGE}: unexpected row {r} label {label!r}")
        rows.append((label, value))
    labels = [label for label, _ in rows]
    for group in AGE_GROUPS:
        if labels.count(group) != 1:
            raise ValueError(f"{FILE_TPT_AGE}: age group {group!r} found {labels.count(group)} times")
    out = []
    for label, value in rows:
        if is_missing(value):
            raise ValueError(f"{FILE_TPT_AGE}: missing value for {label!r}")
        float(value)  # fails loudly on non-numeric text
        out.append(("2025", PERIOD_NOT_STATED, label, value, FILE_TPT_AGE))
    return out


def read_provinces(ws, file_name, first_row, value_col):
    rows = []
    for r in range(first_row, ws.max_row + 1):
        label = cell_str(ws.cell(r, 1).value)
        value = cell_str(ws.cell(r, value_col).value)
        if label is None and value is None:
            continue
        rows.append((label, value))
    provinces = [row for row in rows if row[0] != NATIONAL]
    national = [row for row in rows if row[0] == NATIONAL]
    if len(provinces) != N_PROVINCES or len(national) != 1:
        raise ValueError(f"{file_name}: expected {N_PROVINCES} province rows and 1 {NATIONAL} row, "
                         f"found {len(provinces)} and {len(national)}")
    names = [name for name, _ in rows]
    if len(set(names)) != len(names):
        raise ValueError(f"{file_name}: duplicate row labels")
    return rows


def read_neet():
    ws = open_sheet(FILE_NEET)
    check_title_and_year(ws, FILE_NEET, TITLE_NEET, "2025")
    rows = read_provinces(ws, FILE_NEET, first_row=4, value_col=2)
    out = []
    for name, value in rows:
        if is_missing(value):
            raise ValueError(f"{FILE_NEET}: missing value for {name!r}")
        float(value)
        out.append((name, "2025", PERIOD_NOT_STATED, value,
                    "1" if name == NATIONAL else "0", FILE_NEET))
    return out


def read_tpt_province():
    ws = open_sheet(FILE_TPT_PROV)
    check_title_and_year(ws, FILE_TPT_PROV, TITLE_TPT_PROV, "2026")
    period = cell_str(ws["B4"].value)
    if period != "Februari":
        raise ValueError(f"{FILE_TPT_PROV}: column B header is {period!r}, expected 'Februari'")
    rows = read_provinces(ws, FILE_TPT_PROV, first_row=5, value_col=2)
    out = []
    for name, value in rows:
        if is_missing(value):
            # Februari is the only column used; a missing cell is written empty, not guessed.
            out.append((name, "2026", period, "", "1" if name == NATIONAL else "0", FILE_TPT_PROV))
            continue
        float(value)
        out.append((name, "2026", period, value, "1" if name == NATIONAL else "0", FILE_TPT_PROV))
    return out


def write_csv(file_name, header, rows):
    path = os.path.join(VIDEO_DIR, file_name)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)
    return path, len(rows)


def main():
    tpt_age = read_tpt_age()
    neet = read_neet()
    tpt_prov = read_tpt_province()

    outputs = [
        write_csv("tpt_age.csv",
                  ["year", "period", "age_group", "tpt_pct", "source_file"],
                  tpt_age),
        write_csv("neet_province.csv",
                  ["province", "year", "period", "neet_pct", "is_national", "source_file"],
                  neet),
        write_csv("tpt_province.csv",
                  ["province", "year", "period", "tpt_pct", "is_national", "source_file"],
                  tpt_prov),
    ]
    for path, n in outputs:
        print(f"wrote {path} rows={n}")


if __name__ == "__main__":
    main()
