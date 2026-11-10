// export.mjs <outDir> — renders the built deck for the PDF, the speaker script and the PowerPoint, at 2560x1440:
//   sNN.png      the slide's final state (PDF, script)
//   sNN-b.png    the slide's background before anything builds in (PowerPoint base)
//   sNN-K.png    the state after click K (PowerPoint layers: what changes at each click)
// and slides.json (titles, notes per click, timings, video files).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const url = "file://" + path.resolve("dist/index.html");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 4 / 3 });
await p.goto(url + "?export#/1");
await p.waitForTimeout(800);
const slides = await p.evaluate(() => window.__SLIDES__);

async function shot(n, click, file) {
  await p.goto(`${url}?export#/${n}${click === null ? "" : "/" + click}`);
  await p.reload();
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].every((im) => im.complete));
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(out, file) });
}

for (let i = 0; i < slides.length; i++) {
  const n = i + 1, nn = String(n).padStart(2, "0");
  await shot(n, null, `s${nn}.png`);
  slides[i].image = `s${nn}.png`;
  if (!slides[i].video) {
    await shot(n, -1, `s${nn}-b.png`);
    for (let c = 0; c < slides[i].steps; c++) await shot(n, c, `s${nn}-${c}.png`);
  }
  console.log(`s${nn}`);
}
fs.writeFileSync(path.join(out, "slides.json"), JSON.stringify(slides, null, 2));
await b.close();
