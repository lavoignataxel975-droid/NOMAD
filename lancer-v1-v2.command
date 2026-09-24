#!/bin/bash
# Lance V1 (port 3000) et V2 (port 3001) en même temps, puis ouvre les deux onglets.
# Double-cliquer ce fichier dans le Finder, ou : ./lancer-v1-v2.command
cd "$(dirname "$0")"
python3 -m http.server 3000 --bind 127.0.0.1 -d . >/dev/null 2>&1 &
V1=$!
python3 -m http.server 3001 --bind 127.0.0.1 -d v2 >/dev/null 2>&1 &
V2=$!
trap 'kill $V1 $V2 2>/dev/null' EXIT INT TERM
sleep 1
open "http://localhost:3000"
open "http://localhost:3001"
echo "V1 → http://localhost:3000   (site actuel)"
echo "V2 → http://localhost:3001   (version expérimentale)"
echo "Ctrl+C pour arrêter les deux."
wait
