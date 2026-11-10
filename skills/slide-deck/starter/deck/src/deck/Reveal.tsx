import type { CSSProperties, ReactNode } from "react";

/** A build element. at=0 (default) is there with the slide, no animation; at=1 is the slide's one click reveal. */
export function B({
  at = 0,
  step,
  active,
  children,
  className = "",
  style,
}: {
  at?: number;
  step: number;
  active: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const on = at === 0 || (active && step >= at);
  return (
    <div data-at={at} className={`b ${on ? "on" : "off"} ${className}`} style={style}>
      {children}
    </div>
  );
}
