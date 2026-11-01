// Hand-written view models for `<GatesTab/>`: a run whose test gate went red and was repaired, a
// run with a live gate, and the bare run with nothing to show but the static sections.

import type { GatesTabLabels, GatesView } from "../src/organisms/GatesTab/GatesTab";

export const GATES_TAB_LABELS: GatesTabLabels = {
  baseline: "baseline",
  gatePasses: "gate passes",
  targetGates: "target gates",
  whyRed: "why red",
  pass: "pass",
  more: "more",
  heavy: "heavy",
  noTarget: "target not on the wire",
};

/** Lint green, test red with nine failing names (six listed), test green on the repair pass. */
export const GATES_TAB: GatesView = {
  baseline: { text: "green · cached for this sha", tone: "ok", sha: "abc1234" },
  passes: [
    { mark: "✓", name: "lint", host: "local", ms: 3000, msText: "3s", failing: [], failingMore: 0 },
    {
      mark: "✕",
      name: "test",
      host: "m1max",
      ms: 120_000,
      msText: "2m",
      failing: ["a", "b", "c", "d", "e", "f"],
      failingMore: 3,
    },
    {
      mark: "✓",
      name: "test",
      pass: 2,
      host: "m1max",
      ms: 90_000,
      msText: "1m 30s",
      failing: [],
      failingMore: 0,
    },
  ],
  targetGates: [
    { name: "lint", heavy: false },
    { name: "test", heavy: true },
  ],
};

/** The same run while a gate is running: the live line closes the passes. */
export const GATES_TAB_LIVE: GatesView = {
  ...GATES_TAB,
  live: {
    node: "build-fix",
    gate: "test",
    host: "m1max",
    slot: 2,
    elapsedMs: 240_000,
    text: "● build-fix · test · m1max · slot 2 · 4m",
  },
};

/** A run blocked on a gate: the reason sits in its own section. */
export const GATES_TAB_RED: GatesView = {
  ...GATES_TAB,
  whyRed: "gate test failed",
};

/** No detail, no target, no activity: only the static sections. */
export const GATES_TAB_BARE: GatesView = {
  baseline: { text: "not checked yet", tone: "faint" },
  passes: [],
};

/** A passing gate that carries a stale failing name, a red one with exactly six, one with none. */
export const GATES_TAB_EDGES: GatesView = {
  baseline: { text: "red", tone: "bad" },
  passes: [
    { mark: "✓", name: "lint", failing: ["stale"], failingMore: 0 },
    {
      mark: "✕",
      name: "test",
      failing: ["a", "b", "c", "d", "e", "f"],
      failingMore: 0,
    },
    { mark: "✕", name: "build", failing: [], failingMore: 0 },
  ],
};
