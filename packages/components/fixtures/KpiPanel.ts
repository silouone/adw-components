import type {
  KpiPanelLabels,
  KpiPanelView,
  KpiSparkView,
} from "../src/organisms/KpiPanel/KpiPanel";

// Hand-written view models for `<KpiPanel/>`: its test and its stories read these.

/** The words the host passes for the delta tooltip and the table heads. */
export const KPI_PANEL_LABELS: KpiPanelLabels = {
  vsPrevious: "vs the 24 h before",
  heads: {
    project: "project",
    runs: "runs",
    live: "live",
    green: "green",
    blocked: "blocked",
    median: "median",
    spend: "spend",
  },
};

const bars = (heights: readonly number[]): KpiSparkView["bars"] =>
  heights.map((height, key) => ({
    key,
    height,
    ...(key % 2 === 0 ? { label: `${String(key * 3).padStart(2, "0")}h` } : {}),
  }));

/** A full window: five cells, three sparklines, two stacks and two project rows. */
export const KPI_PANEL: KpiPanelView = {
  cells: [
    { name: "green", label: "green", value: "74%", sub: "74 of 99 runs" },
    { name: "blocked", label: "blocked", value: "20%", sub: "20 of 99 runs", hue: "bad" },
    { name: "median", label: "median", value: "12m 34s", sub: "99 measured" },
    { name: "spend", label: "spend (24 h)", value: "$129.69", sub: "$1.31 per run", hue: "ok" },
    { name: "prs", label: "PRs", value: "80", sub: "72 merged" },
  ],
  sparks: [
    {
      name: "runs",
      title: "runs",
      delta: "▲ 56%",
      bars: bars([13, 25, 50, 100, 25, 0, 38, 13]),
    },
    {
      name: "green",
      title: "green",
      hue: "ok",
      delta: "▼ 81%",
      bars: bars([25, 25, 50, 100, 25, 0, 50, 25]),
    },
    {
      name: "spend",
      title: "spend",
      hue: "model",
      bars: bars([13, 25, 25, 50, 100, 0, 38, 6]),
    },
  ],
  stacks: [
    {
      name: "time",
      title: "where the time goes",
      segments: [
        { key: "agent", cls: "model", value: 500 },
        { key: "factory", cls: "tool", value: 380 },
        { key: "wait", cls: "hatch", value: 120 },
      ],
      legend: "agent 50% · factory 38% · wait 12%",
    },
    {
      name: "outcome",
      title: "outcomes",
      segments: [
        { key: "green", cls: "ok", value: 74 },
        { key: "blocked", cls: "bad", value: 20 },
        { key: "deferred", cls: "warn", value: 5 },
        { key: "live", cls: "live", value: 3 },
      ],
      legend: "74 green · 20 blocked · 5 deferred · 3 live",
    },
  ],
  rows: [
    {
      target: "proj-a",
      runs: 60,
      live: 2,
      greenBar: 80,
      green: "80%",
      blocked: 12,
      median: "11m 02s",
      spend: "$80.10",
    },
    {
      target: "proj-b",
      runs: 39,
      live: 1,
      green: "—",
      blocked: 0,
      median: "—",
      spend: "$0.00",
    },
  ],
  foot: "last 7 days · adw metrics",
};

/** A window with nothing measured: dashes in the cells and legends, flat bars, no project row. */
export const KPI_PANEL_EMPTY: KpiPanelView = {
  cells: [
    { name: "green", label: "green", value: "—", sub: "0 of 0 runs" },
    { name: "blocked", label: "blocked", value: "—", sub: "0 of 0 runs", hue: "bad" },
    { name: "median", label: "median", value: "—", sub: "0 measured" },
    { name: "spend", label: "spend (24 h)", value: "$0.00", sub: "—", hue: "ok" },
    { name: "prs", label: "PRs", value: "0", sub: "0 merged" },
  ],
  sparks: ["runs", "green", "spend"].map((name) => ({
    name,
    title: name,
    bars: bars([0, 0, 0, 0, 0, 0, 0, 0]),
  })),
  stacks: [
    { name: "time", title: "where the time goes", segments: [], legend: "—" },
    { name: "outcome", title: "outcomes", segments: [], legend: "—" },
  ],
  rows: [],
  foot: "last 7 days · adw metrics",
};
