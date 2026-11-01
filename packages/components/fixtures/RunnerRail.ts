// Hand-written view models for `<RunnerRail/>`: three tiles (busy local, idle ssh, planned
// e2b) and the popovers of the hovered local and the planned e2b runner.

import type {
  RunnerPopover,
  RunnerRailLabels,
  RunnerRailView,
} from "../src/organisms/RunnerRail/RunnerRail";

export const RUNNER_RAIL_LABELS: RunnerRailLabels = {
  ariaLabel: "runners",
  openNetwork: "open the network",
  allRunners: "all runners",
  all: "all",
};

export const RUNNER_RAIL: RunnerRailView = {
  tiles: [
    { key: "local", planned: false, glyph: "⌂", dot: "live" },
    { key: "ssh:build-1", planned: false, glyph: "⇄", dot: "ok" },
    { key: "e2b", planned: true, glyph: "⬡", dot: "planned" },
  ],
};

export const LOCAL_POPOVER: RunnerPopover = {
  glyph: "⌂",
  dot: "live",
  facts: {
    title: "local",
    status: "busy",
    kind: "this machine",
    rows: [
      { k: "slots", v: "2 of 4 held" },
      { k: "queue", v: "1 waiting · next sabado-278" },
      { k: "live runs", v: "3" },
      { k: "gating now", v: "none" },
      { k: "config", v: "4 slots" },
    ],
    hint: "click to focus the board on local",
  },
};

export const PLANNED_POPOVER: RunnerPopover = {
  glyph: "⬡",
  dot: "planned",
  facts: {
    title: "e2b",
    status: "not configured",
    kind: "cloud sandbox",
    rows: [{ k: "config", v: "none" }],
  },
};

export const RUNNER_RAIL_HOVERED: RunnerRailView = { ...RUNNER_RAIL, popover: LOCAL_POPOVER };
export const RUNNER_RAIL_HOVERED_PLANNED: RunnerRailView = {
  ...RUNNER_RAIL,
  popover: PLANNED_POPOVER,
};
export const RUNNER_RAIL_EMPTY: RunnerRailView = { tiles: [] };
