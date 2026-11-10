// script-doc.mjs <exportDir> <outPdf> — a printable speaker script: each slide's thumbnail, slot, cumulative time and notes.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const [dir, outPdf] = process.argv.slice(2);
const slides = JSON.parse(fs.readFileSync(path.join(dir, "slides.json"), "utf8"));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (m) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
let t = 0;
const rows = slides.filter((s) => s.id !== "sources").map((s, i) => {
  const start = t; t += s.minutes;
  const notes = esc(s.notes).replace(/\(click\)/g, '<span class="click">bấm</span>').replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
  const jpg = path.join(dir, s.image.replace(".png", ".thumb.jpg"));
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", path.join(dir, s.image), "-vf", "scale=960:-1", "-q:v", "3", jpg]);
  const img = "data:image/jpeg;base64," + fs.readFileSync(jpg).toString("base64");
  return `<section><div class="meta"><img src="${img}"><div class="n">${i + 1}. ${esc(s.title)}</div>
<div class="t">bắt đầu ${fmt(start)}, thời lượng ${fmt(s.minutes)}${s.cuttable ? ", có thể bỏ" : ""}${s.video ? ", video tự chạy" : ""}</div></div>
<div class="notes"><p>${notes}</p></div></section>`;
}).join("\n");
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
@page { size: A4; margin: 14mm 14mm 16mm; }
body { font: 10.5pt/1.5 "Inter", -apple-system, "Segoe UI", sans-serif; color: #111a2c; }
h1 { font: 600 20pt/1.2 "Space Grotesk", "Inter", sans-serif; margin: 0 0 4pt; }
.sub { color: #56657e; margin-bottom: 14pt; }
section { display: grid; grid-template-columns: 62mm 1fr; gap: 6mm; padding: 5mm 0; border-top: 0.6pt solid #d6dfee; break-inside: avoid; }
img { width: 62mm; border-radius: 2mm; display: block; }
.n { font-weight: 600; margin-top: 2mm; }
.t { color: #56657e; font-size: 9pt; }
.notes p { margin: 0 0 5pt; }
.click { display: inline-block; font-size: 8pt; font-weight: 600; color: #1d58c8; border: 0.6pt solid #1d58c8; border-radius: 2px; padding: 0 3pt; margin-right: 3pt; }
</style></head><body>
<h1>Kịch bản trình bày</h1>
<div class="sub">Kịch bản trình bày (khoảng ${Math.round(slides.reduce((a, x) => a + x.minutes, 0))} phút trình bày).</div>
${rows}
</body></html>`;
fs.writeFileSync(outPdf.replace(/\.pdf$/, ".html"), html);
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent(html, { waitUntil: "load" });
await p.pdf({ path: outPdf, format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:8px;color:#7c8aa3;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>', margin: { top: "14mm", bottom: "16mm", left: "14mm", right: "14mm" } });
await b.close();
console.log(outPdf);
