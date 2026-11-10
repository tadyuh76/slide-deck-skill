import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SlideDef } from "./types";
import { ACTS, clicksOf, notesOf } from "./types";

const params = new URLSearchParams(location.search);
const EXPORT = params.has("export");
const PRESENTER = params.has("presenter");
/** Capture mode: the deck waits dark until window.__start(), videos show their last frame (used to record loops). */
export const CAPTURE = params.has("capture");

function parseHash(n: number): [number, number] {
  const m = location.hash.match(/#\/(\d+)(?:\/(-?\d+))?/);
  if (!m) return [0, 0];
  const s = Math.min(Math.max(parseInt(m[1], 10) - 1, 0), n - 1);
  return [s, m[2] !== undefined ? parseInt(m[2], 10) : EXPORT ? 99 : 0];
}

function useFit(ref: React.RefObject<HTMLDivElement | null>, pad = 0) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.min((r.width - pad) / 1920, (r.height - pad) / 1080));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, pad]);
  return scale;
}

export function Chrome({ def, index, total }: { def?: SlideDef; index: number; total: number }) {
  if (!def || def.act < 0) return null;
  return (
    <>
    <div className="chrome">
      <div className="chrome-left">
        <span>Bản mẫu</span>
      </div>
      <div className="chrome-right">
        <span>{ACTS[def.act]}</span>
        <div className="rail">
          {ACTS.map((_, i) => (
            <i key={i} className={i < def.act ? "done" : i === def.act ? "now" : ""} />
          ))}
        </div>
        <span className="num" style={{ minWidth: 44, textAlign: "right" }}>
          {String(index + 1).padStart(2, "0")}
          <span style={{ opacity: 0.5 }}>/{total}</span>
        </span>
      </div>
    </div>
    </>
  );
}

function SlideView({ def, step: click, active, exporting, muted }: { def: SlideDef; step: number; active: boolean; exporting: boolean; muted?: boolean }) {
  const C = def.Component;
  const cl = clicksOf(def);
  const step = click < 0 ? -1 : cl[Math.min(click, cl.length - 1)];
  return (
    <div
      className="slide"
      style={{
        opacity: active ? 1 : 0,
        visibility: active ? "visible" : "hidden",
        transition: exporting ? "none" : "opacity 0.55s cubic-bezier(0.16,1,0.3,1), visibility 0s linear " + (active ? "0s" : "0.55s"),
        zIndex: active ? 2 : 1,
      }}
      data-muted={muted ? "1" : undefined}
    >
      <C step={step} active={active} exporting={exporting} />
    </div>
  );
}

export function Stage({ slides, index, step, scale, exporting, muted, only, idle }: { slides: SlideDef[]; index: number; step: number; scale: number; exporting: boolean; muted?: boolean; only?: boolean; idle?: boolean }) {
  return (
    <div
      className={`stage ${exporting ? "export" : ""}`}
      style={{ transform: `scale(${scale}) translate(-960px, -540px)` }}
    >
      {slides.map((d, i) =>
        only && i !== index ? null : (
          <SlideView key={d.id} def={d} step={i === index ? step : 0} active={!idle && i === index} exporting={exporting} muted={muted} />
        ),
      )}
      {!idle && <Chrome def={slides[index]} index={index} total={slides.length} />}
    </div>
  );
}

const chan = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("slide-deck") : null;
// The presenter window and the audience window keep each other in sync. BroadcastChannel covers a served deck;
// window.postMessage between opener and popup also covers a deck opened straight from disk (file://).
let peer: Window | null = PRESENTER ? window.opener : null;
const send = (msg: { index: number; step: number }) => {
  chan?.postMessage(msg);
  try { if (peer && !peer.closed) peer.postMessage({ ecrimeDeck: msg }, "*"); } catch { /* ignore */ }
};

declare global { interface Window { __deckMuted?: boolean; __start?: () => void } }

export function Deck({ slides }: { slides: SlideDef[] }) {
  const [[index, step], setPos] = useState<[number, number]>(() => {
    const [s, st] = parseHash(slides.length);
    return [s, Math.min(st, clicksOf(slides[s]).length - 1)];
  });
  const [overview, setOverview] = useState(false);
  const [idle, setIdle] = useState(CAPTURE);
  const vp = useRef<HTMLDivElement>(null);
  const scale = useFit(vp);
  const fromRemote = useRef(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      setPos(([i, s]) => {
        const n = clicksOf(slides[i]).length;
        if (dir > 0) {
          if (s < n - 1) return [i, s + 1];
          if (i < slides.length - 1) return [i + 1, 0];
          return [i, s];
        }
        if (s > 0) return [i, s - 1];
        if (i > 0) return [i - 1, clicksOf(slides[i - 1]).length - 1];
        return [i, s];
      });
    },
    [slides],
  );

  useEffect(() => {
    if (CAPTURE) window.__start = () => setIdle(false);
  }, []);

  useEffect(() => {
    if (EXPORT || CAPTURE) return;
    const h = `#/${index + 1}/${step}`;
    if (location.hash !== h) history.replaceState(null, "", `${location.search}${h}`);
    if (!fromRemote.current) send({ index, step });
    fromRemote.current = false;
  }, [index, step]);

  useEffect(() => {
    const onHash = () => {
      const [s, st] = parseHash(slides.length);
      setPos([s, Math.min(st, clicksOf(slides[s]).length - 1)]);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [slides]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data?.ecrimeDeck ?? (e.currentTarget === chan ? e.data : null);
      if (!d || typeof d.index !== "number") return;
      fromRemote.current = true;
      setPos([d.index, d.step]);
    };
    chan?.addEventListener("message", on);
    window.addEventListener("message", on);
    return () => { chan?.removeEventListener("message", on); window.removeEventListener("message", on); };
  }, []);

  useEffect(() => {
    if (EXPORT) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"].includes(k)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p"].includes(k)) { e.preventDefault(); go(-1); }
      else if (k === "Home") setPos([0, 0]);
      else if (k === "End") setPos([slides.length - 1, 0]);
      else if (k === "f" || k === "F") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }
      else if (k === "o" || k === "O" || (k === "Escape" && overview)) setOverview((v) => !v);
      else if (k === "s" || k === "S") peer = window.open(`${location.pathname}?presenter#/${index + 1}/${step}`, "presenter", "width=1500,height=900");
      else if (k === "m" || k === "M") {
        window.__deckMuted = !window.__deckMuted;
        document.querySelectorAll<HTMLVideoElement>(".viewport video").forEach((v) => { v.muted = !!window.__deckMuted; });
      }
      else if (k === "k" || k === "K") {
        const v = document.querySelector<HTMLVideoElement>(".slide[style*='visible'] video");
        if (v) { if (v.paused) v.play(); else v.pause(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slides.length, overview, index, step]);

  if (PRESENTER) return <Presenter slides={slides} index={index} step={step} go={go} />;

  if (overview) {
    return (
      <div className="overview">
        {slides.map((d, i) => (
          <div key={d.id} className={`cell ${i === index ? "cur" : ""}`} onClick={() => { setPos([i, 0]); setOverview(false); }}>
            <span>{i + 1}. {d.title}</span>
            <MiniStage slides={slides} index={i} step={clicksOf(d).length - 1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="viewport"
      ref={vp}
      onClick={(e) => {
        // a source link opens in a new tab and leaves the deck where it is
        const a = (e.target as HTMLElement).closest("a");
        if (a) { e.preventDefault(); window.open(a.href, "_blank", "noopener"); return; }
        if (!EXPORT && e.button === 0) go(1);
      }}
      onContextMenu={(e) => { e.preventDefault(); go(-1); }}
      style={{ cursor: EXPORT ? "none" : undefined }}
    >
      <Stage slides={slides} index={index} step={step} scale={scale} exporting={EXPORT} idle={idle} />
    </div>
  );
}

function MiniStage({ slides, index, step, muted = true }: { slides: SlideDef[]; index: number; step: number; muted?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useFit(ref);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <Stage slides={slides} index={index} step={step} scale={scale} exporting muted={muted} only />
    </div>
  );
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Presenter({ slides, index, step, go }: { slides: SlideDef[]; index: number; step: number; go: (d: 1 | -1) => void }) {
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  const planned = useMemo(() => slides.slice(0, index).reduce((a, d) => a + d.minutes, 0), [slides, index]);
  const def = slides[index];
  const n = clicksOf(def).length;
  const nextIdx = step < n - 1 ? index : Math.min(index + 1, slides.length - 1);
  const nextStep = step < n - 1 ? step + 1 : 0;
  return (
    <div className="presenter" onClick={() => go(1)}>
      <div className="bar">
        <span className="clock">{fmt(now - t0)}</span>
        <span style={{ color: "var(--ink-3)", fontSize: 22 }}>dự kiến bắt đầu {fmt(planned * 60000)} khung {def.minutes} phút{def.cuttable ? ", có thể bỏ" : ""}</span>
        <span style={{ marginLeft: "auto", fontSize: 22, color: "var(--ink-3)" }}>{index + 1}/{slides.length} · click {step + 1}/{n}</span>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 16, alignContent: "start" }}>
        <div className="frame" style={{ aspectRatio: "16/9" }}><MiniStage slides={slides} index={index} step={step} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 16, minHeight: 0 }}>
        <div className="frame small" style={{ aspectRatio: "16/9" }}><MiniStage slides={slides} index={nextIdx} step={nextStep} /></div>
        <div className="notes">
          <h4>{def.title}</h4>
          {notesOf(def).map((part, i) => (
            <div key={i} style={{ opacity: n > 1 && i !== step ? 0.38 : 1, transition: "opacity .3s", marginBottom: 14, whiteSpace: "pre-wrap" }}>
              {i > 0 && <span style={{ color: "var(--accent)", fontFamily: "var(--display)", fontWeight: 600, marginRight: 8 }}>▸ bấm</span>}
              {part}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
