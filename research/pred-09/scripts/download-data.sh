#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAASTAV="$ROOT/data/vaastav"
FDATA="$ROOT/data/football-data"

VAASTAV_BASE="https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data"

SEASONS=(
  2019-20 2020-21 2021-22 2022-23 2023-24 2024-25 2025-26
)

FDATA_SEASONS=(
  1920 2021 2122 2223 2324 2425
)

mkdir -p "$VAASTAV" "$FDATA"

echo "Downloading vaastav master_team_list.csv"
curl -fsSL "$VAASTAV_BASE/master_team_list.csv" -o "$VAASTAV/master_team_list.csv"

for s in "${SEASONS[@]}"; do
  dir="$VAASTAV/$s/gws"
  mkdir -p "$dir"
  out="$dir/merged_gw.csv"
  echo "vaastav: $s merged_gw.csv"
  curl -fsSL "$VAASTAV_BASE/$s/gws/merged_gw.csv" -o "$out"
  players="$VAASTAV/$s/players_raw.csv"
  echo "vaastav: $s players_raw.csv"
  curl -fsSL "$VAASTAV_BASE/$s/players_raw.csv" -o "$players"
done

for code in "${FDATA_SEASONS[@]}"; do
  out="$FDATA/E0_${code}.csv"
  echo "football-data: E0 ${code}"
  curl -fsSL "https://www.football-data.co.uk/mmz4281/${code}/E0.csv" -o "$out"
done

echo "Done. Files under $ROOT/data/"
