import { FileCheck2, Fingerprint, Scale } from "lucide-react";
import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, Feature, HaloArt, Header, IconTile } from "../ui/atoms";
import { Link } from "../ui/Links";

const GOALS = [[FileCheck2, "Không bị thay đổi"], [Fingerprint, "Truy xuất được\nnguồn gốc"], [Scale, "Đủ điều kiện dùng\ntrong tư pháp"]] as const;

const STEPS = [
  { art: "p-collect", t: "Thu thập\ndữ liệu", d: "Lấy dữ liệu theo\nquy trình\ncó kiểm soát" },
  { art: "p-hash", t: "Tạo mã băm\n(hashing)", d: "Dấu vân tay của\ndữ liệu, sửa 1 ký tự\nlà mã khác" },
  { art: "p-access", t: "Kiểm soát\ntruy cập", d: "Chỉ người\ncó thẩm quyền\nđược tiếp cận" },
  { art: "p-custody", t: "Chuỗi bảo quản\nchứng cứ", d: "Ghi lại ai giữ,\nlúc nào, làm gì\n(chain of custody)" },
  { art: "p-storage", t: "Lưu trữ\nan toàn", d: "Chống mất mát,\nlàm sai lệch" },
];

function Preserve({ step, active }: SlideProps) {
  // five stations on one line, flowing into what the data is worth at the end
  const CW = 242, X0 = 120, LY = 360;
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Bảo quản dữ liệu điện tử <em>gồm 5 việc</em></>} width={1500} />
      <B step={step} active={active} style={{ position: "absolute", inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Link d={`M${X0 + CW / 2} ${LY} H1352`} width={2.5} base={0.45} />
        </svg>
      </B>
      {STEPS.map((s, i) => (
        <B key={s.t} step={step} active={active} style={{ position: "absolute", left: X0 + i * CW, top: LY - 24, width: CW, textAlign: "center" }}>
          <span className="num" style={{ display: "inline-grid", placeItems: "center", width: 48, height: 48, borderRadius: 24, background: "#0b2a66", boxShadow: "inset 0 0 0 2px #7db8ff", color: "#fff", fontSize: 24, fontWeight: 600, letterSpacing: 0 }}>{i + 1}</span>
          <HaloArt name={s.art} size={196} style={{ margin: "34px auto 0" }} />
          <div className="h3" style={{ fontSize: 27, marginTop: 22, lineHeight: 1.22 }}>{s.t}</div>
          <div style={{ fontSize: 21, lineHeight: 1.45, color: "var(--ink-2)", marginTop: 12 }}>{s.d}</div>
        </B>
      ))}
      <B step={step} active={active} style={{ position: "absolute", left: 1372, top: 312, width: 428 }}>
        <Feature style={{ height: 560, padding: "34px 36px" }}>
          <div className="h3" style={{ fontSize: 31, color: "#fff" }}>{"Dữ liệu sau khi\nbảo quản"}</div>
          <div style={{ marginTop: 22 }}>
            {GOALS.map(([I, t]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 18, height: 96, borderTop: "1px solid rgba(255,255,255,0.14)" }}>
                <IconTile I={I} size={52} />
                <div style={{ fontSize: 25, lineHeight: 1.3, color: "#fff" }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.45, color: "#b9cdf0", marginTop: 18 }}>{"Áp dụng cho hệ thống, nhật ký (log),\nthiết bị và dịch vụ đám mây"}</div>
        </Feature>
      </B>
    </>
  );
}

export const s05: SlideDef = {
  id: "preserve",
  title: "Bảo quản dữ liệu điện tử",
  act: 1,
  steps: 1,
  minutes: 3,
  Component: Preserve,
  notes: `Ghi chú của báo cáo viên.`,
};
