import { Deck } from "./deck/Deck";
import { SLIDES } from "./slides";
import { clicksOf, notesOf } from "./deck/types";

declare global { interface Window { __SLIDES__?: { id: string; steps: number; title: string; notes: string; clickNotes: string[]; clicks: number[]; minutes: number; cuttable?: boolean}[] } }
window.__SLIDES__ = SLIDES.map((s) => ({ id: s.id, steps: clicksOf(s).length, title: s.title, notes: notesOf(s).join("\n\n(click) "), clickNotes: notesOf(s), clicks: clicksOf(s), minutes: s.minutes, cuttable: s.cuttable }));

export default function App() {
  return <Deck slides={SLIDES} />;
}
