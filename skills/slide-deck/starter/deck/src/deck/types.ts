import type { FC } from "react";

export type SlideProps = { step: number; active: boolean; exporting: boolean };

export type SlideDef = {
  id: string;
  title: string;
  /** index into ACTS; -1 = no chrome */
  act: number;
  /** internal build steps the slide component knows (0..steps-1) */
  steps: number;
  /** which internal step each click shows; default one click per step. Fewer clicks: e.g. [1, 3] */
  builds?: number[];
  minutes: number;
  notes: string;
  cuttable?: boolean;
  /** temporarily left out of the deck, the PowerPoint, the PDF and the script */
  hidden?: boolean;
  Component: FC<SlideProps>;
};

export const ACTS = ["Mở đầu", "Nội dung", "Sơ đồ"];

/** The internal step shown at each click of a slide. */
export const clicksOf = (d: SlideDef) => d.builds ?? Array.from({ length: d.steps }, (_, i) => i);

/** Speaker notes per click: the "(click)" segments of the notes, merged to match the slide's clicks. */
export const notesOf = (d: SlideDef) => {
  const parts = d.notes.split("(click)").map((p) => p.trim());
  const cl = clicksOf(d);
  return cl.map((to, c) => parts.slice(c === 0 ? 0 : cl[c - 1] + 1, to + 1).filter(Boolean).join("\n\n"));
};
