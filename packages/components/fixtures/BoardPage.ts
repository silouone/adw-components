import type { BoardChipsView } from "../src/organisms/BoardChips/BoardChips";
import type { CardView } from "../src/organisms/Card/Card";
import type { FocusPanelView } from "../src/organisms/FocusPanel/FocusPanel";
import type { LedgerRowView } from "../src/organisms/LedgerRow/LedgerRow";
import type { CardTally, SectionView } from "../src/organisms/SectionView/SectionView";
import type {
  BoardPageActions,
  BoardPageChipsView,
  BoardPageLabels,
  BoardPageView,
  BoardGridView,
  ShellView,
} from "../src/pages/BoardPage/BoardPage";
import {
  BOARD_CHIPS,
  BOARD_CHIPS_AUTONOMY,
  BOARD_CHIPS_FILTERS,
  BOARD_CHIPS_LABELS,
} from "./BoardChips";
import { BOARD_GRID_COLUMNS, BOARD_GRID_EMPTY, BOARD_GRID_NO_MATCH } from "./BoardGrid";
import { BLOCKED_CARD, GREEN_CARD, LIVE_CARD, WAITING_CARD } from "./Card";
import { FOCUS_BODIES, FOCUS_PANEL, FOCUS_PANEL_LABELS } from "./FocusPanel";
import { FOCUS_RAIL_LABELS, FOCUS_RAIL_TABS } from "./FocusRail";
import { BLOCKED_ROW, GREEN_ROW, SLOT_HOLDER_ROW, WAITING_ROW } from "./LedgerRow";
import { NETWORK, NETWORK_LABELS, NETWORK_TALLY } from "./NetworkTree";
import { PHASE_LEGEND_LABELS, PHASES } from "./PhaseLegend";
import { RUNNER_RAIL, RUNNER_RAIL_LABELS } from "./RunnerRail";
import {
  FOOT_TEXT,
  HOLDER_OK,
  HOLDER_WARN,
  LOCAL_RUNNER,
  WAITER_ONE,
  WAITER_TWO,
} from "./SlotsPanel";
import { SECTION_CARDS, SECTION_LABELS } from "./SectionView";
import { CRUMBS_ALL, STAGE_LABELS } from "./StageHeader";

// Hand-written view models for `<BoardPage/>`: its test and its stories read these; the four
// screen states live in `./board/`. Building a page view from the signals is the factory's
// projection; here the finished view is written out, with invented tickets and projects.

export const BOARD_PAGE_TOKEN = "tok-abc";

export const BOARD_PAGE_NOTICE = "stream dropped, showing the last frame";

export const BOARD_PAGE_LABELS: BoardPageLabels = {
  network: NETWORK_LABELS,
  runnerRail: RUNNER_RAIL_LABELS,
  focusRail: FOCUS_RAIL_LABELS,
  focusPanel: FOCUS_PANEL_LABELS,
  stage: STAGE_LABELS,
  phaseLegend: PHASE_LEGEND_LABELS,
  section: SECTION_LABELS,
  empty: BOARD_GRID_EMPTY,
  noMatch: BOARD_GRID_NO_MATCH,
  columns: BOARD_GRID_COLUMNS,
};

export type RecordedCall = readonly [string, ...unknown[]];

/** The page's callbacks, each recording `[name, ...arguments]` into `calls`. */
export const recordingActions = (): {
  readonly actions: BoardPageActions;
  readonly calls: RecordedCall[];
} => {
  const calls: RecordedCall[] = [];
  const rec =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push([name, ...args]);
    };
  const post =
    (name: string) =>
    (...args: unknown[]): Promise<string | undefined> => {
      calls.push([name, ...args]);
      return Promise.resolve(undefined);
    };
  const actions: BoardPageActions = {
    onSelect: rec("onSelect"),
    onFilter: rec("onFilter"),
    onWindow: rec("onWindow"),
    onView: rec("onView"),
    onDropdown: rec("onDropdown"),
    onToggleRail: rec("onToggleRail"),
    onHoverRunner: rec("onHoverRunner"),
    onToggleRunner: rec("onToggleRunner"),
    onToggleProject: rec("onToggleProject"),
    onFocusTab: rec("onFocusTab"),
    onFocusOpen: rec("onFocusOpen"),
    onOpenRun: rec("onOpenRun"),
    onOpenSlotRun: rec("onOpenSlotRun"),
    onStage: rec("onStage"),
    onCloseRun: rec("onCloseRun"),
    onFullScreen: rec("onFullScreen"),
    onAction: post("onAction"),
    onPause: post("onPause"),
    onContinue: post("onContinue"),
    onCopy: rec("onCopy"),
  };
  return { actions, calls };
};

type Item = SectionView["items"][number];
export type ItemKind = "live" | "waiting" | "green" | "blocked";

const BASE: Readonly<Record<ItemKind, { readonly card: CardView; readonly row: LedgerRowView }>> = {
  live: { card: LIVE_CARD, row: SLOT_HOLDER_ROW },
  waiting: { card: WAITING_CARD, row: WAITING_ROW },
  green: { card: GREEN_CARD, row: GREEN_ROW },
  blocked: { card: BLOCKED_CARD, row: BLOCKED_ROW },
};

/** One ticket of the given kind, as both its card and its ledger row. */
export const boardItem = (kind: ItemKind, ticketId: string, title: string): Item => {
  const { card, row } = BASE[kind];
  const mine = { ticketId, headShort: ticketId, headTitle: ticketId, title };
  return { ticketId, card: { ...card, ...mine }, row: { ...row, card: { ...row.card, ...mine } } };
};

const tallyOf = (items: readonly Item[]): CardTally => {
  const count = (health: string): number => items.filter((i) => i.card.health === health).length;
  return {
    total: items.length,
    green: count("green"),
    blocked: count("blocked"),
    unfinished: items.length - count("green") - count("blocked"),
    live: count("live"),
  };
};

/** A project section holding the given tickets, its tallies counted from them. */
export const boardSection = (target: string, items: readonly Item[]): SectionView => {
  const tally = tallyOf(items);
  const waiting = items.filter((i) => i.card.health === "waiting").length;
  return {
    ...SECTION_CARDS,
    target,
    liveTally: tally,
    visibleTally: tally,
    activityTally: { running: tally.live, waiting },
    items,
  };
};

const GRID_BASE: BoardGridView = {
  notices: [],
  empty: false,
  phases: PHASES,
  ledger: false,
  sections: [],
  noMatch: false,
};

/** A grid showing the given sections. */
export const gridOf = (sections: readonly SectionView[]): BoardGridView => ({
  ...GRID_BASE,
  sections,
});

export const EMPTY_GRID: BoardGridView = { ...GRID_BASE, empty: true };

/** Rail 1 open on the network, rail 2 shut, nothing selected, no run on the stage. */
export const SHELL_BASE: ShellView = {
  stale: false,
  hostOpen: true,
  net: NETWORK,
  tally: NETWORK_TALLY,
  runnerRail: RUNNER_RAIL,
  hostFilter: "*",
  projFilter: "*",
  selected: null,
  expandedRunners: new Set(["local"]),
  collapsedProjects: new Set(),
  focusTab: "run",
  focusOpen: false,
  focusTabs: FOCUS_RAIL_TABS,
  crumbs: CRUMBS_ALL,
};

/** The shell with rail 2 open on the given ticket's focus panel, the Run tab active. */
export const shellSelecting = (ticketId: string, panel: FocusPanelView): ShellView => ({
  ...SHELL_BASE,
  selected: ticketId,
  focusOpen: true,
  focus: { panel, body: FOCUS_BODIES.run },
});

/** The focus panel of the given ticket, the base panel's head and tabs under the given status. */
export const panelFor = (ticketId: string, status: FocusPanelView["status"]): FocusPanelView => ({
  ...FOCUS_PANEL,
  ticketId,
  head: { ...FOCUS_PANEL.head, short: ticketId, suffix: "", fullId: ticketId },
  status,
});

/** The ticket the wave's focus panel opens on: fourth in the queue. */
export const WAVE_SELECTED = "proj-a-3-queued";

/** The ticket of the wave that is blocked. */
export const WAVE_BLOCKED = "proj-c-9-stuck";

/** Thirteen runs over three projects: three hold a slot, four queue, five are green, one is blocked. */
export const WAVE_SECTIONS: readonly SectionView[] = [
  boardSection("proj-a", [
    boardItem("live", "proj-a-1-wire-the-api", "Wire the API"),
    boardItem("live", "proj-a-2-index-the-table", "Index the table"),
    boardItem("waiting", WAVE_SELECTED, "Queue the export"),
    boardItem("waiting", "proj-a-4-split-the-job", "Split the job"),
    boardItem("green", "proj-a-5-bump-the-acl", "Bump the ACL"),
  ]),
  boardSection("proj-b", [
    boardItem("live", "proj-b-1-trim-the-bundle", "Trim the bundle"),
    boardItem("waiting", "proj-b-2-rename-the-flag", "Rename the flag"),
    boardItem("waiting", "proj-b-3-cache-the-lookup", "Cache the lookup"),
    boardItem("green", "proj-b-4-fix-the-label", "Fix the label"),
    boardItem("green", "proj-b-5-drop-the-shim", "Drop the shim"),
  ]),
  boardSection("proj-c", [
    boardItem("green", "proj-c-1-add-the-probe", "Add the probe"),
    boardItem("green", "proj-c-2-tidy-the-docs", "Tidy the docs"),
    boardItem("blocked", WAVE_BLOCKED, "Unstick the exporter"),
  ]),
];

export const WAVE_QUEUED_STATUS: FocusPanelView["status"] = {
  glyph: "⏳",
  tone: "wait",
  text: "waiting for a slot (4th in line, since 10:04)",
  title: "queued behind three runs",
};

export const BOARD_PAGE_BASE: BoardPageView = {
  labels: BOARD_PAGE_LABELS,
  token: BOARD_PAGE_TOKEN,
  grid: EMPTY_GRID,
  shell: SHELL_BASE,
};

/** The wave's header figures: thirteen runs, all three slots held, four waiting. */
const WAVE_CHIPS: BoardChipsView = {
  ...BOARD_CHIPS,
  tickets: 13,
  runs: 13,
  live: 3,
  green: 5,
  blocked: 1,
  slots: {
    tally: { held: 3, total: 3, queued: 4, full: true },
    bays: [
      { key: "b0", held: true },
      { key: "b1", held: true },
      { key: "b2", held: true },
    ],
    panel: {
      runners: [
        {
          ...LOCAL_RUNNER,
          held: 3,
          baysTotal: 3,
          queued: 4,
          bays: [HOLDER_WARN, { ...HOLDER_OK, index: 1 }, HOLDER_OK],
          queue: [WAITER_ONE, WAITER_TWO],
        },
      ],
      footText: FOOT_TEXT,
    },
  },
};

/** The header chips of the board route, the wave's figures, a window of seven days, nothing open. */
export const BOARD_PAGE_CHIPS: BoardPageChipsView = {
  labels: BOARD_CHIPS_LABELS,
  chips: WAVE_CHIPS,
  autonomy: BOARD_CHIPS_AUTONOMY,
  filters: BOARD_CHIPS_FILTERS,
  boardView: "cards",
  open: undefined,
  pinned: undefined,
};

/** A wave: thirteen runs over three projects, three slots held, a queue; a queued ticket selected. */
export const BOARD_PAGE_WAVE: BoardPageView = {
  ...BOARD_PAGE_BASE,
  grid: gridOf(WAVE_SECTIONS),
  shell: shellSelecting(WAVE_SELECTED, panelFor(WAVE_SELECTED, WAVE_QUEUED_STATUS)),
};
