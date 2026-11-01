import type {
  LaneNamesLabels,
  LaneNamesLayout,
  LaneNamesView,
  LaneStat,
} from "../src/molecules/LaneNames/LaneNames";

// Hand-written view models for `<LaneNames/>`: its test and its stories read these.

export const OUTSIDE = "outside the selection";

export const LABELS: LaneNamesLabels = { done: "done", epic: "epic" };

/** Three bands, each 400 tall: two projects and the band for what is outside the selection. */
export const LAYOUT: LaneNamesLayout = {
  height: 1200,
  lanes: [
    { project: "courses", y: 0, h: 400 },
    { project: "api-content", y: 400, h: 400 },
    { project: OUTSIDE, y: 800, h: 400 },
  ],
};

/** The same graph with `courses` folded: its band shrinks to 38 and the rest move up. */
export const FOLDED_LAYOUT: LaneNamesLayout = {
  height: 838,
  lanes: [
    { project: "courses", y: 0, h: 38 },
    { project: "api-content", y: 38, h: 400 },
    { project: OUTSIDE, y: 438, h: 400 },
  ],
};

/** The same graph with no lanes (the lane view is off). */
export const NO_LANES: LaneNamesLayout = { height: 1200 };

/** Aligned with the three bands of `LAYOUT`: alternating shades, the last one outside. */
export const VIEW: LaneNamesView = {
  width: 168,
  bands: [
    { band: "even", outside: false },
    { band: "odd", outside: false },
    { band: "even", outside: true },
  ],
};

export const STATS: ReadonlyMap<string, LaneStat> = new Map([
  ["courses", { done: 0, total: 34, epic: "mooc-00" }],
  ["api-content", { done: 2, total: 3, epic: undefined }],
]);

export const COLORS: ReadonlyMap<string, string> = new Map([
  ["courses", "proj-0"],
  ["api-content", "proj-1"],
]);

/** A laned layout with hand-set band heights, in the order courses, api-content, outside. */
export const banded = (heights: readonly number[]): LaneNamesLayout => ({
  height: heights.reduce((a, b) => a + b, 0),
  lanes: ["courses", "api-content", OUTSIDE].slice(0, heights.length).map((project, i) => ({
    project,
    y: heights.slice(0, i).reduce((a, b) => a + b, 0),
    h: heights[i] ?? 0,
  })),
});
