import { createRef } from "preact";
import type {
  GraphChipView,
  GraphDrawerLabels,
  GraphDrawerModel,
} from "../src/organisms/GraphDrawerView/GraphDrawerView";
import { CQC_GRAPH, CQC_LAYOUT, CQC_VIEW } from "./DepGraph";
import { FEATURE_LABELS, FEATURE_TREE } from "./FeatureMenu";
import { COLORS, LABELS as LANE_LABELS, STATS, VIEW as LANE_VIEW } from "./LaneNames";

// Hand-written view models for `<GraphDrawerView/>`: its test and its stories read these. The
// graph and its layout are `DepGraph`'s fixtures (the committed `layout-golden.json`); the drawer
// geometry, the chips and the labels are literals.

export const GRAPH_DRAWER_LABELS: GraphDrawerLabels = {
  title: "graph",
  features: "features",
  featureMenu: FEATURE_LABELS,
  laneNames: LANE_LABELS,
  lanes: "lanes",
  collapseAll: "collapse all",
  expandAll: "expand all",
  dockBottom: "bottom",
  dockRight: "right",
  presets: { narrow: "narrow", wide: "wide", full: "full" },
  close: "close the graph",
  empty: (projects) => `no dependency graph for ${projects.join(", ")}`,
  showDone: "show done",
  entireGraph: "entire graph",
  zoomOutTitle: "zoom out (-)",
  zoomResetTitle: "100% (0)",
  zoomInTitle: "zoom in (+)",
  fitTitle: "fit (f)",
  fit: "fit",
  search: "search id, title, project",
  legend: {
    crit: "critical path",
    unmet: "unmet dep",
    met: "met dep",
    dashed: "outside / manual",
    hint: "drag to pan · ⌘/ctrl-wheel or pinch to zoom · - 0 + f",
  },
};

const chip = (name: string, over: Partial<GraphChipView> = {}): GraphChipView => ({
  name,
  label: name,
  on: false,
  out: false,
  ...over,
});

/** Two projects, `cqc-be` the selected one. */
export const GRAPH_CHIPS: readonly GraphChipView[] = [
  chip("cqc-be", { on: true }),
  chip("courses"),
];

/** One project, the `cqc-be` graph with its done wave shown, docked at the bottom. */
export const GRAPH_DRAWER: GraphDrawerModel = {
  dock: "bottom",
  px: 346,
  panelPx: 0,
  preset: "narrow",
  showDone: true,
  entire: false,
  projects: ["cqc-be"],
  featureTree: undefined,
  feature: undefined,
  chips: GRAPH_CHIPS,
  multi: undefined,
  lanes: false,
  collapsed: [],
  allFolded: false,
  stats: new Map(),
  empty: false,
  graph: CQC_GRAPH,
  canvas: {
    layout: CQC_LAYOUT,
    searching: false,
    hitLabel: "",
    summary: [],
    gutter: 0,
    nextFwd: undefined,
    nextBack: undefined,
    dep: CQC_VIEW,
    laneNames: { width: 0, bands: [] },
  },
};

/** The same graph with a feature menu in the head and the chips narrowed to the feature. */
export const GRAPH_DRAWER_FEATURED: GraphDrawerModel = {
  ...GRAPH_DRAWER,
  featureTree: FEATURE_TREE,
  feature: "board",
  chips: [chip("cqc-be", { on: true, label: "cqc-be 9" }), chip("courses", { out: true })],
};

/** The same graph as the single-project selection, but with a pixel size and the right dock. */
export const GRAPH_DRAWER_RIGHT: GraphDrawerModel = {
  ...GRAPH_DRAWER,
  dock: "right",
  px: 520,
  panelPx: 320,
  preset: undefined,
};

/** Two projects as swimlanes: each takes half of the layout, the name column keeps its width. */
export const GRAPH_DRAWER_LANED: GraphDrawerModel = {
  ...GRAPH_DRAWER,
  projects: ["courses", "api-content"],
  multi: { projects: 2, colors: COLORS },
  lanes: true,
  stats: STATS,
  chips: [chip("courses", { on: true }), chip("api-content", { on: true })],
  canvas: {
    ...GRAPH_DRAWER.canvas,
    layout: {
      ...CQC_LAYOUT,
      lanes: [
        { project: "courses", y: 0, h: 210 },
        { project: "api-content", y: 210, h: 210 },
      ],
    },
    summary: ["✕ 1 blocked", "⛔ 9 held behind a block"],
    gutter: LANE_VIEW.width,
    laneNames: { width: LANE_VIEW.width, bands: LANE_VIEW.bands.slice(0, 2) },
  },
};

/** A selection with no node at all. */
export const GRAPH_DRAWER_EMPTY: GraphDrawerModel = {
  ...GRAPH_DRAWER,
  projects: ["empty"],
  chips: [chip("empty", { on: true })],
  empty: true,
  graph: { nodes: [], edges: [], maxWave: 0, criticalPath: [] },
};

/** A search for `04`: one hit, and the next one Enter would focus. */
export const GRAPH_DRAWER_SEARCHING: GraphDrawerModel = {
  ...GRAPH_DRAWER,
  canvas: {
    ...GRAPH_DRAWER.canvas,
    searching: true,
    hitLabel: "1 hit",
    nextFwd: "cqc-be-04",
    nextBack: "cqc-be-04",
    dep: { ...CQC_VIEW, searching: true, hits: new Set(["cqc-be-04"]) },
  },
};

/** The three refs the page owns, empty: nothing here scrolls, focuses or dismisses. */
export const GRAPH_DRAWER_REFS = {
  canvasRef: createRef<HTMLDivElement>(),
  searchRef: createRef<HTMLInputElement>(),
  featureRef: createRef<HTMLSpanElement>(),
};
