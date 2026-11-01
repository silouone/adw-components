// Hand-written view models for `<RouteTab/>`: a bug-lane run with an in-run escalation row,
// the same run with a fired escalation, one without rounds, and a journal without a route event.

import type { RouteTabLabels, RouteView } from "../src/organisms/RouteTab/RouteTab";

export const ROUTE_TAB_LABELS: RouteTabLabels = {
  resolution: "resolution",
  gearPerStage: "gear per stage",
  shadowRouter: "shadow router",
  mode: "mode",
  wouldPick: "would pick",
  escalation: "escalation",
};

/** Three stages in plan order (the last without a gear) and the escalation row of the plan. */
export const ROUTE_TAB: RouteView = {
  resolution: "no pin → default → claude",
  stages: [
    { node: "plan", model: "sonnet", gear: "G2" },
    { node: "build", model: "opus", gear: "G3" },
    { node: "review", model: "sonnet", gear: "—" },
  ],
  escalationRow: "repair / review-fix · escalate at round 3 / 2 · G2 → G3",
  mode: "shadow",
  wouldPick: "G3 · opus — size large",
  escalation: { text: "none" },
};

/** The same plan without in-run escalation: no extra row. */
export const ROUTE_TAB_NO_ROUNDS: RouteView = {
  resolution: ROUTE_TAB.resolution,
  stages: ROUTE_TAB.stages,
  mode: ROUTE_TAB.mode,
  wouldPick: ROUTE_TAB.wouldPick,
  escalation: ROUTE_TAB.escalation,
};

/** A ticket pin, a target lane and a codex run. */
export const ROUTE_TAB_PINNED: RouteView = {
  ...ROUTE_TAB,
  resolution: "ticket G3 → target → codex",
};

/** An escalation that fired once, with its reason in the tooltip. */
export const ROUTE_TAB_ESCALATED: RouteView = {
  ...ROUTE_TAB,
  escalation: { text: "fired ×1 — build r3 G3 → G4", title: "build r3 G3 → G4: red twice" },
};

/** A journal without a route event: every section is a dash and no row is invented. */
export const ROUTE_TAB_EMPTY: RouteView = {
  resolution: "—",
  stages: [],
  mode: "—",
  wouldPick: "—",
  escalation: { text: "—" },
};
