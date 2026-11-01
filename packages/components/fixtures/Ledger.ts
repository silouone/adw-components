import type { UpNextEntry } from "../src/atoms/UpNext/UpNext";
import type { LedgerLabels, LedgerView } from "../src/organisms/Ledger/Ledger";
import {
  BUILD_1,
  BUILD_2,
  DISPATCH,
  GATES_GREEN,
  GATES_RED,
  NOW,
  PLAN,
  PROVISION,
  REVIEW,
  RUN_FACES,
} from "./HoverCard";

// Hand-written view models for `<Ledger/>`: its test and its stories read these. The rows are
// the run of `fixtures/HoverCard`: the two quick setup steps folded, then one row per step.

export const LABELS: LedgerLabels = {
  step: "step",
  whatResult: "what · result",
  agentThinking: "agent · thinking",
  when: "when",
  took: "took",
  turnsTokens: "turns · tok",
  quickSteps: "quick steps",
  skipped: "skipped on this path",
  upNext: "up next",
  preExisting: "pre-existing",
  rigNotJournaled: "rig not journaled",
};

export { NOW, RUN_FACES };

export const LEDGER: LedgerView = {
  rows: [
    { kind: "fold", steps: [PROVISION, DISPATCH], dur: "900ms" },
    { kind: "step", step: PLAN },
    { kind: "step", step: BUILD_1 },
    { kind: "step", step: GATES_RED },
    { kind: "step", step: BUILD_2 },
    { kind: "step", step: GATES_GREEN },
    { kind: "step", step: REVIEW },
  ],
  span: { lo: 0, span: NOW },
};

/** The run before its first step. */
export const EMPTY: LedgerView = { rows: [], span: { lo: 0, span: 1 } };

export const UP_NEXT: readonly UpNextEntry[] = [
  { node: "open-pr", status: "pending" },
  { node: "merge", status: "not-run" },
];
