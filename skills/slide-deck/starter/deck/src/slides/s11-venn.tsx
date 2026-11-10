import { Database, MapPin, RadioTower } from "lucide-react";
import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Art, Bg, Header, IconTile } from "../ui/atoms";

// Venn geometry (slide pixels): three circles and the point where all three overlap
const R = 196;
const C: [number, number][] = [[790, 478], [674, 690], [906, 690]];
const MID: [number, number] = [790, 622];
// leader lines: [from x, y (dot inside the area), to x, y (label side)]
const LEAD: [number, number, number, number][] = [[900, 400, 1040, 400], [590, 800, 440, 800], [990, 800, 1040, 800], [730, 600, 440, 500]];
const LABELS: { t: string; en: string; x: number; y: number; right?: boolean; gold?: boolean }[] = [
  { t: "Tác chiến", en: "Operations", x: 1058, y: 364 },
  { t: "Thông tin tình báo", en: "Intelligence", x: 122, y: 764, right: true },
  { t: "Phát triển năng lực", en: "Capabilities", x: 1058, y: 764 },
  { t: "Hợp tác công tư", en: "Partnerships", x: 122, y: 468, right: true, gold: true },
];
const FACTS = [[MapPin, "Một trụ sở chung"], [Database, "Cơ sở dữ liệu\ndùng chung"], [RadioTower, "Kênh liên lạc\nbảo mật"]] as const;

function Directorate({ step, active }: SlideProps) {
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>3 mảng công việc <em>và phần chung</em></>} width={1400} />
      {/* three overlapping areas, partnerships where all three meet (the speaker's own diagram) */}
      <B step={step} active={active} style={{ position: "absolute", left: 0, top: 0, width: 1360, height: 960 }}>
        <svg width={1360} height={960} style={{ position: "absolute", inset: 0 }}>
          <circle cx={C[0][0]} cy={C[0][1]} r={R} fill="rgba(47,123,234,0.34)" stroke="rgba(125,184,255,0.7)" strokeWidth={2} />
          <circle cx={C[1][0]} cy={C[1][1]} r={R} fill="rgba(31,95,208,0.34)" stroke="rgba(125,184,255,0.7)" strokeWidth={2} />
          <circle cx={C[2][0]} cy={C[2][1]} r={R} fill="rgba(107,166,242,0.3)" stroke="rgba(125,184,255,0.7)" strokeWidth={2} />
          <circle cx={MID[0]} cy={MID[1]} r={74} fill="#0a1f4d" stroke="#f8cd56" strokeWidth={2.5} />
          {LEAD.map(([x1, y1, x2, y2], k) => (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(206,222,246,0.55)" strokeWidth={1.6} />
              <circle cx={x1} cy={y1} r={5} fill="#d6e8ff" />
            </g>
          ))}
        </svg>
        <Art name="i-ops" size={130} style={{ position: "absolute", left: C[0][0] - 65, top: C[0][1] - 138 }} />
        <Art name="i-intel" size={130} style={{ position: "absolute", left: C[1][0] - 128, top: C[1][1] - 20 }} />
        <Art name="i-capab" size={130} style={{ position: "absolute", left: C[2][0] - 2, top: C[2][1] - 20 }} />
        <Art name="i-partner" size={112} style={{ position: "absolute", left: MID[0] - 56, top: MID[1] - 56 }} />
      </B>
      {LABELS.map((l) => (
        <B key={l.t} step={step} active={active} style={{ position: "absolute", left: l.x, top: l.y, width: 300, textAlign: l.right ? "right" : "left" }}>
          <div className="h3" style={{ fontSize: 29, lineHeight: 1.2, color: l.gold ? "var(--gold-ink)" : "var(--ink)" }}>{l.t}</div>
          <div style={{ fontSize: 20, lineHeight: 1.3, color: "var(--ink-3)", marginTop: 6 }}>{l.en}</div>
        </B>
      ))}
      <B step={step} active={active} style={{ position: "absolute", left: 1392, top: 296, width: 408 }}>
        <div className="glass" style={{ height: 600, padding: "34px 36px" }}>
          <div className="num" style={{ fontSize: 92, fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>3</div>
          <div style={{ fontSize: 25, color: "var(--ink-2)", marginTop: 10 }}>mảng, 1 phần chung</div>
          <div style={{ marginTop: 22 }}>
            {FACTS.map(([I, t]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 18, height: 118, borderTop: "1px solid rgba(206,222,246,0.09)" }}>
                <IconTile I={I} size={54} />
                <div style={{ fontSize: 25, lineHeight: 1.35, color: "var(--ink)" }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </B>
    </>
  );
}

export const s11: SlideDef = {
  id: "directorate",
  title: "Sơ đồ Venn",
  act: 2,
  steps: 1,
  minutes: 2,
  Component: Directorate,
  notes: `Ba mảng công việc giao nhau; phần chung nằm ở giữa.`,
};

