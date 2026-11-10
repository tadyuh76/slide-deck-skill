#!/bin/bash
# build.sh — the build half of the release, run by tools/release.sh on this Mac from a lean copy of the project
# (tmp/stage): builds the deck, takes every slide apart into PowerPoint pieces, renders the slide images, records the
# title background loop and assembles the PowerPoint and PDF. Everything lands in out/.
set -euo pipefail
cd deck
npx vite build >/dev/null
rm -rf ../out && mkdir -p ../out/release
loops=$(cat ../loops.txt)
node export.mjs ../out/export >../out/export.log 2>&1 & a=$!
node pptx-extract.mjs ../out/pieces >../out/extract.log 2>&1 & b=$!
node capture.mjs ../out/loops $loops >../out/capture.log 2>&1 & c=$!
wait $a && wait $b && wait $c || { tail -20 ../out/*.log; exit 1; }
cd ..
docker build -q -t deck-pack -f tools/Dockerfile tools >/dev/null
docker run --rm -v "$PWD":/w -w /w deck-pack python tools/package.py out/pieces out/export out/loops deck/public/media out/release
# check render: the PowerPoint file laid out by LibreOffice, one small PNG per slide, in out/lo
docker build -q -t deck-lo -f tools/Dockerfile.lo tools >/dev/null
docker run --rm -v "$PWD":/w -w /w deck-lo bash -c 'cp fonts/static/*.ttf /usr/share/fonts/ && fc-cache -f >/dev/null && mkdir -p out/lo && timeout 600 soffice --headless --norestore --convert-to pdf --outdir out/lo out/release/*.pptx >/dev/null 2>&1; pdftoppm -r 48 -png out/lo/*.pdf out/lo/p && rm -f out/lo/*.pdf' || true
cp out/pieces/pptx.json out/pptx.json
rm -rf out/pieces out/loops
cp -R deck/dist out/dist
