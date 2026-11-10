import type { SlideDef } from "../deck/types";
import { s01 } from "./s01-title";
import { s02 } from "./s02-agenda";
import { s03, s04 } from "./s03-terms";
import { s05 } from "./s05-preserve";
import { s06 } from "./s06-channels";
import { s09 } from "./s08-requests";
import { s11 } from "./s11-venn";
import { s14, s15 } from "./s14-corners-bridge";
import { s17b } from "./s17b-map-list";
import { s19 } from "./s19-close";

// One example of each composition. Replace with your own slides; the order here is the order of the deck.
const ALL: SlideDef[] = [s01, s02, s04, s05, s06, s03, s09, s11, s14, s15, s17b, s19];

export const SLIDES = ALL.filter((s) => !s.hidden);
