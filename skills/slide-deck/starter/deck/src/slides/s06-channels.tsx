import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, HaloArt, Header } from "../ui/atoms";
import { Link } from "../ui/Links";

export const CHANNELS = [
  { art: "m-direct", t: "Truy cập\ntrực tiếp", d: "Tự thu thập\ndữ liệu điện tử" },
  { art: "m-provider", t: "Yêu cầu trực tiếp\nnhà cung cấp", d: "Đề nghị bảo quản,\ncung cấp thông tin" },
  { art: "m-formal", t: "Yêu cầu\nchính thức", d: "Tương trợ tư pháp\nvề hình sự" },
  { art: "m-informal", t: "Yêu cầu\nkhông chính thức", d: "Kênh cảnh sát,\nkênh ngoại giao" },
  { art: "m-joint", t: "Điều tra\nchung", d: "Nhiều nước cùng\nđiều tra một vụ" },
];

function Channels({ step, active }: SlideProps) {
  // the data abroad sits at the hub, the five ways fan out above it
  const HUB = [960, 748], RX = 640, RY = 392, ANG = [172, 131, 90, 49, 8];
  const at = (a: number) => [HUB[0] + RX * Math.cos((a * Math.PI) / 180), HUB[1] - RY * Math.sin((a * Math.PI) / 180)];
  return (
    <>
      <Bg grid={false} />
      <Header step={step} active={active} title={<>5 cách thu thập dữ liệu <em>xuyên biên giới</em></>} width={1500} />
      <B step={step} active={active} style={{ position: "absolute", inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path d={`M${HUB[0] - RX} ${HUB[1]} A${RX} ${RY} 0 0 1 ${HUB[0] + RX} ${HUB[1]}`} fill="none" stroke="rgba(125,184,255,0.16)" strokeWidth={1.5} strokeDasharray="4 12" />
          {ANG.map((a) => { const [x, y] = at(a); const k = 0.3, m = a === 90 ? 0.56 : 0.7; return <Link key={a} d={`M${HUB[0] + (x - HUB[0]) * k} ${HUB[1] + (y - HUB[1]) * k} L${HUB[0] + (x - HUB[0]) * m} ${HUB[1] + (y - HUB[1]) * m}`} width={2.2} base={0.4} />; })}
        </svg>
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: HUB[0] - 200, top: HUB[1] - 104, width: 400, textAlign: "center" }}>
        <HaloArt name="hero" size={208} style={{ margin: "0 auto" }} />
        <div className="h3" style={{ fontSize: 28, marginTop: 8 }}>Dữ liệu ở nước ngoài</div>
      </B>
      {CHANNELS.map((c, i) => {
        const [x, y] = at(ANG[i]);
        return (
          <B key={c.t} step={step} active={active} style={{ position: "absolute", left: x - 150, top: y - 76, width: 300, textAlign: "center" }}>
            <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
              <HaloArt name={c.art} size={140} />
              <span className="num" style={{ position: "absolute", left: -14, top: -6, width: 42, height: 42, borderRadius: 21, display: "grid", placeItems: "center", background: "#0b2a66", boxShadow: "inset 0 0 0 2px #7db8ff", color: "#fff", fontSize: 21, fontWeight: 600, letterSpacing: 0 }}>{i + 1}</span>
            </div>
            <div className="h3" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 10 }}>{c.t}</div>
          </B>
        );
      })}
    </>
  );
}

export const s06: SlideDef = {
  id: "channels",
  title: "Các kênh thu thập xuyên biên giới",
  act: 1,
  steps: 1,
  minutes: 1.5,
  Component: Channels,
  notes: `Ghi chú của báo cáo viên.`,
};
