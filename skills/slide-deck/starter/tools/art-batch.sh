#!/bin/bash
# art-batch.sh [list.tsv] — generates every missing illustration in the list (name<TAB>concept), 3 at a time.
cd "$(dirname "$0")/.."
list=${1:-tools/art-list.tsv}
while IFS=$'\t' read -r name concept; do
  [[ -z $name || -f assets/gen/$name.png ]] && continue
  printf '%s\t%s\n' "$name" "$concept"
done < "$list" | while IFS=$'\t' read -r name concept; do
  while (( $(jobs -rp | wc -l) >= ${P:-3} )); do sleep 2; done
  node tools/art.mjs "$name" "$concept" &
  sleep 3
done
wait
echo ALL DONE
