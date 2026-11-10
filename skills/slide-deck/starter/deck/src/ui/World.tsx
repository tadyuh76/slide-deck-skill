import { useMemo } from "react";
import world from "./world.json";
import { LOOP } from "./Wave";

const { cols, rows, step, lat0, dots } = world as unknown as { cols: number; rows: number; step: number; lat0: number; dots: [number, number, number][] };

/** Where a place sits on a map drawn `w` wide (equirectangular, the same grid as the dots). */
export function place(lon: number, lat: number, w: number): [number, number] {
  const cell = w / cols;
  return [((lon + 180) / 360) * w, ((lat0 - lat) / step + 0.5) * cell];
}
export const mapHeight = (w: number) => (w / cols) * rows;

/** The world as a grid of dots (Natural Earth shapes). `mask` lights up a group: 1 = Asia and South Pacific desk members, 2 = bilateral MLA treaty partners. */
export function WorldDots({ w, mask = 0, base = "rgba(125,184,255,0.3)", lit = "#5aa2ff", dot = 0.62 }: { w: number; mask?: number; base?: string; lit?: string; dot?: number }) {
  const cell = w / cols;
  const [d0, d1] = useMemo(() => {
    const a: string[] = [], b: string[] = [];
    for (const [c, r, m] of dots) (m & mask ? b : a).push(`M${((c + 0.5) * cell).toFixed(1)} ${((r + 0.5) * cell).toFixed(1)}h0`);
    return [a.join(""), b.join("")];
  }, [cell, mask]);
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={cell * dot}>
      <path d={d0} stroke={base} />
      {mask > 0 && <path d={d1} stroke={lit} />}
    </g>
  );
}

type City = [number, number];
const HANOI: City = [105.85, 21.03];
const ROUTES: City[] = [[103.82, 1.35], [4.83, 45.76], [-77.04, 38.9], [139.69, 35.68], [151.21, -33.87], [-122.33, 37.5], [77.21, 28.61], [-0.13, 51.5], [36.82, -1.29], [-46.63, -23.55], [55.27, 25.2]];

/** The title background: the dotted world with requests leaving Hà Nội and answers coming back. Every motion
 *  repeats exactly every LOOP seconds (the PowerPoint plays it as a seamless loop). */
export function CrossBorder({ t, w }: { t: number; w: number }) {
  const h = mapHeight(w);
  const ph = (t % LOOP) / LOOP;
  const [hx, hy] = place(HANOI[0], HANOI[1], w);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <filter id="cb-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <WorldDots w={w} base="rgba(125,184,255,0.5)" />
      {ROUTES.map(([lon, lat], i) => {
        const [x, y] = place(lon, lat, w);
        const mx = (hx + x) / 2, my = (hy + y) / 2 - Math.min(260, Math.hypot(x - hx, y - hy) * 0.32);
        const k = (i * 0.618) % 1;
        // one request out (first half of its cycle), one answer back (second half)
        const u = (ph + k) % 1;
        const out = u < 0.5;
        const v = out ? u / 0.5 : 1 - (u - 0.5) / 0.5;
        const e = v * v * (3 - 2 * v);
        const px = (1 - e) * (1 - e) * hx + 2 * (1 - e) * e * mx + e * e * x;
        const py = (1 - e) * (1 - e) * hy + 2 * (1 - e) * e * my + e * e * y;
        const o = Math.sin(Math.PI * (out ? u / 0.5 : (u - 0.5) / 0.5));
        return (
          <g key={i}>
            <path d={`M${hx} ${hy} Q${mx} ${my} ${x} ${y}`} fill="none" stroke="rgba(125,184,255,0.5)" strokeWidth={1.8} />
            <circle cx={x} cy={y} r={5} fill="#0a1f4d" stroke="#7db8ff" strokeWidth={2} />
            <g opacity={o}>
              <circle cx={px} cy={py} r={9} fill={out ? "#3d8bff" : "#45d0ff"} filter="url(#cb-glow)" opacity={0.9} />
              <circle cx={px} cy={py} r={3.2} fill="#e3f0ff" />
            </g>
          </g>
        );
      })}
      <circle cx={hx} cy={hy} r={22} fill="rgba(61,139,255,0.18)" />
      <circle cx={hx} cy={hy} r={9} fill="#f8cd56" stroke="#071a40" strokeWidth={3} />
    </svg>
  );
}
