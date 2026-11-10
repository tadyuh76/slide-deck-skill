/** Links between boxes on a slide: a quiet base line plus slow travelling dots, with an arrow head. */
export type Pt = [number, number];

export function Link({ d, color = "#7db8ff", base = 0.28, width = 2, arrow = true, flow = true, dashed = false }: {
  d: string; color?: string; base?: number; width?: number; arrow?: boolean; flow?: boolean; dashed?: boolean;
}) {
  const id = `ah-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color} strokeOpacity={base} strokeWidth={width} strokeDasharray={dashed ? "6 8" : undefined} markerEnd={arrow ? `url(#${id})` : undefined} />
      {flow && <path d={d} fill="none" stroke={color} strokeWidth={width + 2.2} className="flow" opacity={0.9} />}
    </g>
  );
}

/** A smooth horizontal S-curve from a to b. */
export const curve = ([x1, y1]: Pt, [x2, y2]: Pt, k = 0.5) => {
  const dx = (x2 - x1) * k;
  return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};
