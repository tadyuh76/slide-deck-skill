#!/bin/zsh
# release.sh — builds the delivery into release/:
#   single-file HTML deck → Deck/                      (built on this Mac, see tools/build.sh)
#   slide pieces → native PPTX (editable text, speaker notes, living title background), re-saved by PowerPoint
#   with its fonts embedded; slide images → PDF; speaker script PDF.
set -e
root=${0:A:h:h}
cd $root
rel=$root/release
NAME=$(cat tools/deck-name.txt)
rm -rf $rel tmp/export && mkdir -p $rel

# 1. the build half runs on a lean copy of the project in tmp/stage, into tmp/stage/out
stage=$root/tmp/stage
mkdir -p $stage/fonts
rsync -a --delete --exclude node_modules --exclude dist deck $stage/
mkdir -p $stage/deck/public/media
rsync -a --delete tools $stage/
rsync -a --delete fonts/static $stage/fonts/
n=$(grep -o "^const ALL.*" deck/src/slides/index.ts | tr ',' '\n' | wc -l | tr -d ' ')
echo "1 $n" > $stage/loops.txt
rm -rf $stage/out
ln -sfn "$(readlink -f $root/deck/node_modules)" $stage/deck/node_modules
(cd $stage && bash tools/build.sh)
cp -R $stage/out/export tmp/export
rm -rf tmp/lo && cp -R $stage/out/lo tmp/lo 2>/dev/null || true
mkdir -p $rel/Deck && cp -R $stage/out/dist/. $rel/Deck/
cp $stage/out/release/$NAME.pptx $rel/$NAME.pptx
cp $stage/out/release/$NAME.pdf $rel/$NAME.pdf

# 2. PowerPoint itself re-saves the deck so the fonts travel inside it. PowerPoint is shared on this Mac: one
#    re-save at a time (lock folder), and it is restarted so it sees newly installed fonts.
until mkdir /tmp/slide-deck-ppt.lock 2>/dev/null; do sleep 5; done
trap 'rmdir /tmp/slide-deck-ppt.lock 2>/dev/null' EXIT
for f in fonts/static/*.ttf; do cmp -s $f ~/Library/Fonts/deck-${f:t} || cp $f ~/Library/Fonts/deck-${f:t}; done
tools/ppt_resave.sh $rel/$NAME.pptx >/dev/null
rmdir /tmp/slide-deck-ppt.lock 2>/dev/null; trap - EXIT
(cd deck && node script-doc.mjs ../tmp/export ../release/Kich-ban-trinh-bay.pdf >/dev/null)
rm -f release/Kich-ban-trinh-bay.html tmp/export/*.thumb.jpg
du -sh $rel; ls -la $rel
