// worldmap.mjs — the deck's dotted world map, from Natural Earth country shapes (world-atlas 110m):
// deck/src/ui/world.json = { W, H, step, dots: [[col,row,asp]] } on an equirectangular grid, lat 84..-58.
// flag bit 1 = the group in MLA below, bit 0 = the group in ASP below (ISO numeric country codes); 
import fs from "node:fs";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const topo = require("world-atlas/countries-50m.json");
const ASP = new Set([]);
const MLA = new Set(["096","116","360","418","458","104","608","702","764","626","704"]); // the sample group: ASEAN members
const feats = feature(topo, topo.objects.countries).features.filter((f) => f.id !== "010");
const boxes = feats.map((f) => { let a = 180, b = -180, c = 90, d = -90; const walk = (co) => { if (typeof co[0] === "number") { a = Math.min(a, co[0]); b = Math.max(b, co[0]); c = Math.min(c, co[1]); d = Math.max(d, co[1]); } else co.forEach(walk); }; walk(f.geometry.coordinates); return [a, b, c, d]; });
const STEP = 1.5, LAT0 = 84, LAT1 = -58;
const dots = [];
for (let r = 0, lat = LAT0; lat >= LAT1; r++, lat -= STEP) for (let c = 0, lon = -180 + STEP / 2; lon < 180; c++, lon += STEP) {
  for (let i = 0; i < feats.length; i++) { const [a, b, x, y] = boxes[i];
    if ((b - a < 300) && (lon < a || lon > b || lat < x || lat > y)) continue;
    if (geoContains(feats[i], [lon, lat])) { dots.push([c, r, (ASP.has(feats[i].id) ? 1 : 0) | (MLA.has(feats[i].id) ? 2 : 0)]); break; } }
}
fs.writeFileSync("deck/src/ui/world.json", JSON.stringify({ step: STEP, lat0: LAT0, lat1: LAT1, cols: 360 / STEP, rows: Math.floor((LAT0 - LAT1) / STEP) + 1, dots }));
console.log(dots.length, "dots", dots.filter((d) => d[2] & 1).length, "asp", dots.filter((d) => d[2] & 2).length, "mla");
