import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, HaloArt, Header } from "../ui/atoms";
import { Link } from "../ui/Links";

const WORK = [
  { art: "d-investigate", t: "Hỗ trợ điều tra,\nđiều phối tác chiến", d: "Nâng cao năng lực\nđối phó tội phạm mạng" },
  { art: "d-analysis", t: "Phân tích và tình báo\nvề mối đe dọa", d: "Thêm thông tin\nđể ứng phó hiệu quả" },
  { art: "d-jointops", t: "Khung tác chiến chung,\nhọp nhóm công tác", d: "Tăng cường hợp tác\ntrong các chiến dịch chung" },
  { art: "d-aware", t: "Nâng cao nhận thức,\nxây dựng đối tác", d: "Thúc đẩy thói quen an toàn\ntrên không gian mạng" },
];

function AspDesk({ step, active }: SlideProps) {
  // the project at the centre, its four lines of work in the corners
  const CX = 960, CY = 600, AY = [420, 780];
  return (
    <>
      <Bg grid={false} />
      <Header step={step} active={active} title={<>4 hoạt động <em>của dự án</em></>} width={1500} />
      <B step={step} active={active} style={{ position: "absolute", inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[[790, AY[0]], [1130, AY[0]], [790, AY[1]], [1130, AY[1]]].map(([x, y]) => <line key={`${x}-${y}`} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(125,184,255,0.4)" strokeWidth={2} strokeDasharray="4 10" strokeLinecap="round" />)}
          <circle cx={CX} cy={CY} r={148} fill="#0a1f4d" stroke="rgba(125,184,255,0.7)" strokeWidth={2} />
          <circle cx={CX} cy={CY} r={176} fill="none" stroke="rgba(125,184,255,0.18)" strokeWidth={1.5} />
        </svg>
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: CX - 130, top: CY - 62, width: 260, textAlign: "center" }}>
        <div className="h3" style={{ fontSize: 34, marginTop: 40 }}>Dự án</div>
      </B>
      {WORK.map((w, i) => {
        const right = i % 2 === 1, y = AY[Math.floor(i / 2)];
        return (
          <B key={w.t} step={step} active={active} style={{ position: "absolute", left: right ? 1150 : 120, top: y - 84, width: 650 }}>
            <div style={{ display: "flex", flexDirection: right ? "row-reverse" : "row", alignItems: "center", gap: 26, height: 168, textAlign: right ? "right" : "left" }}>
              <HaloArt name={w.art} size={168} />
              <div>
                <div className="h3" style={{ fontSize: 30, lineHeight: 1.22 }}>{w.t}</div>
                <div style={{ fontSize: 22, lineHeight: 1.45, color: "var(--ink-2)", marginTop: 10 }}>{w.d}</div>
              </div>
            </div>
          </B>
        );
      })}
    </>
  );
}

export const s14: SlideDef = {
  id: "aspdesk",
  title: "Bốn góc quanh một tâm",
  act: 2,
  steps: 1,
  minutes: 2,
  Component: AspDesk,
  notes: `Ghi chú của báo cáo viên.`,
};

const GATE = [
  { n: 1, t: "Chia sẻ thông tin an toàn", en: "Share" },
  { n: 2, t: "Phân tích chung", en: "Analyse" },
  { n: 3, t: "Phối hợp hành động", en: "Act" },
];

function Gateway({ step, active }: SlideProps) {
  // a bridge: companies on one bank, police on the other, three lanes of cooperation between them
  const LY = [330, 492, 654], LH = 138;
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Hợp tác <em>giữa doanh nghiệp và cảnh sát</em></>} width={1500} />
      <B step={step} active={active} style={{ position: "absolute", inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {LY.map((y) => <Link key={y} d={`M452 ${y + LH / 2} H1466`} width={2.5} base={0.45} arrow={false} />)}
        </svg>
      </B>
      {[{ x: 120, art: "t-provider", t: "Doanh nghiệp", d: "Đối tác tư nhân\nđã được thẩm định" }, { x: 1470, art: "n-unit", t: "Cảnh sát", d: "Thực thi pháp luật\ntrên toàn thế giới" }].map((n) => (
        <B key={n.t} step={step} active={active} style={{ position: "absolute", left: n.x, top: 330, width: 330 }}>
          <div className="glass" style={{ height: 462, padding: "34px 30px", textAlign: "center", display: "flex", flexDirection: "column" }}>
            <HaloArt name={n.art} size={210} style={{ margin: "0 auto" }} />
            <div style={{ marginTop: "auto" }}>
              <div className="h3" style={{ fontSize: 34 }}>{n.t}</div>
              <div style={{ fontSize: 22, lineHeight: 1.45, color: "var(--ink-2)", marginTop: 10 }}>{n.d}</div>
            </div>
          </div>
        </B>
      ))}
      {GATE.map((g, i) => (
        <B key={g.t} step={step} active={active} style={{ position: "absolute", left: 520, top: LY[i], width: 880 }}>
          <div style={{ height: LH, borderRadius: LH / 2, padding: "0 44px 0 36px", display: "flex", alignItems: "center", gap: 28, background: "#0c2152", boxShadow: "inset 0 0 0 1.5px rgba(125,184,255,0.5), 0 24px 50px -20px rgba(0,0,0,0.6)" }}>
            <span className="num" style={{ width: 62, height: 62, borderRadius: 31, flex: "none", display: "grid", placeItems: "center", fontSize: 29, fontWeight: 600, letterSpacing: 0, color: "#fff", background: "#1d58c8" }}>{g.n}</span>
            <div>
              <div className="h3" style={{ fontSize: 32 }}>{g.t}</div>
              <div style={{ fontSize: 21, color: "var(--ink-3)", marginTop: 6 }}>{g.en}</div>
            </div>
          </div>
        </B>
      ))}
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 838, width: 1680 }}>
        <div style={{ fontSize: 25, color: "var(--ink-2)" }}>Hai bên trao đổi qua ba làn hợp tác.</div>
      </B>
    </>
  );
}

export const s15: SlideDef = {
  id: "gateway",
  title: "Cây cầu giữa hai bên",
  act: 2,
  steps: 1,
  minutes: 2,
  Component: Gateway,
  notes: `Ghi chú của báo cáo viên.`,
};
