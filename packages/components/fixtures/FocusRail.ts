// Hand-written props for `<FocusRail/>`: the seven tabs and the words around them.

import type { FocusRailLabels, FocusRailTab } from "../src/organisms/FocusRail/FocusRail";

export const FOCUS_RAIL_TABS: readonly FocusRailTab[] = [
  { id: "run", glyph: "◉", label: "run" },
  { id: "walk", glyph: "∿", label: "walk" },
  { id: "gates", glyph: "⊟", label: "gates" },
  { id: "tools", glyph: "⚒", label: "tools" },
  { id: "cost", glyph: "$", label: "cost" },
  { id: "route", glyph: "⇶", label: "route" },
  { id: "result", glyph: "⇥", label: "result" },
];

export const FOCUS_RAIL_LABELS: FocusRailLabels = {
  ariaLabel: "focus",
  openPanel: "open the focus panel",
  close: "close",
};
