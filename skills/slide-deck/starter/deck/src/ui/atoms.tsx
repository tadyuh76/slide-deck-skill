import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { B } from "../deck/Reveal";

export function Bg({ grid = true, children }: { grid?: boolean; children?: ReactNode }) {
  return (
    <div className="bg">
      <div className="bg-glow" />
      {grid && <div className="bg-grid" />}
      {children}
      <div className="grain" />
    </div>
  );
}

/** Standard slide header: the headline, top-left at the deck margins. */
export function Header({ title, step, active, width = 1500, size }: { title: ReactNode; step: number; active: boolean; width?: number; size?: number }) {
  return (
    <div style={{ position: "absolute", left: 120, top: 112, width }}>
      <B step={step} active={active}>
        <h1 className="h1" style={{ fontSize: size ?? 66 }}>{title}</h1>
      </B>
    </div>
  );
}

/** A source line at the foot of a slide: each source is a link to the page it came from. */
export function Source({ items, note, x = 120, y = 978, w = 1680 }: { items: [string, string][]; note?: string; x?: number; y?: number; w?: number }) {
  return (
    <div className="src" style={{ position: "absolute", left: x, top: y, width: w }}>
      {"Nguồn: "}
      {items.map(([label, href], i) => (
        <span key={href}>{i > 0 && "; "}<a href={href} target="_blank" rel="noreferrer">{label}</a></span>
      ))}
      {note && <span>{`. ${note}`}</span>}
    </div>
  );
}

/** A field label led by an icon, so a row can be scanned by its icon. */
export function Field({ I, children, color = "var(--ink-3)", size = 24 }: { I: LucideIcon; children: ReactNode; color?: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: size, color }}>
      <I size={Math.round(size * 1.05)} strokeWidth={1.8} color="#7db8ff" style={{ flex: "none" }} />
      <div>{children}</div>
    </div>
  );
}

/** A wordmark logo on a light (or dark) rounded tile: for brands whose mark is wide. */
export function LogoTile({ name, w = 220, h = 96, dark, pad = 16, style }: { name: string; w?: number; h?: number; dark?: boolean; pad?: number; style?: CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 16, background: dark ? "#111416" : "#f3f6fb", display: "grid", placeItems: "center", flex: "none",
      boxShadow: "0 8px 20px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.4)", ...style }}>
      <img src={`./logos/${name}`} alt="" draggable={false} style={{ maxWidth: w - pad * 2, maxHeight: h - pad * 2, objectFit: "contain" }} />
    </div>
  );
}

/** One of the deck's SHIELD-style illustrations (public/art, transparent webp). */
export function Art({ name, size = 160, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <img src={`./art/${name}.webp`} alt="" draggable={false} style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }} />;
}

/** An illustration on a soft teal halo, the way cards carry their art. */
export function HaloArt({ name, size = 150, style }: { name: string; size?: number; style?: CSSProperties }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none", ...style }}>
      <div style={{ position: "absolute", inset: "16%", borderRadius: "50%", background: "radial-gradient(circle, rgba(40,96,200,0.5), transparent 70%)", filter: "blur(18px)" }} />
      <Art name={name} size={size} style={{ position: "relative" }} />
    </div>
  );
}

/** A chain or token logo (public/logos). */
export function Logo({ name, size = 48, style }: { name: string; size?: number; style?: CSSProperties }) {
  const src = name.includes(".") ? `./logos/${name}` : `./logos/${name}.svg`;
  return <img src={src} alt="" draggable={false} style={{ display: "block", width: size, height: size, objectFit: "contain", flex: "none", ...style }} />;
}

export function Chip({ children, tone = "dim", style }: { children: ReactNode; tone?: "blue" | "harm" | "gold" | "dim"; style?: CSSProperties }) {
  return <span className={`chip ${tone}`} style={style}>{children}</span>;
}

/** A frosted card. */
export function Card({ children, style, glow }: { children?: ReactNode; style?: CSSProperties; glow?: "blue" | "harm" | "gold" }) {
  const ring = glow === "blue" ? "rgba(125,184,255,0.36)" : glow === "harm" ? "rgba(255,138,128,0.34)" : glow === "gold" ? "rgba(248,205,86,0.34)" : null;
  return (
    <div className="glass" style={{ padding: "28px 32px", ...(ring ? { boxShadow: `inset 0 0 0 1.5px ${ring}, inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 60px -20px rgba(0,0,0,0.6)` } : {}), ...style }}>
      {children}
    </div>
  );
}

/** The highlighted teal panel (one per slide at most): a measured fact with its source. */
export function Feature({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      position: "relative", borderRadius: 20, padding: "28px 32px", overflow: "hidden",
      background: "linear-gradient(155deg, rgba(24,74,170,0.9), rgba(8,26,72,0.94) 70%)",
      boxShadow: "inset 0 0 0 1.5px rgba(125,184,255,0.4), inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 80px -30px rgba(61,139,255,0.5)",
      ...style,
    }}>
      {children}
    </div>
  );
}

/** A small round number badge. */
export function Badge({ n, tone = "blue", size = 40 }: { n: ReactNode; tone?: "blue" | "gold" | "harm"; size?: number }) {
  const c = tone === "blue" ? ["rgba(61,139,255,0.14)", "rgba(125,184,255,0.5)", "var(--accent-ink)"] : tone === "gold" ? ["rgba(248,205,86,0.14)", "rgba(248,205,86,0.5)", "var(--gold-ink)"] : ["rgba(255,93,82,0.14)", "rgba(255,138,128,0.5)", "var(--harm-ink)"];
  return (
    <span className="num" style={{ display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: size / 2, flex: "none",
      background: c[0], boxShadow: `inset 0 0 0 1.5px ${c[1]}`, color: c[2], fontSize: size * 0.5, fontWeight: 600, letterSpacing: 0 }}>{n}</span>
  );
}

/** A brand mark on a small white tile, the way it appears as an app icon (public/logos). */
export function AppIcon({ name, size = 52, style, dark }: { name: string; size?: number; style?: CSSProperties; dark?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: dark ? "#16191b" : "#f3f6fb", display: "grid", placeItems: "center", flex: "none",
      boxShadow: "0 8px 20px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.4)", ...style }}>
      <img src={name.includes(".") ? `./logos/${name}` : `./logos/${name}.svg`} alt="" draggable={false} style={{ width: size * 0.74, height: size * 0.74, objectFit: "contain" }} />
    </div>
  );
}

/** A big figure with its unit, as two separate text blocks on one baseline (one text box each in PowerPoint). */
export function Stat({ n, u, size = 96, color = "var(--ink)", uSize, uColor = "var(--ink-2)", style }: {
  n: ReactNode; u?: ReactNode; size?: number; color?: string; uSize?: number; uColor?: string; style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: Math.max(12, Math.round(size * 0.2)), ...style }}>
      <div className="num" style={{ fontSize: size, fontWeight: 600, lineHeight: 1, color, whiteSpace: "nowrap" }}>{n}</div>
      {u && <div style={{ fontSize: uSize ?? Math.round(size * 0.34), fontWeight: 500, lineHeight: 1, color: uColor, whiteSpace: "nowrap" }}>{u}</div>}
    </div>
  );
}

/** A lucide icon on a small blue tile. */
export function IconTile({ I, size = 56 }: { I: LucideIcon; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.27, flex: "none", display: "grid", placeItems: "center", background: "rgba(61,139,255,0.12)", boxShadow: "inset 0 0 0 1px rgba(125,184,255,0.32)" }}>
      <I size={Math.round(size * 0.5)} strokeWidth={1.8} color="#7db8ff" />
    </span>
  );
}

/** The Hà Nội Convention as a source. */
export const CONVENTION: [string, string] = ["Công ước của Liên hợp quốc về chống tội phạm mạng (Công ước Hà Nội), Điều 2", "https://www.unodc.org/unodc/en/cybercrime/convention/text/convention-full-text.html"];
