import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, HaloArt, Header } from "../ui/atoms";
import { Link } from "../ui/Links";

const PARTS = [
  { art: "t-edata", t: "Thuật ngữ", sub: "Các từ ngữ cơ bản\ntheo Công ước Hà Nội" },
  { art: "p-storage", t: "Bảo quản dữ liệu", sub: "Giữ cho dữ liệu\nkhông bị thay đổi" },
  { art: "hero", t: "Thu thập xuyên biên giới", sub: "Các kênh hợp tác quốc tế\nvà cách dùng" },
];

function Agenda({ step, active }: SlideProps) {
  // three steps rising to the right, joined by one path
  const POS = [[120, 548], [700, 418], [1280, 288]];
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Nội dung gồm <em>3 phần</em></>} width={1100} />
      <B step={step} active={active} style={{ position: "absolute", inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Link d="M130 968 C 520 968, 560 838, 760 838 S 1100 708, 1340 708 S 1640 640, 1800 600" width={2.5} base={0.35} arrow={false} />
        </svg>
      </B>
      {PARTS.map((p, i) => (
        <B key={p.t} step={step} active={active} style={{ position: "absolute", left: POS[i][0], top: POS[i][1], width: 520 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
            <div className="num" style={{ fontSize: 190, fontWeight: 600, lineHeight: 0.78, color: "rgba(125,184,255,0.2)" }}>{i + 1}</div>
            <HaloArt name={p.art} size={200} />
          </div>
          <div className="h3" style={{ fontSize: 40, marginTop: 26 }}>{p.t}</div>
          <div style={{ fontSize: 25, lineHeight: 1.42, color: "var(--ink-2)", marginTop: 12 }}>{p.sub}</div>
        </B>
      ))}
    </>
  );
}

export const s02: SlideDef = {
  id: "agenda",
  title: "Nội dung",
  act: 1,
  steps: 1,
  minutes: 1,
  Component: Agenda,
  notes: `Ghi chú của báo cáo viên.`,
};
