import type {
  RunHeaderLabels,
  RunHeaderView,
  RunIdentity,
} from "../src/organisms/RunHeader/RunHeader";

// Hand-written view models for `<RunHeader/>`: its test and its stories read these.

export const IDENTITY: RunIdentity = { ticketId: "adw-render-04" };

export const LABELS: RunHeaderLabels = {
  failureChip: "open the failing node",
  rebaseRound: "rebase round",
  ciRound: "CI round",
  dirty: "dirty",
  laterHead: "CI on a later head",
  laterHeadTitle: "The PR has moved past the commit this run pushed",
  uncommittedOne: "uncommitted file left in the workspace",
  uncommittedMany: "uncommitted files left in the workspace",
  salvageable: "salvageable",
  tabsLabel: "Timeline view",
  tabs: [
    { value: "gantt", text: "Gantt", hint: "Lanes over time" },
    { value: "ledger", text: "Ledger", hint: "One row per step" },
    { value: "journey", text: "Journey", hint: "Phases, not roles" },
  ],
};

/** A finished green run: the duration chip, the totals, the cost chip last. */
export const FINISHED: RunHeaderView = {
  cls: "ok",
  text: "green",
  chips: [
    { key: "dur", value: "12.3s" },
    { key: "turns", value: "9" },
    { key: "input", value: "1,200" },
    { key: "output", value: "340" },
    { key: "context", value: "5,100" },
    { key: "cost", value: "$0.42", title: "estimated from the model's rate card" },
  ],
};

/** A running node: the live totals carry `~`, and a context-now chip sits before the cost. */
export const LIVE: RunHeaderView = {
  cls: "live",
  text: "● live",
  chips: [
    { key: "elapsed", value: "3.0s" },
    { key: "turns", value: "3" },
    { key: "input", value: "~300" },
    { key: "output", value: "~30" },
    { key: "context", value: "~830" },
    { key: "context now", value: "200" },
    { key: "cost", value: "—", title: "no priced model" },
  ],
};

/** A blocked run whose failing node is named, with the verdict the classifier reached. */
export const BLOCKED: RunHeaderView = {
  cls: "bad",
  text: "blocked",
  failedNode: "gates-rebased",
  chips: FINISHED.chips,
  verdict: {
    class: "gate-failure",
    suggestedAction: "repair",
    salvageable: true,
    evidence: ["gate test-frontend exited 1", "no uncommitted tracked changes"],
  },
};

export const BLOCKED_GATE = "test-frontend";
export const WORKSPACE = "/home/op/adw-factory/runs/adw-store-01-tickets-dir/workspace";
