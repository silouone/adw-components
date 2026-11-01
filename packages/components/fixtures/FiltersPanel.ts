// Hand-written view models for `<FiltersPanel/>` and `<FiltersChip/>`: the whole board
// (two projects, one of them gone from the board, two gate hosts) and the empty one.

import type {
  BoardFilters,
  FiltersPanelLabels,
  FiltersPanelView,
} from "../src/organisms/FiltersPanel/FiltersPanel";

export const FILTERS_LABELS: FiltersPanelLabels = {
  rows: {
    project: "project",
    health: "health",
    lane: "lane",
    builtBy: "built by",
    isolation: "isolation",
    gateHost: "gate host",
    window: "window",
    search: "search",
  },
  all: "all",
  green: "green",
  blocked: "blocked",
  unfinished: "no run-end",
  live: "live",
  searchPlaceholder: "ticket id",
  searchLabel: "Search ticket ids",
};

const RANGE = {
  windows: [
    { days: "2h", label: "2H" },
    { days: "1d", label: "1D" },
    { days: "7d", label: "7D" },
    { days: "all", label: "ALL" },
  ],
  bars: [
    { height: 40, lit: false, title: "Oct 29 · 2 runs" },
    { height: 100, lit: true, title: "Oct 30 · 5 runs" },
    { height: 60, lit: true, title: "Oct 31 · 3 runs" },
  ],
  label: "since Oct 29 · 3 of 4",
};

export const FILTERS_VIEW: FiltersPanelView = {
  label: "filters all",
  totalTickets: 7,
  projects: [
    { key: "sabado", label: "sabado", legacy: false, count: 4 },
    { key: "adw-factory", label: "adw-factory", legacy: false, count: 2 },
    { key: "old-app", label: "old-app", legacy: true, count: 1 },
  ],
  tally: { green: 3, blocked: 2, unfinished: 1, live: 1 },
  lanes: [
    { key: "feat", count: 4 },
    { key: "bug", count: 2 },
    { key: "chore", count: 1 },
  ],
  providers: [
    { key: "claude", count: 5 },
    { key: "codex", count: 2 },
  ],
  isolations: [
    { key: "worktree", count: 5 },
    { key: "container", count: 1 },
    { key: "remote", count: 1 },
  ],
  hosts: [
    { key: "local", label: "local", count: 5 },
    { key: "ssh:build-1", label: "build-1", count: 2 },
  ],
  anyHost: "*",
  range: RANGE,
};

/** One gate host only: the host row is not drawn. */
export const FILTERS_VIEW_ONE_HOST: FiltersPanelView = {
  ...FILTERS_VIEW,
  hosts: [],
};

/** No board data yet: every section is there, every count is zero. */
export const FILTERS_VIEW_EMPTY: FiltersPanelView = {
  label: "filters all",
  totalTickets: 0,
  projects: [],
  tally: { green: 0, blocked: 0, unfinished: 0, live: 0 },
  lanes: [
    { key: "feat", count: 0 },
    { key: "bug", count: 0 },
    { key: "chore", count: 0 },
  ],
  providers: [
    { key: "claude", count: 0 },
    { key: "codex", count: 0 },
  ],
  isolations: [
    { key: "worktree", count: 0 },
    { key: "container", count: 0 },
    { key: "remote", count: 0 },
  ],
  hosts: [],
  anyHost: "*",
  range: { ...RANGE, bars: [], label: "" },
};

/** Nothing narrowed: every health chip on, the window at `all`. */
export const FILTERS_OFF: BoardFilters = {
  proj: "*",
  health: { green: true, blocked: true, unfinished: true },
  liveOnly: false,
  host: "*",
  lanes: [],
  providers: [],
  isolations: [],
  q: "",
  days: "all",
};
