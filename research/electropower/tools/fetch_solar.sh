#!/usr/bin/env bash
# Re-downloads the NASA POWER climatology raw file for Jakarta (PRD-19b step 1).
# Exits non-zero on any failure. Global Solar Atlas (step 2) could not be reached, so it is not fetched here.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW="$HERE/../raw"
OUT="$RAW/nasa_power_climatology_jakarta.json"
URL="https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF&community=RE&longitude=106.85&latitude=-6.2&format=JSON"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -sS --fail --max-time 120 -o "$TMP" "$URL"

# Sanity check: must be JSON with the three parameters and an ANN value.
python3 -I -c '
import json, sys
d = json.load(open(sys.argv[1]))
p = d["properties"]["parameter"]
for k in ("ALLSKY_SFC_SW_DWN", "ALLSKY_SFC_SW_DNI", "ALLSKY_SFC_SW_DIFF"):
    assert "ANN" in p[k], k
' "$TMP"

mkdir -p "$RAW"
mv "$TMP" "$OUT"
trap - EXIT
echo "wrote $OUT"
sha256sum "$OUT"
