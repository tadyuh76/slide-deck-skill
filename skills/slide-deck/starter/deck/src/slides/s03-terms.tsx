import type { SlideDef, SlideProps } from "../deck/types";
import { B } from "../deck/Reveal";
import { Bg, CONVENTION, Feature, HaloArt, Header, Source } from "../ui/atoms";

const TYPES = [
  { art: "t-subscriber", q: "Ai đứng tên?", t: "Thông tin thuê bao", en: "subscriber information", what: "Họ tên, địa chỉ, số điện thoại, thanh toán,\nloại dịch vụ và thời gian sử dụng" },
  { art: "t-traffic", q: "Khi nào, từ đâu, tới đâu?", t: "Dữ liệu về lưu lượng", en: "traffic data", what: "Nguồn, đích, lộ trình, ngày giờ,\ndung lượng, thời lượng, loại hình liên lạc" },
  { art: "t-content", q: "Trao đổi nội dung gì?", t: "Dữ liệu về nội dung", en: "content data", what: "Chữ viết, hình ảnh, giọng nói,\nbản ghi âm, bản ghi hình" },
];

function DataTypes({ step, active }: SlideProps) {
  // one full-width row per kind of data: picture, the question it answers, its name, what it holds
  const H = 190, G = 22;
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Tương trợ tư pháp <em>thu thập 3 loại thông tin</em></>} width={1500} />
      {TYPES.map((x, i) => (
        <B key={x.t} step={step} active={active} style={{ position: "absolute", left: 120, top: 296 + i * (H + G), width: 1680 }}>
          <div className="glass" style={{ height: H, display: "flex", alignItems: "center", padding: "0 44px 0 30px" }}>
            <HaloArt name={x.art} size={160} />
            <div style={{ width: 430, marginLeft: 30, fontFamily: "var(--display)", fontSize: 31, fontWeight: 600, lineHeight: 1.2, color: "var(--accent-ink)" }}>{x.q}</div>
            <div style={{ width: 1, height: 96, background: "rgba(206,222,246,0.12)" }} />
            <div style={{ width: 400, marginLeft: 40 }}>
              <div className="h3" style={{ fontSize: 33 }}>{x.t}</div>
              <div style={{ fontSize: 21, color: "var(--ink-3)", marginTop: 8 }}>{x.en}</div>
            </div>
            <div style={{ fontSize: 23, lineHeight: 1.45, color: "var(--ink-2)", marginLeft: "auto", width: 520 }}>{x.what}</div>
          </div>
        </B>
      ))}
      <B step={step} active={active}>
        <Source items={[CONVENTION]} />
      </B>
    </>
  );
}

export const s03: SlideDef = {
  id: "datatypes",
  title: "Các hàng ngang",
  act: 1,
  steps: 1,
  minutes: 3,
  Component: DataTypes,
  notes: `Ghi chú của báo cáo viên.`,
};

const BIG = { art: "t-edata", t: "Dữ liệu điện tử", en: "electronic data", what: "Mọi thông tin ở dạng hệ thống\ncông nghệ thông tin xử lý được,\nkể cả phần mềm" };
const TERMS = [
  { art: "t-provider", t: "Nhà cung cấp dịch vụ", en: "service provider", tag: "", what: "Tổ chức công hoặc tư\ncung cấp dịch vụ liên lạc,\nxử lý, lưu trữ dữ liệu" },
  { art: "t-emergency", t: "Tình huống khẩn cấp", en: "emergency", tag: "", what: "Nguy hiểm nghiêm trọng,\ncó thể xảy ra ngay\nvới tính mạng, an toàn" },
  { art: "t-freeze", t: "Phong tỏa, thu giữ", en: "freezing, seizure", tag: "Tạm thời", what: "cấm chuyển dịch, hoặc\ntạm giữ, kiểm soát tài sản" },
  { art: "t-confiscate", t: "Tịch thu", en: "confiscation", tag: "Vĩnh viễn", what: "tước đi tài sản\ntheo lệnh của tòa án,\ncơ quan có thẩm quyền" },
];

function Terms({ step, active }: SlideProps) {
  // bento: the widest idea gets the tall tile, the other four sit in a 2 x 2 beside it
  const W = 532, H = 288, G = 24, X0 = 712;
  return (
    <>
      <Bg />
      <Header step={step} active={active} title={<>Một số từ ngữ cơ bản <em>theo Công ước Hà Nội</em></>} width={1500} />
      <B step={step} active={active} style={{ position: "absolute", left: 120, top: 296, width: 568 }}>
        <Feature style={{ height: 600, padding: "36px 44px 40px", display: "flex", flexDirection: "column" }}>
          <HaloArt name={BIG.art} size={300} style={{ margin: "0 auto" }} />
          <div style={{ marginTop: "auto" }}>
            <div className="h3" style={{ fontSize: 42, color: "#fff" }}>{BIG.t}</div>
            <div style={{ fontSize: 22, color: "#b9cdf0", marginTop: 8 }}>{BIG.en}</div>
            <div style={{ fontSize: 26, lineHeight: 1.45, color: "#e3ecfb", marginTop: 18 }}>{BIG.what}</div>
          </div>
        </Feature>
      </B>
      {TERMS.map((x, i) => (
        <B key={x.t} step={step} active={active} style={{ position: "absolute", left: X0 + (i % 2) * (W + G), top: 296 + Math.floor(i / 2) * (H + G), width: W }}>
          <div className="glass" style={{ height: H, padding: "0 30px 0 24px", display: "flex", alignItems: "center", gap: 22 }}>
            <HaloArt name={x.art} size={150} />
            <div>
              <div className="h3" style={{ fontSize: 28, whiteSpace: "nowrap" }}>{x.t}</div>
              <div style={{ fontSize: 20, color: "var(--ink-3)", marginTop: 6 }}>{x.en}</div>
              {x.tag && <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 600, lineHeight: 1.45, color: "var(--accent-ink)", marginTop: 14 }}>{x.tag}</div>}
              <div style={{ fontSize: 21, lineHeight: 1.45, color: "var(--ink-2)", marginTop: x.tag ? 0 : 14 }}>{x.what}</div>
            </div>
          </div>
        </B>
      ))}
      <B step={step} active={active}>
        <Source items={[CONVENTION]} />
      </B>
    </>
  );
}

export const s04: SlideDef = {
  id: "terms",
  title: "Thuật ngữ theo Công ước Hà Nội",
  act: 1,
  steps: 1,
  minutes: 2.5,
  Component: Terms,
  notes: `Ghi chú của báo cáo viên.`,
};
