import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, Feature, HaloArt, Header } from "../ui/atoms";

const CASES: [string, string][] = [
  ["e-injury", "Nguy cơ thương vong\nnặng hoặc tử vong"],
  ["e-child", "Trẻ em sắp\nbị tổn hại"],
  ["e-exploit", "Khai thác tình dục\ntrẻ em"],
  ["e-kidnap", "Bắt cóc"],
  ["e-suicide", "Tự tử"],
  ["e-terror", "Nguy cơ khủng bố"],
];

function Emergency({ step, active }: SlideProps) {
  const W = 356, G = 24, H = 248;
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Yêu cầu trong <em>tình huống khẩn cấp</em></>} width={1400} />
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 262, width: 1680 }}>
        <div style={{ fontSize: 27, color: "var(--ink-2)" }}>Gửi thẳng đến nhà cung cấp dịch vụ, vượt qua các kênh trao đổi thông tin truyền thống</div>
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 340, width: 1116, height: H * 2 + G }}>
        {CASES.map(([art, t], i) => (
          <div key={t} className="glass" style={{ position: "absolute", left: (i % 3) * (W + G), top: Math.floor(i / 3) * (H + G), width: W, height: H, padding: "20px 28px 26px", display: "flex", flexDirection: "column" }}>
            <HaloArt name={art} size={116} />
            <div style={{ fontFamily: "var(--display)", fontSize: 27, fontWeight: 600, lineHeight: 1.24, marginTop: "auto" }}>{t}</div>
          </div>
        ))}
      </B>
      <B step={step} active={active} style={{ position: "absolute", left: 1260, top: 340, width: 540 }}>
        <Feature style={{ height: 520, padding: "30px 40px 36px", display: "flex", flexDirection: "column" }}>
          <HaloArt name="secrecy" size={190} style={{ margin: "0 auto" }} />
          <div className="h3" style={{ fontSize: 36, color: "#fff", marginTop: "auto" }}>Luôn kèm yêu cầu bảo mật</div>
          <div style={{ fontSize: 26, lineHeight: 1.45, color: "#d5e4fb", marginTop: 16 }}>{"Để nhà cung cấp dịch vụ\nkhông thông báo cho đối tượng\nvề việc cung cấp thông tin"}</div>
        </Feature>
      </B>
    </>
  );
}

export const s09: SlideDef = {
  id: "emergency",
  title: "Lưới ô và một ô nhấn",
  act: 1,
  steps: 1,
  minutes: 2.5,
  Component: Emergency,
  notes: `Ghi chú của báo cáo viên.`,
};
