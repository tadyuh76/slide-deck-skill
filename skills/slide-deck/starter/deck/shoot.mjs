// shoot.mjs <baseUrl> <outDir> [slides e.g. 1,2,5-7] [--scale 1|2] [--steps]  — screenshot slides in export mode
import { chromium } from "playwright";
import fs from "node:fs";
const [base, out, sel = "all", ...rest] = process.argv.slice(2);
const scale = rest.includes("--scale") ? Number(rest[rest.indexOf("--scale") + 1]) : 1;
const allSteps = rest.includes("--steps");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
await page.goto(`${base}?export#/1/99`);
await page.waitForTimeout(800);
const total = await page.evaluate(() => window.__SLIDES__?.length ?? 1);
const steps = await page.evaluate(() => window.__SLIDES__?.map((s) => s.steps) ?? [1]);
const want = sel === "all" ? [...Array(total).keys()].map((i) => i + 1)
  : sel.split(",").flatMap((p) => { const [a, b] = p.split("-").map(Number); return b ? [...Array(b - a + 1).keys()].map((i) => a + i) : [a]; });
for (const n of want) {
  const st = allSteps ? [...Array(steps[n - 1]).keys()] : [99];
  for (const s of st) {
    await page.goto(`${base}?export#/${n}/${s}`); await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.waitForTimeout(600);
    const name = `${out}/s${String(n).padStart(2, "0")}${allSteps ? `-${s}` : ""}.png`;
    await page.screenshot({ path: name });
    console.log(name);
  }
}
await browser.close();
