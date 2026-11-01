import type { RangeBar, RangeWindow } from "../src/molecules/RangeChips/RangeChips";

// Hand-written view models for `<RangeChips/>`: its test and its stories read these.

/** The seven window chips, in display order. */
export const WINDOWS: readonly RangeWindow[] = [
  { days: "2h", label: "2H" },
  { days: "5h", label: "5H" },
  { days: "10h", label: "10H" },
  { days: "1d", label: "1D" },
  { days: "3d", label: "3D" },
  { days: "7d", label: "7D" },
  { days: "all", label: "ALL" },
];

/** Five days of runs, the window covering the newest three (days 0-2 lit, 3-4 dim). */
export const BARS_THREE_DAY: readonly RangeBar[] = [
  { height: 100, lit: true, title: "0d ago: 1 runs" },
  { height: 100, lit: true, title: "1d ago: 1 runs" },
  { height: 100, lit: true, title: "2d ago: 1 runs" },
  { height: 0, lit: false, title: "3d ago: 0 runs" },
  { height: 100, lit: false, title: "4d ago: 1 runs" },
];
export const LABEL_THREE_DAY = "since Oct 29 · 3 of 4";

/** The same five days with every bar lit, as the `all` window shows them. */
export const BARS_ALL: readonly RangeBar[] = BARS_THREE_DAY.map((bar) => ({ ...bar, lit: true }));
export const LABEL_ALL = "all 4 runs";

/** Three runs today and one yesterday: the busier day is 100%, the other a third of it. */
export const BARS_BUSY_TODAY: readonly RangeBar[] = [
  { height: 100, lit: true, title: "0d ago: 3 runs" },
  { height: (1 / 3) * 100, lit: true, title: "1d ago: 1 runs" },
];

/** A window with nothing in it. */
export const LABEL_EMPTY_WINDOW = "since Oct 31 · 0 of 0";
export const LABEL_EMPTY_ALL = "all 0 runs";
