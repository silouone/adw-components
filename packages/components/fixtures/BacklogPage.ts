import { createRef } from "preact";
import type {
  BacklogDrawerActions,
  BacklogPageActions,
  BacklogPageLabels,
  BacklogPageView,
  BacklogProjectChipView,
} from "../src/pages/BacklogPage/BacklogPage";
import { BACKLOG_PANEL_LABELS } from "./BacklogPanel";
import {
  BACKLOG_ROW_LABELS,
  BLOCKED_ROW,
  BLOCKED_VIEW,
  backlogRow,
  backlogRowView,
  dispatchLineFor,
  waitingRow,
  waitingView,
} from "./BacklogRow";
import { BACKLOG_SECTION_NOTES } from "./BacklogSection";
import { WITH_HOSTS, LABELS as COPY_MENU_LABELS } from "./CopyRunMenu";
import { FEATURE_LABELS, FEATURE_TREE, FEATURE_TREE_EMPTY } from "./FeatureMenu";
import { GRAPH_DRAWER_LABELS, GRAPH_DRAWER_SEARCHING } from "./GraphDrawerView";
import { REVIEW_DESK_LABELS, deskView } from "./ReviewDesk";

// Hand-written view models for `<BacklogPage/>`: its test and its stories read these. Building the
// page view from the backlog data, the filters and the graph is the factory's projection; here the
// finished view is written out, the committed assignation figures and invented rows included.

export const BACKLOG_PAGE_NOTICE = "stream dropped, showing the last frame";

export const BACKLOG_PAGE_LABELS: BacklogPageLabels = {
  head: {
    all: "All",
    noStore: (name) => `${name} · no ticket store`,
    hide: "hide",
    moreNoStore: (count) => `+${count} targets without a store`,
    graph: "⎇ graph",
    graphTitle: "dependency graph (g)",
    projectFeatures: (project) => `${project} · features`,
    allFeatures: "all features",
    searchPlaceholder: "search id, title, project   /",
    state: "state",
    stateNames: {
      blocked: "blocked",
      waiting: "waiting",
      ready: "ready",
      running: "running",
      "in-flight": "in-flight",
      other: "other",
      closed: "closed",
    },
    lane: "lane",
    prio: "prio",
    group: "group",
    groupBy: (group) => `by ${group}`,
    pr: "pr",
    prOpen: "open PR",
    prOpenTitle: "every ticket with an open PR",
    clear: "clear ✕",
    hideClosed: "hide closed",
    showClosed: (count) => `show ${count} closed`,
    barTitle: (done, total) => `${done} of ${total} done`,
  },
  featureMenu: FEATURE_LABELS,
  copyMenu: COPY_MENU_LABELS,
  desk: REVIEW_DESK_LABELS,
  row: BACKLOG_ROW_LABELS,
  sectionNotes: BACKLOG_SECTION_NOTES,
  panel: BACKLOG_PANEL_LABELS,
  drawer: GRAPH_DRAWER_LABELS,
  nextUp: "next up",
  columns: ["", "project", "id", "title", "lane", "P", "why here", "last run", ""],
  loading: "loading the backlog…",
  nothingMatches: "nothing matches these filters",
  waveSkipped: (count) => `${count} rows not in a wave — see by state`,
};

/** The page's callbacks, every one a no-op; a test or a story overrides what it listens to. */
export const noopDrawerActions = (): BacklogDrawerActions => ({
  onSelect: () => {},
  onFeature: () => {},
  onToggleProject: () => {},
  onSoleProject: () => {},
  onToggleLane: () => {},
  onCollapseAll: () => {},
  onClose: () => {},
  onQuery: () => {},
  onFocus: () => {},
  onShowDone: () => {},
  onEntire: () => {},
  onLanes: () => {},
  onDock: () => {},
  onPreset: () => {},
  onZoomOut: () => {},
  onZoomReset: () => {},
  onZoomIn: () => {},
  onFit: () => {},
  onResizeStart: () => {},
  onPanStart: () => {},
});

/** The refs the container owns, empty: nothing here measures, scrolls or focuses. */
export const BACKLOG_PAGE_REFS = {
  headRef: createRef<HTMLDivElement>(),
  canvasRef: createRef<HTMLDivElement>(),
  searchRef: createRef<HTMLInputElement>(),
};

const QUERY = "cqc-be-04";

const READY_ROW = backlogRow({
  id: "cqc-be-04",
  project: "cqc-be",
  title: "Bump the ACL",
  lane: "feat",
  priority: 1,
});
const READY_ROW_TWO = backlogRow({
  id: "cqc-be-05",
  project: "cqc-be",
  title: "Index the course table",
  lane: "chore",
  priority: 2,
});
const BLOCKED = { ...BLOCKED_ROW, id: "cqc-be-03", project: "cqc-be", title: "Split the exporter" };
const WAITING = {
  ...waitingRow(["cqc-be-04"]),
  id: "cqc-be-06",
  project: "cqc-be",
  title: "Ship it",
};

const readyView = (id: string) =>
  backlogRowView({
    idText: id.replace(/^cqc-be-/, ""),
    dispatchLine: dispatchLineFor(id, "cqc-be"),
  });

const chip = (
  name: string,
  hue: number,
  over: Partial<BacklogProjectChipView> = {},
): BacklogProjectChipView => ({
  name,
  hue,
  on: false,
  out: false,
  counts: [{ state: "ready", n: 2 }],
  tree: FEATURE_TREE_EMPTY,
  ...over,
});

/** The list at rest: one ready pair, a blocked row, a waiting row in a collapsed section, the graph drawer open on one hit. */
export const BACKLOG_PAGE_VIEW: BacklogPageView = {
  token: "tok",
  labels: BACKLOG_PAGE_LABELS,
  frame: { stale: false, style: { "--bl-head-top": "48px" } },
  head: {
    chips: {
      open: 4,
      allOn: false,
      projects: [
        chip("cqc-be", 2, {
          on: true,
          counts: [
            { state: "blocked", n: 1 },
            { state: "ready", n: 2 },
            { state: "waiting", n: 1 },
          ],
          bar: { done: 6, total: 10 },
          tree: FEATURE_TREE,
        }),
        chip("courses", 5, { out: true, counts: [] }),
      ],
      noStore: ["legacy-site"],
      showNoStore: false,
      graphOn: true,
    },
    features: { tree: FEATURE_TREE, picked: undefined },
    filters: {
      q: QUERY,
      states: [
        { key: "blocked", on: false, n: 1 },
        { key: "ready", on: false, n: 2 },
        { key: "waiting", on: false, n: 1 },
      ],
      lanes: [
        { key: "feat", on: false },
        { key: "chore", on: false },
      ],
      prios: [
        { key: "1", on: false },
        { key: "2", on: false },
      ],
      group: "state",
      prs: {
        open: { on: false, n: 2 },
        buckets: [{ key: "review", glyph: "◔", label: "review", who: "you", on: false, n: 2 }],
      },
      anyOn: true,
      closedCount: 3,
      showClosed: false,
    },
  },
  desk: { view: deskView(2), open: false, prFilter: [] },
  columns: true,
  loading: false,
  empty: false,
  waveSkipped: 0,
  sections: [
    { key: "blocked", rows: [BLOCKED], collapsed: false },
    { key: "ready", rows: [READY_ROW, READY_ROW_TWO], collapsed: false },
    { key: "waiting", rows: [WAITING], collapsed: true },
  ],
  rows: {
    [BLOCKED.id]: { view: BLOCKED_VIEW, hue: 2, cursor: false, selected: false, tabbable: true },
    [READY_ROW.id]: {
      view: readyView(READY_ROW.id),
      hue: 2,
      cursor: true,
      selected: false,
      tabbable: false,
    },
    [READY_ROW_TWO.id]: {
      view: readyView(READY_ROW_TWO.id),
      hue: 2,
      cursor: false,
      selected: false,
      tabbable: false,
    },
    [WAITING.id]: {
      view: waitingView(["cqc-be-04"]),
      hue: 2,
      cursor: false,
      selected: false,
      tabbable: false,
    },
  },
  hues: { "cqc-be": 2, courses: 5 },
  drawer: {
    model: GRAPH_DRAWER_SEARCHING,
    query: QUERY,
    focus: "cqc-be-04",
    zoom: 1,
    panning: false,
  },
};

/** The next-up row for the first ready ticket. */
export const BACKLOG_PAGE_HERO: NonNullable<BacklogPageView["hero"]> = {
  row: READY_ROW,
  hue: 2,
  idText: "04",
  dispatch: dispatchLineFor(READY_ROW.id, "cqc-be"),
  hint: "draws on Opus 22% used",
  menu: WITH_HOSTS,
  project: "cqc-be",
};

/** Nothing arrived yet: the loading line, no column header, no row. */
export const BACKLOG_PAGE_LOADING: BacklogPageView = {
  ...BACKLOG_PAGE_VIEW,
  columns: false,
  loading: true,
  sections: [],
  rows: {},
  drawer: undefined,
};

/** A query matching nothing: the empty line, no column header, no row. */
export const BACKLOG_PAGE_EMPTY: BacklogPageView = {
  ...BACKLOG_PAGE_VIEW,
  columns: false,
  empty: true,
  sections: [],
  rows: {},
  drawer: undefined,
};

/** Every callback as a plain function; a test wraps the ones it listens to in `mock`. */
export const noopPageActions = (): BacklogPageActions => ({
  onCopy: () => {},
  onSelect: () => {},
  onClosePanel: () => {},
  onPanelScroll: () => {},
  onPickHost: () => {},
  onToggleSection: () => {},
  onDesk: () => {},
  onPrFilter: () => {},
  onAllProjects: () => {},
  onProjectChip: () => {},
  onProjectFeature: () => {},
  onFeature: () => {},
  onToggleNoStore: () => {},
  onToggleGraph: () => {},
  onQuery: () => {},
  onToggleState: () => {},
  onToggleLaneFilter: () => {},
  onTogglePrio: () => {},
  onGroup: () => {},
  onClearFilters: () => {},
  onToggleClosed: () => {},
  drawer: noopDrawerActions(),
});
