#!/bin/bash
# Lance le site NOMAD avec le Click & Collect et le back-office (port 3000),
# puis ouvre le Click & Collect et le back-office dans le navigateur.
# Double-cliquer ce fichier dans le Finder, ou : ./lancer-commandes.command
cd "$(dirname "$0")"
node server/server.js &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT INT TERM
sleep 1
open "http://localhost:3000/click-and-collect.html"
open "http://localhost:3000/admin/orders"
echo "Ctrl+C pour arrêter."
wait
