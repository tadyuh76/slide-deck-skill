#!/usr/bin/env node
// art.mjs <name> "<concept>" — one deck illustration in the SHIELD indicator family, made with the Codex CLI's built-in
// image tool (gpt-6.1-sol, xhigh reasoning), from the reference sheet assets/ref/shield-indicators.png.
// The raw PNG lands in assets/gen/<name>.png; tools/art_finish.py turns it into deck/public/art/<name>.webp.
// Codex keeps working (checking, copying) for many minutes after the picture exists, so this script reads the thread
// id from `codex exec --json`, takes the first picture that appears in ~/.codex/generated_images/<thread>/ and stops.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [name, concept] = process.argv.slice(2);
if (!name || !concept) { console.error('usage: art.mjs <name> "<concept>"'); process.exit(1); }
const outDir = path.join(root, "assets", "gen");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${name}.png`);
const ref = path.join(root, "assets", "ref", process.env.REF || "blue-indicators.png");

const prompt = `Use your built-in image generation tool (image_gen) exactly once, not a script, SVG, HTML or any code, working from the attached image. As soon as the image is generated, stop: do not inspect, verify, edit, convert or copy it, and do not run any commands.

The attached image is a style reference sheet of an existing icon family (a blue cybersecurity indicator set). Create ONE new illustration that belongs to exactly that family, without copying any of its subjects.

CONCEPT: ${concept}

STYLE (match the reference exactly):
- Polished, compact pseudo-3D illustration built from simple rounded forms and hard-edged layered planes; shallow extrusion; restrained shadows only to show depth; the same three-quarter view, proportions and edge treatment as the reference.
- Palette, only these colours: deep navy structure #0A1F4D #0B2A66 #071A40 #173F8F; blue accents #1F5FD0 #2F7BEA #6BA6F2 #A9CBF7; blue-cast off-white #EEF3FB #D8E3F4; yellow #F8CD56 #D9A746 only as one tiny marker or trim (never a dominant fill). Blue must clearly dominate. No pure white, cream, black, green, teal, purple, red or orange.
- Depth comes from distinct flat colour planes: no gradients, glow, airbrushing, blur, glossy highlights or texture.
- One clear primary subject with at most two small supporting details; it must still read clearly at 56 px. No busy scene, no orbit rings or decorative nodes unless the concept itself needs them.
- No text, letters, numerals, currency symbols, logos, flags or watermarks anywhere.

CANVAS: square, genuinely transparent background (a real alpha channel, not white, not grey, not a checkerboard), subject centred and filling about 80% of the canvas, nothing cropped.`;

const codex = process.env.CODEX || "codex";
const args = ["exec", "--json", "-m", process.env.CODEX_MODEL || "gpt-6.1-sol", "-c", `model_reasoning_effort="${process.env.CODEX_EFFORT || "xhigh"}"`,
  "--skip-git-repo-check", "-s", "read-only", "-C", outDir, "-i", ref, "-"];
const t0 = Date.now();
const child = spawn(codex, args, { stdio: ["pipe", "pipe", "ignore"] });
child.stdin.end(prompt);
let thread = null, buf = "";
child.stdout.on("data", (d) => {
  buf += d;
  if (!thread) { const m = buf.match(/"thread_id"\s*:\s*"([^"]+)"/); if (m) thread = m[1]; }
});
const gen = path.join(os.homedir(), ".codex", "generated_images");
const LIMIT = 15 * 60 * 1000;
const done = (code, msg) => { try { child.kill("SIGTERM"); } catch { /* gone */ } console[code ? "error" : "log"](msg); process.exit(code); };
let exited = false;
child.on("exit", () => { exited = true; });
const poll = setInterval(() => {
  if (thread) {
    const dir = path.join(gen, thread);
    const pngs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".png")) : [];
    if (pngs.length) {
      const f = path.join(dir, pngs[0]);
      const s1 = fs.statSync(f).size;
      setTimeout(() => {
        if (fs.statSync(f).size !== s1) return; // still being written
        clearInterval(poll);
        fs.copyFileSync(f, out);
        const png = fs.readFileSync(out);
        done(0, `${name} ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} ${Math.round((Date.now() - t0) / 1000)}s`);
      }, 1500);
      return;
    }
  }
  if (Date.now() - t0 > LIMIT || (exited && Date.now() - t0 > 5000 && !thread)) { clearInterval(poll); done(1, `FAILED ${name}`); }
  if (exited && thread) {
    const dir = path.join(gen, thread);
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((f) => f.endsWith(".png"))) { clearInterval(poll); done(1, `FAILED ${name} (no image)`); }
  }
}, 2000);
