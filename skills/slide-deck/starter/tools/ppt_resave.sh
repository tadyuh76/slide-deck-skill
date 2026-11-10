#!/bin/zsh
# ppt_resave.sh <deck.pptx> [out.pdf] — opens the deck in Microsoft PowerPoint and saves it through PowerPoint's own
# scripting, so the file is written by PowerPoint itself with the deck's fonts embedded (the deck asks for whole-font
# embedding). Needs no accessibility access: PowerPoint is driven directly, never through System Events.
# With a second argument it also renders the deck to PDF through PowerPoint, for checking. PowerPoint is sandboxed: the
# PDF goes into Office's shared folder and Finder copies it out; paths go to PowerPoint as text, so this script needs
# no extra access.
set -e
in=${1:A}; pdf=${2:+${2:A}}; name=${in:t}
before=$(stat -f %m "$in")
media_in=$(unzip -l "$in" | awk '/ppt\/media\/media[0-9]+\.mp4/ {print $1}' | sort -n | tr '\n' ' ')
# start from a fresh PowerPoint: an earlier session can hand back a stale copy of a deck with the same name
osascript -e 'tell application "Microsoft PowerPoint" to quit saving no' >/dev/null 2>&1 || true
while pgrep -x "Microsoft PowerPoint" >/dev/null; do sleep 1; done
open -a "Microsoft PowerPoint" "$in"
for i in {1..180}; do
  osascript -e 'with timeout of 5 seconds
tell application "Microsoft PowerPoint" to get name of every presentation
end timeout' 2>/dev/null | grep -qF "$name" && break
  sleep 1
done
# a deck PowerPoint wants to repair never opens: that is a broken build
(( i < 180 )) || { echo "PowerPoint did not open $name (a repair prompt means the build is broken)" >&2; exit 1; }
# PowerPoint's scripted save writes only a changed presentation: add and remove a blank slide, then save
osascript -e 'with timeout of 900 seconds
tell application "Microsoft PowerPoint"
  set p to presentation "'"$name"'"
  delete (make new slide at end of p with properties {layout:slide layout blank})
  save p
end tell
end timeout' >/dev/null
until [[ $(stat -f %m "$in") != $before ]] && osascript -e 'with timeout of 900 seconds
tell application "Microsoft PowerPoint" to get saved of presentation "'"$name"'"
end timeout' 2>/dev/null | grep -q true; do sleep 2; done
if [[ -n $pdf ]]; then
  tag=render-$$-$RANDOM.pdf
  osascript -e 'with timeout of 900 seconds
tell application "Microsoft PowerPoint" to save presentation "'"$name"'" in ((path to startup disk as text) & "Users:'"$USER"':Library:Group Containers:UBF8T346G9.Office:'"$tag"'") as save as PDF
end timeout' >/dev/null
  tmpd=$(mktemp -d)
  osascript -e 'tell application "Finder"
  set f to item "'"$tag"'" of folder "UBF8T346G9.Office" of folder "Group Containers" of folder "Library" of home
  duplicate f to (POSIX file "'"$tmpd"'" as alias) with replacing
  delete f
end tell' >/dev/null
  mv "$tmpd/$tag" "$pdf"; rm -rf "$tmpd"
fi
osascript -e 'tell application "Microsoft PowerPoint" to close presentation "'"$name"'" saving no' >/dev/null
while osascript -e 'tell application "Microsoft PowerPoint" to get name of every presentation' 2>/dev/null | grep -qF "$name"; do sleep 1; done
rm -f "${in:h}/~\$$name"  # PowerPoint's lock file
media_out=$(unzip -l "$in" | awk '/ppt\/media\/media[0-9]+\.mp4/ {print $1}' | sort -n | tr '\n' ' ')
[[ $media_in == $media_out ]] || { echo "PowerPoint saved different videos than it was given ($media_in vs $media_out)" >&2; exit 1; }
echo "$in${pdf:+ $pdf}"
