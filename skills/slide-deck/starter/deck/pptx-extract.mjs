// pptx-extract.mjs <outDir> — takes the built deck apart into PowerPoint pieces, slide by slide:
//   base-NN.png        the background before anything builds in (no text, no build elements)
//   layer-NN-C.png     plain graphics (lines, links, bars…) that appear at click C, as a transparent overlay
//   unit-NN-K.png      each build element (card, chart, icon, image…) without its text, transparent, full frame
//   unitbg-NN-K.png    the same over the slide background, for frosted-glass cards (PowerPoint cannot blur what
//                      is behind a shape, so the builder bakes the blurred backdrop into the card)
//   pptx.json          every text block as runs and lines (font, size, colour, spacing, alignment, rotation),
//                      every unit with its click and delay, so the builder can make editable text boxes and
//                      native entrance animations that match the web deck.
// All images are full-slide 3840x2160 so positions are exact; the builder trims them.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const out = path.resolve(process.argv[2]);
const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
fs.mkdirSync(out, { recursive: true });
const url = "file://" + path.resolve("dist/index.html");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("pageerror:", e.message));

const CSS = `
*, *::before, *::after { transition: none !important; animation: none !important; }
.pptx-transparent, .pptx-transparent body, .pptx-transparent #root, .pptx-transparent .viewport,
.pptx-transparent .stage { background: transparent !important; }
.pptx-noB .slide .b, .pptx-noB .slide .b * { visibility: hidden !important; }
.pptx-notext .slide *:not(svg):not(svg *):not([data-raster]):not([data-raster] *) {
  color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }
.pptx-notext .slide svg text:not([data-raster] *), .pptx-notext .slide svg text:not([data-raster] *) * {
  fill: transparent !important; stroke: transparent !important; }
.pptx-solo .slide *, .pptx-solo .chrome, .pptx-solo .chrome * { visibility: hidden !important; }
.pptx-solo .slide [data-solo], .pptx-solo .slide [data-solo] * { visibility: visible !important; }
.pptx-solo .slide [data-solo] .b:not([data-solo]), .pptx-solo .slide [data-solo] .b:not([data-solo]) * { visibility: hidden !important; }
.pptx-bg .slide [data-solo], .pptx-bg .slide [data-solo] * { visibility: visible !important; }
.pptx-bg .slide [data-solo] .b:not([data-solo]), .pptx-bg .slide [data-solo] .b:not([data-solo]) * { visibility: hidden !important; }
`;

// ---------------------------------------------------------------- page-side helpers
const PAGE = () => {
  const slide = () => [...document.querySelectorAll(".slide")].find((s) => getComputedStyle(s).visibility === "visible");
  const W = (n) => Math.round(n * 100) / 100;
  const opacityChain = (el, root) => {
    let o = 1;
    for (let e = el; e && e !== root.parentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || "1");
    return o;
  };
  const isRasterTransform = (t) => {
    if (!t || t === "none") return false;
    if (t.startsWith("matrix3d")) return true;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return false;
    const [a, b, c, d] = m[1].split(",").map(Number);
    return Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || Math.abs(a - d) > 1e-3;
  };
  // mark subtrees that must stay pictures (3D or rotated HTML): their text is not exported
  const markRaster = (root) => {
    root.querySelectorAll("[data-raster]").forEach((e) => e.removeAttribute("data-raster"));
    for (const e of root.querySelectorAll("*")) {
      if (e instanceof SVGElement) continue;
      if (isRasterTransform(getComputedStyle(e).transform)) e.setAttribute("data-raster", "1");
    }
    // a picture-only subtree keeps its own text colours when the rest of the slide's text is hidden (colour and
    // text-fill colour are inherited, so freeze them on every element of the subtree)
    for (const r of root.querySelectorAll("[data-raster]")) {
      for (const el of [r, ...r.querySelectorAll("*")]) {
        if (el instanceof SVGElement) continue;
        el.style.setProperty("color", getComputedStyle(el).color, "important");
        el.style.setProperty("-webkit-text-fill-color", getComputedStyle(el).color, "important");
      }
    }
  };
  const inRaster = (el) => !!el.closest("[data-raster]");
  const blockOf = (el, root) => {
    const t = el.closest("text");
    if (t && root.contains(t)) return t;
    for (let e = el; e && e !== root; e = e.parentElement) {
      const d = getComputedStyle(e).display;
      if (d !== "inline" && d !== "contents") return e;
    }
    return el;
  };
  const keyOf = (el, root) => {
    const parts = [];
    for (let e = el; e && e !== root; e = e.parentElement) {
      const p = e.parentElement;
      parts.unshift(p ? [...p.children].indexOf(e) : 0);
    }
    return parts.join(".");
  };
  const fam = (f) => {
    const s = f.toLowerCase();
    if (s.includes("grotesk")) return "Space Grotesk";
    if (s.includes("mono")) return "JetBrains Mono";
    return "Inter";
  };
  const rgba = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return [238, 244, 241, 1];
    const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
  };

  window.__pptx = {
    slideIndex: () => [...document.querySelectorAll(".slide")].indexOf(slide()),
    prepare() { markRaster(slide()); },
    cls(add, remove) {
      add.forEach((c) => document.documentElement.classList.add(c));
      remove.forEach((c) => document.documentElement.classList.remove(c));
    },
    freezeSvgColors() {
      for (const s of slide().querySelectorAll("svg")) s.style.setProperty("color", getComputedStyle(s).color, "important");
    },
    units() {
      const root = slide();
      return [...root.querySelectorAll(".b.on")].map((e, i) => {
        e.setAttribute("data-unit", String(i));
        const parentUnit = e.parentElement.closest(".b.on");
        // frosted-glass boxes that belong to this unit (not to a unit nested inside it)
        const glass = [e, ...e.querySelectorAll("*")]
          .filter((g) => g.closest(".b.on") === e && getComputedStyle(g).backdropFilter !== "none")
          .map((g) => { const r = g.getBoundingClientRect(); return { x: W(r.left), y: W(r.top), w: W(r.width), h: W(r.height), r: parseFloat(getComputedStyle(g).borderTopLeftRadius) || 0 }; });
        return { i, at: Number(e.dataset.at || 0), delay: Number(e.dataset.delay || 0), parent: parentUnit ? Number(parentUnit.dataset.unit) : null, glass };
      });
    },
    solo(i) {
      slide().querySelectorAll("[data-solo]").forEach((e) => e.removeAttribute("data-solo"));
      if (i !== null) slide().querySelector(`[data-unit="${i}"]`).setAttribute("data-solo", "1");
    },
    visibleKeys() {
      const root = slide();
      const res = {};
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.data.trim()) continue;
        const b = blockOf(n.parentElement, root);
        const k = keyOf(b, root);
        const vis = n.parentElement.checkVisibility({ visibilityProperty: true }) && opacityChain(n.parentElement, root) > 0.05;
        res[k] = res[k] || vis;
      }
      return res;
    },
    texts() {
      const root = slide();
      // when a free-standing label fades in on the web: the latest opacity transition delay above it
      const css = document.getElementById("pptx-css");
      css.disabled = true;
      const delayOf = (el) => {
        let d = 0;
        for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
          const st = getComputedStyle(e);
          const props = st.transitionProperty.split(",").map((v) => v.trim());
          const dels = st.transitionDelay.split(",").map((v) => parseFloat(v) || 0);
          props.forEach((pr, i) => { if (pr === "all" || pr === "opacity") d = Math.max(d, dels[i % dels.length]); });
        }
        return d;
      };
      const blocks = new Map();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.data.trim()) continue;
        const pe = n.parentElement;
        if (inRaster(pe)) continue;
        if (!pe.checkVisibility({ visibilityProperty: true })) continue;
        if (opacityChain(pe, root) < 0.05) continue;
        const b = blockOf(pe, root);
        if (!blocks.has(b)) blocks.set(b, []);
        blocks.get(b).push(n);
      }
      const outBlocks = [];
      const tdelay = new Map([...blocks.keys()].map((b) => [b, delayOf(b)]));
      css.disabled = false;
      const range = document.createRange();
      for (const [b, nodes] of blocks) {
        const isSvg = b instanceof SVGElement;
        const bs = getComputedStyle(b);
        const lines = [[]];
        let lineTop = null, lineBottom = null, lineH = 0;
        let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, firstRect = null;
        const pre = bs.whiteSpace.startsWith("pre");
        // per line: left and right edge of its glyphs (no trailing spaces) and where the last piece ended
        const ext = new WeakMap();
        const grow = (line, l, r) => { const e = ext.get(line) || [1e9, -1e9]; ext.set(line, [Math.min(e[0], l), Math.max(e[1], r)]); };
        const push = (text, el, r) => {
          const st = getComputedStyle(el);
          // the text as it is drawn: CSS case changes (uppercase labels) are not in the DOM text
          const tt = st.textTransform;
          if (tt === "uppercase") text = text.toUpperCase();
          else if (tt === "lowercase") text = text.toLowerCase();
          const [cr, cg, cb, ca] = rgba(st.color === "rgba(0, 0, 0, 0)" ? "rgb(238,244,241)" : st.color);
          const fill = isSvg ? rgba(el.getAttribute("fill") ? getComputedStyle(el).fill : st.fill) : null;
          const color = isSvg && fill ? fill : [cr, cg, cb, ca];
          const op = opacityChain(el, root);
          const run = {
            text, family: fam(st.fontFamily), weight: Number(st.fontWeight) || 400, size: parseFloat(st.fontSize),
            color: [color[0], color[1], color[2], W(color[3] * op)], italic: st.fontStyle === "italic",
            spacing: st.letterSpacing === "normal" ? 0 : parseFloat(st.letterSpacing),
            tnum: st.fontVariantNumeric.includes("tabular-nums"),
            href: el.closest("a[href]")?.href || null,
          };
          const line = lines[lines.length - 1];
          const last = line[line.length - 1];
          const same = last && ["family", "weight", "size", "italic", "spacing", "tnum", "href"].every((k) => last[k] === run[k]) && last.color.join() === run.color.join();
          if (same) last.text += text; else line.push(run);
          if (r) { minX = Math.min(minX, r.left); minY = Math.min(minY, r.top); maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom); }
        };
        for (const tn of nodes) {
          const el = tn.parentElement;
          const data = tn.data;
          const re = pre ? /[^\n]+|\n/g : /\s*\S+\s*/g;
          let m;
          while ((m = re.exec(data))) {
            let tok = m[0];
            if (tok === "\n") { lines.push([]); lineTop = null; lineBottom = null; continue; }
            range.setStart(tn, m.index);
            range.setEnd(tn, m.index + tok.length);
            const rects = [...range.getClientRects()].filter((r) => r.width > 0.1 || r.height > 0.1);
            if (!rects.length) continue;
            if (!pre) tok = tok.replace(/\s+/g, " ");
            // a token that itself wraps (a break after a hyphen): split it character by character
            const pieces = [];
            if (rects.length > 1 && !pre) {
              let cur = "", top = null;
              for (let k = 0; k < m[0].length; k++) {
                range.setStart(tn, m.index + k); range.setEnd(tn, m.index + k + 1);
                const cr = range.getClientRects()[0];
                const ch = m[0][k];
                if (cr && top !== null && cr.top > top + cr.height * 0.5) { pieces.push([cur, top]); cur = ""; }
                if (cr) top = top === null || cr.top > top + cr.height * 0.5 ? cr.top : top;
                cur += /\s/.test(ch) ? " " : ch;
              }
              pieces.push([cur, top]);
            } else pieces.push([tok, rects[0].top]);
            // the glyphs without the spaces around them, for line widths and for gaps that layout (not spaces) made
            const lead = m[0].length - m[0].trimStart().length, trail = m[0].length - m[0].trimEnd().length;
            let core = null;
            if (pieces.length === 1 && m[0].trim()) {
              range.setStart(tn, m.index + lead); range.setEnd(tn, m.index + m[0].length - trail);
              core = [...range.getClientRects()].filter((r) => r.width > 0.1)[0] || null;
            }
            pieces.forEach(([txt, top], pi) => {
              const r = pi < rects.length ? rects[pi] : rects[rects.length - 1];
              // a new line starts only when this piece begins below the current line's glyphs (runs of different
              // sizes on one baseline, like "80,9 tỷ USD", have different tops but share the line)
              if (lineTop !== null && top > lineTop + r.height * 0.5 && top >= lineBottom - r.height * 0.3) {
                const line = lines[lines.length - 1];
                if (line.length) line[line.length - 1].text = line[line.length - 1].text.replace(/\s+$/, "");
                lines.push([]);
                lineTop = top;
                lineBottom = null;
              }
              if (lineTop === null) lineTop = top;
              lineBottom = lineBottom === null ? top + r.height : Math.max(lineBottom, top + r.height);
              if (!firstRect) firstRect = r;
              lineH = Math.max(lineH, r.height);
              const line = lines[lines.length - 1];
              let t = line.length === 0 && !pre ? txt.replace(/^\s+/, "") : txt;
              const g = core || (txt.trim() ? r : null);
              const prev = line[line.length - 1];
              if (g && prev && !lead && !/\s$/.test(prev.text) && ext.has(line)) {
                const size = parseFloat(getComputedStyle(el).fontSize);
                const gap = g.left - ext.get(line)[1];
                if (gap > 0.12 * size) t = " ".repeat(Math.max(1, Math.round(gap / (0.28 * size)))) + t;
              }
              push(t, el, r);
              if (g) grow(line, g.left, g.right);
            });
          }
        }
        for (const l of lines) if (l.length) l[l.length - 1].text = l[l.length - 1].text.replace(/\s+$/, "");
        const clean = lines.filter((l) => l.length && l.some((r) => r.text.length));
        const lw = clean.map((l) => (ext.has(l) ? W(ext.get(l)[1] - ext.get(l)[0]) : null));
        if (!clean.length || !firstRect) continue;
        const sizes = clean.flat().map((r) => r.size);
        let lh = parseFloat(bs.lineHeight);
        if (isNaN(lh)) lh = Math.max(...sizes) * 1.21;
        if (clean.length > 1) lh = (maxY - minY - lineH) / (clean.length - 1) || lh;
        let align = "l";
        if (isSvg) {
          const a = getComputedStyle(b).textAnchor || b.getAttribute("text-anchor");
          align = a === "middle" ? "ctr" : a === "end" ? "r" : "l";
        } else {
          const a = bs.textAlign;
          align = a === "center" ? "ctr" : a === "right" || a === "end" ? "r" : "l";
        }
        let rot = 0, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, w = maxX - minX, h = maxY - minY;
        if (isSvg) {
          const m = b.getScreenCTM();
          rot = (Math.atan2(m.b, m.a) * 180) / Math.PI;
          if (Math.abs(rot) > 0.5) {
            const bb = b.getBBox();
            const p = new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(m);
            const sc = Math.hypot(m.a, m.b);
            cx = p.x; cy = p.y; w = bb.width * sc; h = bb.height * sc;
          } else rot = 0;
        }
        const unit = b.closest(".b.on");
        outBlocks.push({
          key: keyOf(b, root), lines: clean, lw, align, rot: W(rot), lineHeight: W(lh), firstH: W(firstRect.height),
          x: W(minX), y: W(minY), w: W(w), h: W(h), cx: W(cx), cy: W(cy), pre,
          unit: unit ? Number(unit.dataset.unit) : null, tdelay: W(tdelay.get(b)),
        });
      }
      return outBlocks;
    },
  };
};

// ---------------------------------------------------------------- per slide
await page.goto(url + "?export#/1/0");
await page.waitForTimeout(600);
const slides = await page.evaluate(() => window.__SLIDES__);
const result = [];

async function load(n, click) {
  await page.goto(`${url}?export#/${n}/${click}`);
  await page.reload();
  // the extractor's own sheet (slides may carry <style> elements of their own, so tag this one directly)
  await (await page.addStyleTag({ content: CSS })).evaluate((e) => { e.id = "pptx-css"; });
  await page.evaluate(PAGE);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__pptx.prepare());
}
const shot = async (file, transparent) => {
  await page.evaluate((t) => window.__pptx.cls(t ? ["pptx-transparent"] : [], t ? [] : ["pptx-transparent"]), transparent);
  await page.screenshot({ path: path.join(out, file), omitBackground: transparent });
};

for (let i = 0; i < slides.length; i++) {
  const n = i + 1, nn = String(n).padStart(2, "0");
  const s = slides[i];
  if (only && !only.includes(n)) continue;
  if (s.video) { result.push({ n, video: s.video }); console.log(nn, "video"); continue; }
  const clicks = s.clicks; // internal step shown at each click
  const last = clicks.length - 1;
  // final state: units and text blocks
  await load(n, last);
  const units = await page.evaluate(() => window.__pptx.units());
  const texts = await page.evaluate(() => window.__pptx.texts());
  // which click each unit belongs to
  const clickOfStep = (at) => { const c = clicks.findIndex((st) => st >= at); return c < 0 ? last : c; };
  for (const u of units) u.click = clickOfStep(u.at);
  // when non-unit text appears: first click where it is visible
  const firstVisible = {};
  for (let c = -1; c <= last; c++) {
    await load(n, c);
    const vis = await page.evaluate(() => window.__pptx.visibleKeys());
    for (const [k, v] of Object.entries(vis)) if (v && firstVisible[k] === undefined) firstVisible[k] = c;
  }
  for (const t of texts) {
    if (t.unit !== null) { const u = units[t.unit]; t.click = Math.max(u.click, firstVisible[t.key] ?? u.click); t.delay = u.delay; }
    else { t.click = firstVisible[t.key] ?? -1; t.delay = t.tdelay; }
  }
  // unit pictures (final state, no text, one unit at a time, transparent)
  await load(n, last);
  await page.evaluate(() => window.__pptx.units());
  await page.evaluate(() => { window.__pptx.freezeSvgColors(); window.__pptx.cls(["pptx-notext", "pptx-solo"], []); });
  for (const u of units) {
    await page.evaluate((k) => window.__pptx.solo(k), u.i);
    await shot(`unit-${nn}-${u.i}.png`, true);
  }
  await page.evaluate(() => window.__pptx.cls(["pptx-noB", "pptx-bg"], ["pptx-solo"]));
  for (const u of units.filter((v) => v.glass.length)) {
    await page.evaluate((k) => window.__pptx.solo(k), u.i);
    await shot(`unitbg-${nn}-${u.i}.png`, false);
  }
  // base and per-click plain graphics (no units, no text, opaque)
  for (let c = -1; c <= last; c++) {
    await load(n, c);
    await page.evaluate(() => { window.__pptx.freezeSvgColors(); window.__pptx.cls(["pptx-notext", "pptx-noB"], []); });
    await shot(c < 0 ? `base-${nn}.png` : `g-${nn}-${c}.png`, false);
  }
  result.push({ n, id: s.id, clicks: clicks.length, units, texts });
  console.log(nn, units.length, "units,", texts.length, "texts");
}
fs.writeFileSync(path.join(out, "pptx.json"), JSON.stringify(result, null, 1));
await browser.close();
