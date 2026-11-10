import { useEffect, useRef, useState } from "react";

/** Time in seconds since mount; frozen at `freezeAt` when exporting. */
export function useClock(running: boolean, freezeAt = 4) {
  const [t, setT] = useState(freezeAt);
  const raf = useRef(0);
  useEffect(() => {
    if (!running) { setT(freezeAt); return; }
    const t0 = performance.now();
    const tick = () => { setT(freezeAt + (performance.now() - t0) / 1000); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, freezeAt]);
  return t;
}

/** Every ambient motion repeats exactly every LOOP seconds, so the title and closing slides loop seamlessly. */
export const LOOP = 8;
const W = (2 * Math.PI) / LOOP;

/** A living signal line: quiet at the left, rising into bursts toward the right. */
export function Waveform({
  width = 1920,
  height = 240,
  t,
  color = "#3d8bff",
  opacity = 0.5,
  amp = 1,
  seed = 1,
  rise = true,
  strokeWidth = 2,
}: {
  width?: number;
  height?: number;
  t: number;
  color?: string;
  opacity?: number;
  amp?: number;
  seed?: number;
  rise?: boolean;
  strokeWidth?: number;
}) {
  const mid = height / 2;
  const pts: string[] = [];
  const N = 360;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = u * width;
    const env = rise ? 0.12 + 0.88 * Math.pow(u, 1.6) : 1;
    const burst = Math.exp(-Math.pow((u - 0.78) * 7, 2)) * 0.9 + Math.exp(-Math.pow((u - 0.56) * 11, 2)) * 0.5;
    const y =
      Math.sin(u * 46 + t * 2 * W + seed) * 0.32 +
      Math.sin(u * 113 - t * 3 * W + seed * 2) * 0.18 +
      Math.sin(u * 19 + t * W) * 0.22 +
      Math.sin(u * 230 + t * 4 * W + seed) * 0.1 * (0.3 + burst);
    pts.push(`${x.toFixed(1)},${(mid + y * (height * 0.42) * env * amp * (1 + burst)).toFixed(1)}`);
  }
  const id = `wg${seed}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.25" stopColor={color} stopOpacity={opacity * 0.5} />
          <stop offset="0.8" stopColor={color} stopOpacity={opacity} />
          <stop offset="1" stopColor={color} stopOpacity={opacity * 0.4} />
        </linearGradient>
        <filter id={`${id}b`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke={`url(#${id})`} strokeWidth={strokeWidth * 4} filter={`url(#${id}b)`} opacity={0.6} />
      <polyline points={pts.join(" ")} fill="none" stroke={`url(#${id})`} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

/** A slow field of linked blocks with value pulses running along the links; repeats exactly every LOOP seconds.
 *  Used behind the title and closing slides (recorded as a seamless loop for PowerPoint). */
export function ChainField({ t, width = 1100, height = 900, seed = 3, opacity = 1 }: { t: number; width?: number; height?: number; seed?: number; opacity?: number }) {
  // deterministic layout: a jittered grid of blocks, linked to their right and lower neighbours
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const cols = 7, rows = 6, gx = width / cols, gy = height / rows;
  const nodes = Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    return { x: gx * (c + 0.5) + (rnd() - 0.5) * gx * 0.5, y: gy * (r + 0.5) + (rnd() - 0.5) * gy * 0.45, w: 0.55 + rnd() * 0.45, k: rnd() };
  });
  const edges: [number, number, number][] = [];
  nodes.forEach((_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    if (c < cols - 1 && rnd() > 0.28) edges.push([i, i + 1, rnd()]);
    if (r < rows - 1 && rnd() > 0.55) edges.push([i, i + cols, rnd()]);
    if (c < cols - 1 && r < rows - 1 && rnd() > 0.8) edges.push([i, i + cols + 1, rnd()]);
  });
  const ph = (t % LOOP) / LOOP;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible", opacity }}>
      <defs>
        <radialGradient id={`cf-fade${seed}`} cx="0.62" cy="0.5" r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`cf-mask${seed}`}><rect width={width} height={height} fill={`url(#cf-fade${seed})`} /></mask>
        <filter id={`cf-glow${seed}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <g mask={`url(#cf-mask${seed})`}>
        {edges.map(([a, b], i) => (
          <line key={`e${i}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="rgba(125,184,255,0.16)" strokeWidth={1.4} />
        ))}
        {edges.map(([a, b, k], i) => {
          // each link carries one pulse per loop, offset by its own phase
          const u = (ph + k) % 1;
          if (u > 0.5) return null;
          const v = u / 0.5;
          const x = nodes[a].x + (nodes[b].x - nodes[a].x) * v, y = nodes[a].y + (nodes[b].y - nodes[a].y) * v;
          const o = Math.sin(Math.PI * v);
          return (
            <g key={`p${i}`} opacity={o}>
              <circle cx={x} cy={y} r={7} fill="#3d8bff" filter={`url(#cf-glow${seed})`} opacity={0.8} />
              <circle cx={x} cy={y} r={2.6} fill="#d6e8ff" />
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const sz = 16 + n.w * 16;
          const lit = 0.5 + 0.5 * Math.sin(2 * Math.PI * (ph + n.k));
          return (
            <g key={`n${i}`} transform={`translate(${n.x - sz / 2} ${n.y - sz / 2})`}>
              <rect width={sz} height={sz} rx={sz * 0.22} fill="rgba(10,31,77,0.9)" stroke={`rgba(125,184,255,${0.22 + 0.4 * lit * n.w})`} strokeWidth={1.5} />
              <rect x={sz * 0.3} y={sz * 0.3} width={sz * 0.4} height={sz * 0.4} rx={sz * 0.08} fill={`rgba(125,184,255,${0.15 + 0.5 * lit * n.w})`} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
