#!/usr/bin/env bash
# Re-download the video-02 raw PDFs (git-ignored; see ../sources.md) and verify their sha256.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p raw
while read -r sha url; do
  f="raw/$(basename "$url")"
  [ -f "$f" ] || curl -sS -L --fail -o "$f" "$url"
  echo "$sha  $f" | sha256sum -c -
done <<'EOF'
7e4a75eb00b99208f3004b8b934b6cb304241699f6ffe97526f938c1738fdec2 https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf
fd4ca2f12d6d93296c3c26fab5ba4eeba0532f4dfb5a25d370e6816b6c2fec47 https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf
4372c7fe6bcca5273918fc554922c0ed7fc88fc728384bf6c9d2a19497b5e953 https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2023.pdf
c5d87cabd111a997662cca777a60276c141bafecc8c0518b2cf30dfdc08e9550 https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2025.pdf
EOF
