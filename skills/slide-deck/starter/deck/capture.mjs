// capture.mjs <outDir> <slide numbers…> — records the living background of the given slides (title, close) as a
// seamless 8 s loop at 60 fps for the PowerPoint, without the build elements and text (those are separate, editable
// PowerPoint objects on top). The page runs on a virtual clock (performance.now, Date.now,
// requestAnimationFrame and every CSS animation are stepped by exactly 1/60 s per frame), so the loop is exact:
// every ambient motion repeats every LOOP seconds, and frame LOOP·60 equals frame 0.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [outArg, ...nums] = process.argv.slice(2);
const out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
const FPS = 60, DT = 1000 / FPS, LOOP = 8;

const virtualClock = () => {
  let now = 1000;
  const raf = new Map();
  let rid = 0;
  const base = Date.now();
  performance.now = () => now;
  Date.now = () => base + now;
  window.requestAnimationFrame = (cb) => { rid += 1; raf.set(rid, cb); return rid; };
  window.cancelAnimationFrame = (i) => { raf.delete(i); };
  const tick = () => new Promise((r) => setTimeout(r, 0));
  window.__advance = async (ms) => {
    now += ms;
    const cbs = [...raf.values()];
    raf.clear();
    for (const cb of cbs) { try { cb(now); } catch { /* ignore */ } }
    await tick(); await tick();
    for (const a of document.getAnimations()) {
      if (a.__v0 === undefined) { a.__v0 = now; a.pause(); }
      a.currentTime = now - a.__v0;
    }
  };
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.addInitScript(virtualClock);
page.on("pageerror", (e) => console.error("pageerror:", e.message));
const clips = [];
for (const n of nums.map(Number)) {
  await page.goto("file://" + path.resolve("dist/index.html") + `?capture#/${n}/0`);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete) && typeof window.__start === "function");
  await page.evaluate(() => { for (const s of document.querySelectorAll(".slide svg")) s.style.setProperty("color", getComputedStyle(s).color, "important"); });
  await page.addStyleTag({ content: `.slide .b, .slide .b * { visibility: hidden !important; }
    .slide *:not(svg):not(svg *) { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }
    .slide svg text, .slide svg text * { fill: transparent !important; stroke: transparent !important; }` });
  await page.evaluate(() => window.__start());
  // let every entrance finish, then start the loop on a whole number of cycles
  for (let i = 0; i < 2 * LOOP * FPS; i++) await page.evaluate((ms) => window.__advance(ms), DT);
  const file = `loop-s${String(n).padStart(2, "0")}.mp4`;
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(out, file)]);
  const done = new Promise((r) => ff.on("close", r));
  for (let f = 0; f < LOOP * FPS; f++) {
    const img = await page.screenshot({ type: "jpeg", quality: 95 });
    if (f === 0) fs.writeFileSync(path.join(out, file.replace(".mp4", "-first.jpg")), img);
    ff.stdin.write(img);
    await page.evaluate((ms) => window.__advance(ms), DT);
  }
  ff.stdin.end();
  await done;
  clips.push({ slide: n, file });
  console.log(file);
}
fs.writeFileSync(path.join(out, "loops.json"), JSON.stringify(clips, null, 2));
await browser.close();
