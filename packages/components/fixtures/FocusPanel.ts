import type { FocusTab } from "../src/glyphs";
import type { FocusBody } from "../src/organisms/FocusPanel/focusTabs";
import type { FocusPanelLabels, FocusPanelView } from "../src/organisms/FocusPanel/FocusPanel";
import { ACTION_BAR_BLOCKED, ACTION_BAR_PUBLISH, ACTION_BAR_RUNNING, FULL_ID } from "./ActionBar";
import { COST_TAB, COST_TAB_LABELS } from "./CostTab";
import { GATES_TAB, GATES_TAB_LABELS } from "./GatesTab";
import { RESULT_TAB_MERGED, RESULT_TAB_LABELS } from "./ResultTab";
import { ROUTE_TAB, ROUTE_TAB_LABELS } from "./RouteTab";
import { RUN_TAB_LABELS, RUN_TAB_RUNNING } from "./RunTab";
import { TOOLS_TAB, TOOLS_TAB_LABELS } from "./ToolsTab";
import { WALK_TAB, WALK_TAB_LABELS } from "./WalkTab";

// Hand-written view models for `<FocusPanel/>` and its tab registry: its test and its stories
// read these.

export { FULL_ID };

export const FOCUS_PANEL_LABELS: FocusPanelLabels = {
  close: "close",
  copyId: "copy",
  copied: "copied",
};

const TABS: FocusPanelView["tabs"] = [
  {
    key: "run",
    label: "Run",
    glyph: "◉",
    purpose: "where the run stands, where it runs, its handles and attempts",
  },
  { key: "walk", label: "Walk", glyph: "∿", purpose: "the run's nodes in the order they ran" },
  { key: "gates", label: "Gates", glyph: "⊟", purpose: "each gate's verdict, host and duration" },
  { key: "tools", label: "Tools", glyph: "⚒", purpose: "what the agent's tools did" },
  { key: "cost", label: "Cost", glyph: "$", purpose: "tokens and spend for this run" },
  {
    key: "route",
    label: "Route",
    glyph: "⇶",
    purpose: "the gear and provider the run was routed to",
  },
  {
    key: "result",
    label: "Result",
    glyph: "⇥",
    purpose: "what the run produced: the PR, the verdict, the cause",
  },
];

/** A live feature ticket, the Run tab active. */
export const FOCUS_PANEL: FocusPanelView = {
  ticketId: FULL_ID,
  tab: "run",
  tabs: TABS,
  head: {
    project: "sabado",
    lane: "feat",
    hue: 210,
    provider: "claude",
    providerGlyph: "✳",
    startedAgo: "20m ago",
    startedClock: "09:41",
    short: "sabado-276",
    suffix: "0a1b2c",
    fullId: FULL_ID,
    title: "strip tags",
  },
  status: { glyph: "●", tone: "run", text: "running — build", title: "node build, 4m in" },
  actions: ACTION_BAR_RUNNING,
};

export const FOCUS_PANEL_BLOCKED: FocusPanelView = {
  ...FOCUS_PANEL,
  status: { glyph: "✕", tone: "bad", text: "blocked — gates red", title: "gates failed twice" },
  actions: ACTION_BAR_BLOCKED,
};

export const FOCUS_PANEL_GREEN: FocusPanelView = {
  ...FOCUS_PANEL,
  status: { glyph: "✓", tone: "ok", text: "success — PR opened", title: "PR #7" },
  actions: ACTION_BAR_PUBLISH,
};

/** A ticket with no title and no suffix: the head shows the short id alone. */
export const FOCUS_PANEL_BARE: FocusPanelView = {
  ...FOCUS_PANEL,
  head: { ...FOCUS_PANEL.head, suffix: "", title: "" },
};

/** The same panel with another tab active. */
export const focusPanelOn = (tab: FocusTab): FocusPanelView => ({ ...FOCUS_PANEL, tab });

const noop = (): void => {};

/** One body per tab: each tab's own view and labels. */
export const FOCUS_BODIES: Readonly<Record<FocusTab, FocusBody>> = {
  run: { tab: "run", props: { view: RUN_TAB_RUNNING, labels: RUN_TAB_LABELS, onCopy: noop } },
  walk: { tab: "walk", props: { view: WALK_TAB, labels: WALK_TAB_LABELS } },
  gates: { tab: "gates", props: { view: GATES_TAB, labels: GATES_TAB_LABELS } },
  tools: { tab: "tools", props: { view: TOOLS_TAB, labels: TOOLS_TAB_LABELS } },
  cost: { tab: "cost", props: { view: COST_TAB, labels: COST_TAB_LABELS } },
  route: { tab: "route", props: { view: ROUTE_TAB, labels: ROUTE_TAB_LABELS } },
  result: { tab: "result", props: { view: RESULT_TAB_MERGED, labels: RESULT_TAB_LABELS } },
};

/** Each tab's root class, to tell the registry rendered the right module. */
export const FOCUS_BODY_CLASS: Readonly<Record<FocusTab, string>> = {
  run: ".runtab",
  walk: ".walktab",
  gates: ".gatestab",
  tools: ".toolstab",
  cost: ".costtab",
  route: ".routetab",
  result: ".resulttab",
};
