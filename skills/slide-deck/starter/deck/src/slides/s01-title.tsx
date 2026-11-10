import type { ReactNode } from "react";
import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { useClock } from "../ui/Wave";
import { CrossBorder } from "../ui/World";

/** The dark stage shared by the title and the closing slide: the dotted world, requests crossing borders. */
export function WorldStage({ t, children }: { t: number; children?: ReactNode }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#030817" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 62% at 72% 46%, rgba(24,74,170,0.5), transparent 72%), radial-gradient(30% 40% at 10% 6%, rgba(61,139,255,0.1), transparent 70%)" }} />
        <div style={{ position: "absolute", left: -330, top: 96 }}>
          <CrossBorder t={t} w={2300} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(3,8,23,0.96) 0%, rgba(3,8,23,0.8) 34%, rgba(3,8,23,0.18) 62%, rgba(3,8,23,0) 100%)" }} />
        <div className="vignette" />
        <div className="grain" />
      </div>
      {children}
    </>
  );
}

export function Speaker({ step, active, extra }: { step: number; active: boolean; extra?: ReactNode }) {
  return (
    <B step={step} active={active} style={{ position: "absolute", left: 120, top: 820, width: 1300 }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 24 }}>
        <div style={{ width: 4, borderRadius: 2, background: "var(--accent)" }} />
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}>Tên báo cáo viên</div>
          <div style={{ fontSize: 23, color: "var(--ink-2)", marginTop: 10 }}>Chức danh, đơn vị</div>
          {extra}
        </div>
      </div>
    </B>
  );
}

function Title({ step, active, exporting }: SlideProps) {
  const t = useClock(active && !exporting);
  return (
    <WorldStage t={t}>
      <B step={step} active={active} style={{ position: "absolute", right: 120, top: 96, textAlign: "right" }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 27, fontWeight: 600, color: "var(--ink)" }}>Tên sự kiện</div>
        <div style={{ fontSize: 22, color: "var(--ink-2)", marginTop: 8 }}>Địa điểm, ngày tháng</div>
      </B>
      <div style={{ position: "absolute", left: 120, top: 330, width: 1400 }}>
        <B step={step} active={active}>
          <h1 className="h1" style={{ fontSize: 96, lineHeight: 1.1, letterSpacing: "-0.03em", textWrapStyle: "auto" }}>
            Thu thập dữ liệu điện tử
            <br />
            <em>xuyên biên giới</em>
          </h1>
        </B>
      </div>
      <Speaker step={step} active={active} />
    </WorldStage>
  );
}

export const s01: SlideDef = {
  id: "title",
  title: "Mở đầu",
  act: -1,
  steps: 1,
  minutes: 1,
  Component: Title,
  notes: `Lời mở đầu của báo cáo viên.`,
};
