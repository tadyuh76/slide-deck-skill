import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { useClock } from "../ui/Wave";
import { Speaker, WorldStage } from "./s01-title";

function Close({ step, active, exporting }: SlideProps) {
  const t = useClock(active && !exporting);
  return (
    <WorldStage t={t}>
      <div style={{ position: "absolute", left: 120, top: 340, width: 1100 }}>
        <B step={step} active={active}>
          <h1 className="h1" style={{ fontSize: 128, lineHeight: 1.04, letterSpacing: "-0.035em" }}>
            <em>Xin cảm ơn</em>
          </h1>
        </B>
        <B step={step} active={active}>
          <p className="lead" style={{ marginTop: 34, fontSize: 40, color: "var(--ink-2)" }}>Các đồng chí có câu hỏi nào không?</p>
        </B>
      </div>
      <Speaker step={step} active={active} />
    </WorldStage>
  );
}

export const s19: SlideDef = {
  id: "close",
  title: "Xin cảm ơn",
  act: -1,
  steps: 1,
  minutes: 1,
  Component: Close,
  notes: `Lời cảm ơn và phần hỏi đáp.`,
};
