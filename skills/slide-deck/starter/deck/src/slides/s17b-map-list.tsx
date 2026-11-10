import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, Header } from "../ui/atoms";
import { place, WorldDots } from "../ui/World";

// A sample group. The lit countries come from tools/worldmap.mjs (flag bit 1).
const PARTNERS: [string, string?][] = [
  ["Brunei"], ["Campuchia"], ["Indonesia"], ["Lào"], ["Malaysia"], ["Myanmar"],
  ["Philippines"], ["Singapore"], ["Thái Lan"], ["Timor-Leste"], ["Việt Nam"],
];

function Treaties({ step, active }: SlideProps) {
  // the map is drawn 3000 wide and cropped to Europe, Africa, Asia and Australia
  const MW = 3000, ROWS = Math.ceil(PARTNERS.length / 2), RH = 40;
  const [x0, y0] = place(60, 45, MW), [x1, y1] = place(160, -20, MW);
  const vw = x1 - x0, vh = y1 - y0, H = 600, Wd = (vw / vh) * H;
  const [vx, vy] = place(105.85, 21.03, MW);
  return (
    <>
      <Bg grid={false} />
      <Header step={step} active={active} title={<>Các nước thành viên <em>ASEAN</em></>} width={1400} />
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 250, width: 1680 }}>
        <div style={{ fontSize: 27, color: "var(--ink-2)" }}>Danh sách bên trái, vị trí trên bản đồ bên phải</div>
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 316, width: 750 }}>
        <div className="glass" style={{ height: 620, padding: "30px 38px", boxShadow: "inset 0 0 0 1.5px rgba(125,184,255,0.42), 0 30px 60px -20px rgba(0,0,0,0.6)", background: "linear-gradient(180deg, rgba(61,139,255,0.14), rgba(61,139,255,0.05))" }}>
          <div style={{ position: "relative", height: ROWS * RH }}>
            {PARTNERS.map(([name, note], i) => (
              <div key={name} style={{ position: "absolute", left: i < ROWS ? 0 : 346, top: (i % ROWS) * RH, height: RH, display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: "#7db8ff", flex: "none" }} />
                <div style={{ fontSize: 25, color: "#fff", fontWeight: 500 }}>{name}</div>
                {note && <div style={{ fontSize: 19, color: "var(--ink-2)" }}>{note}</div>}
              </div>
            ))}
          </div>
        </div>
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: 1840 - Wd, top: 326, width: Wd, height: H }}>
        <svg width={Wd} height={H} viewBox={`${x0} ${y0} ${vw} ${vh}`} style={{ display: "block" }}>
          <WorldDots w={MW} mask={2} base="rgba(125,184,255,0.18)" lit="#8cc4ff" dot={0.72} />
          <circle cx={vx} cy={vy} r={36} fill="rgba(248,205,86,0.25)" />
          <circle cx={vx} cy={vy} r={14} fill="#f8cd56" stroke="#071a40" strokeWidth={5} />
        </svg>
      </B>
    </>
  );
}

export const s17b: SlideDef = {
  id: "treaties",
  title: "Danh sách và bản đồ",
  act: 2,
  steps: 1,
  minutes: 1.5,
  Component: Treaties,
  notes: `Ghi chú của báo cáo viên.`,
};
