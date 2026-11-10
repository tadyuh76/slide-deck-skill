---
name: slide-deck
description: Builds premium talk decks in code - a 1920x1080 deck with custom pseudo-3D Codex illustrations in one colour family, minimal plain-language text, a different composition on every slide, and an editable PowerPoint, PDF and speaker script as output. Use when someone asks to make, redesign, translate or extend a slide deck, presentation, PPTX or talk for an event, or gives feedback on one ("too similar", "text jumps", "should have graphics"), especially for Vietnamese, non-technical or official audiences.
---

# Slide deck

A deck here is a small React project that renders 1920x1080 slides, plus a pipeline that turns them into a native PowerPoint (editable text, speaker notes), a PDF and a speaker script. `starter/` is a complete working deck (12 sample slides in Vietnamese, blue theme, one example of each composition). Copy it, replace the content, keep the system.

Read the brief for three things before anything else: who is in the room (assume no prior knowledge unless told), how long the slot is, and what the speaker's own outline says. The speaker's outline decides order and content. Your job is clarity and looks, not new claims.

## 1. Start

```bash
cp -R "<this skill folder>/starter" "<project>/<deck-name>"
cd "<project>/<deck-name>/deck" && npm install && npx playwright install chromium
npx vite                                                # dev server, port in vite.config.ts
```

Then set the names: `tools/deck-name.txt` (file name of the PPTX and PDF), `deck/index.html` title, the heading in `deck/script-doc.mjs`, the section names in `deck/src/deck/types.ts` (`ACTS`), and the footer text and logos in `Chrome` (`deck/src/deck/Deck.tsx`). Pick a free port in `deck/vite.config.ts` if another deck is running.

Layout of the project:

- `deck/src/slides/*.tsx` one file per slide or group, order in `index.ts`. Each exports a `SlideDef` (id, title, act, minutes, notes, Component).
- `deck/src/ui/atoms.tsx` shared pieces: `Bg`, `Header`, `HaloArt`/`Art`, `Feature` (the one highlighted panel), `IconTile`, `Stat`, `Source`, `LogoTile`, `AppIcon`. `Links.tsx` draws connecting lines with slow travelling dots. `World.tsx` is a dotted world map from real country shapes.
- `deck/src/index.css` holds the colour tokens. Retheme by changing `--accent`, `--accent-ink`, the background values and the rgba tints, not by adding a second theme.
- `tools/` art generation, build, release.

## 2. Content rules (what the owner corrected, in order of how often)

1. **Follow the speaker's document.** Section order, wording of definitions and every number come from it. Where the outline has only a heading, add the minimum from a primary source, link it in `Source`, and tell the owner which slides you filled in. Never present a count the list does not support (a list announced as 30 names that holds 28: show the list, leave the number out, report it).
2. **Headlines are dead easy.** A headline names the slide in words the audience already uses: "5 cách thu thập dữ liệu xuyên biên giới", "Yêu cầu trong tình huống khẩn cấp". Clever or compressed lines get rejected. One line, up to about 40 characters at 66 px; the second half in the accent colour.
3. **Minimal text, plain language.** One idea per card, a few short lines. Common English terms go in brackets or as a small second line ("service provider"). Digits, not number words. No small label above a headline, no colons or middle dots as decoration, no promotional wording.
4. **Translate everything** from a source deck into the audience's language; keep proper names and the English term where officers will meet it.
5. **Speaker notes carry the full text.** The slide keeps the short form; the notes hold the speaker's complete sentences from the outline, so nothing is lost. Sum `minutes` against the slot and report an overrun.
6. **Real logos for real organisations** (official files, never a generated look-alike); record where each came from in `assets/logos-src/SOURCES.md`. Organisation logos the owner asks for go on every slide in `Chrome`, large on title and closing.
7. **Fact-check in the background.** Send one research agent for the facts you are adding (dates, article numbers, law numbers, counts) and write the result to `docs/facts.md` with a URL per item. Where the speaker's own figure differs from public sources, keep hers and report the difference.

## 3. Graphics

Every content slide has illustration. Icon-only slides were called boring. Small lucide icons are fine as row markers only when the slide also has art.

- One family: compact pseudo-3D objects from flat colour planes, no gradients or glow, one colour family plus a tiny yellow marker. The style reference sheets are `assets/ref/blue-indicators.png` and `green-indicators.png`. For another colour, recolour a sheet (see `tools/blue_ref.py`) and change the palette line in `tools/art.mjs`.
- Add a line per image to `tools/art-list.tsv` (`name<TAB>concept`). A concept is one clear object with at most two supporting details and no text: "a sealed envelope with a padlock on its flap and a small crossed-out eye badge".
- `P=4 bash tools/art-batch.sh` generates what is missing with the Codex CLI's image tool (about 80 s each; needs `codex` installed and signed in, model set in `tools/art.mjs`). Run it in the background and keep writing slides. Some runs fail silently: when it finishes, check every name exists and run it again for the missing ones.
- `docker build -q -t deck-pack -f tools/Dockerfile tools && docker run --rm -v "$PWD":/w -w /w deck-pack python tools/art_finish.py` trims them into `deck/public/art/*.webp`. Use with `<HaloArt name="..." size={...} />`.
- Sensitive subjects (harm to children, suicide, terrorism) get protective symbols: an umbrella, a shield, a lifebuoy, a warning sign.
- Maps come from `World.tsx` (real shapes), never from an image model. Diagrams (Venn, flows, hubs) are SVG in the slide.

## 4. Composition: no two neighbours alike

A deck where every slide is a row of equal cards was sent back ("every slide having very similar layout"). Give each slide the shape its content has. The starter has one worked example of each:

| Content | Composition | Starter slide |
|---|---|---|
| A few parts in order | Steps rising along one path, big faint numerals | `s02-agenda.tsx` |
| One umbrella idea plus several others | Bento: one tall highlighted tile and a 2x2 | `Terms` in `s03-terms.tsx` |
| A process | Pipeline: numbered stations on a line, flowing into a result panel | `s05-preserve.tsx` |
| Several ways to one thing | Hub and spokes | `s06-channels.tsx` |
| Parallel kinds with the same attributes | Full-width rows: picture, question, name, contents | `DataTypes` in `s03-terms.tsx` |
| Options with one warning | Tile grid plus one `Feature` panel | `Emergency` in `s08-requests.tsx` |
| A chain of hand-offs | Flow of nodes with arrows (`Link` from `ui/Links.tsx`) | none in the starter |
| Two alternatives | Two wide panels | none in the starter |
| Overlapping areas with a shared core | Venn, labels on leader lines | `Directorate` in `s11-venn.tsx` |
| Places | Dotted map with pins or lit countries, list beside it | `s17b-map-list.tsx` |
| A centre with four functions | Disc in the middle, items in the corners | `AspDesk` in `s14-corners-bridge.tsx` |
| Two sides and what passes between | Bridge: two banks, lanes between | `Gateway` in `s14-corners-bridge.tsx` |
| Numbers that prove a point | `Feature` panel with `Stat` | none in the starter |

When the speaker's own slide has a diagram idea (a Venn, a list beside a map), keep the intent and content and redraw it; do not keep her styling.

## 5. Text craft (each of these was a rejected screenshot)

- **Nothing jumps.** In a set of cards, the same element starts at the same height in every card. Make titles the same number of lines (reword, or give every title two lines), then stack the rest directly underneath. No empty slots and no `margin-top: auto` holes between a title and its text.
- **Break lines by meaning.** `.slide` is `white-space: pre-line`; write `\n` at the end of a phrase: "Chuỗi bảo quản\nchứng cứ", never "Chuỗi bảo\nquản chứng cứ". Keep each hand-set line short enough that the browser never wraps it again; if it wraps, shorten the line or widen the box. Lists of names get hand-set lines too (non-breaking spaces broke the PowerPoint).
- **One size per line.** A big number and its unit are two blocks (`Stat`); an accent word that leads a description is its own line.
- **Margins.** Content stays inside 120 px left and right and clear of the logo strip (top 30 to 98 px). Check labels on maps and diagrams against the right edge.
- **Slides open complete.** No entrance animation; at most one click reveal, only when the reveal is the point. Ambient motion (flowing dots, the title background) is fine.
- No progress or section-number widgets on slides unless asked; the footer rail is enough.

## 6. Build and check

```bash
zsh tools/release.sh     # about 5 minutes: release/ gets Deck/ (web), .pptx, .pdf, Kich-ban-trinh-bay.pdf
```

The release re-saves the file through Microsoft PowerPoint so the fonts are embedded. It quits PowerPoint first: check nothing unsaved is open, and it takes a lock folder in `/tmp` so two sessions never re-save at once. Without PowerPoint on a Mac, skip that step in `tools/release.sh`; the deck still opens, with fonts that must be installed on the presenting machine.

Checking is part of the job, every round:

1. `cd deck && npx vite build && node export.mjs ../tmp/export` renders every slide to `tmp/export/sNN.png`.
2. Look at **every** slide at full size, one image at a time (downscale to 1600 px wide). Contact sheets hide wrapped lines, text touching borders and misaligned rows. Look for: lines that wrapped where you did not break them, text near or over an edge, headlines touching the logos, uneven starts across cards, missing images (an empty outlined square), overlapping labels.
3. After the release, look at `tmp/lo/p-NN.png` (the PowerPoint laid out by LibreOffice) for the slides you changed. This is where overflowing text boxes show up. LibreOffice renders type slightly wider than PowerPoint, so a near miss there is a real risk.
4. Fix, rebuild, look again. Say plainly what you looked at and what you did not.

Then copy `release/` to a named folder on the Desktop, serve `release/Deck` on localhost (`docker run -d -p 127.0.0.1:<port>:80 -v "$PWD/release/Deck":/usr/share/nginx/html:ro nginx:alpine`), and open the folder when asked.

## 7. Reporting

Lead with what is ready and where. Then list the decisions that are the owner's or the speaker's: anything you added beyond the outline, any figure you kept that sources contradict, any count that does not add up, the running time against the slot. Plain words, no file or function names.
