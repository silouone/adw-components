import type {
  DrawerBlock,
  DrawerFigures,
  DrawerLabels,
  DrawerView,
  ReviewFinding,
} from "../src/organisms/Drawer/Drawer";
import type { FailurePaneView } from "../src/organisms/FailureView/FailureView";

// Hand-written view models for `<Drawer/>`: its test and its stories read these. The node is a
// build agent that passed its gate on a repair round.

export const LABELS: DrawerLabels = {
  round: { attempt: "attempt", of: "of" },
  watchdog: "lane stalled",
  model: "model",
  tool: "tool",
  blockedOnSubagent: "blocked on subagent",
  kind: "kind",
  attempt: "attempt",
  of: "of",
  systemPrompt: "system prompt",
  systemPromptPreset: "preset",
  systemPromptEmpty: "empty",
  systemPromptNotRecorded: "not recorded",
  config: "config",
  configNotCaptured: "not captured on this provider",
  configAbsent: "absent",
  reviewAxis: "review axis",
  noFindings: "no findings",
  contextNow: "context now",
  calls: "calls",
  tokens: "tokens",
  tokensIn: "in",
  tokensOut: "out",
  cacheRead: "cache read",
  cacheWrite: "cache write",
  notPersisted: "prompt not persisted",
  mismatch: "prompt mismatch",
  expected: "expected",
  actual: "actual",
  bytes: "bytes",
  hash: "hash",
};

export const BLOCK: DrawerBlock = { node: "build" };

/** A finished node with every figure present: a model/tool split and a gate chip. */
export const FIGURES: DrawerFigures = {
  outcome: "ok",
  glyph: "✓",
  purpose: "writes the change",
  stats: [
    { label: "duration", value: "1m 05s" },
    { label: "turns", value: "3" },
    { label: "billed", value: "500" },
    { label: "context", value: "1,200" },
    { label: "s/turn", value: "21.7" },
    { label: "tok/s", value: "7.7" },
    { label: "tok/s (model)", value: "9.1" },
  ],
  split: { modelPct: "70.0", toolPct: "30.0", model: "45s", tool: "20s" },
  blockGates: [{ name: "lint", pass: true }],
};

/** A node a deterministic lane ran: its agent figures can never arrive, so they read n/a. */
export const NOT_APPLICABLE_FIGURES: DrawerFigures = {
  outcome: FIGURES.outcome,
  glyph: FIGURES.glyph,
  purpose: FIGURES.purpose,
  stats: FIGURES.stats.map((s) => (s.label === "duration" ? s : { ...s, value: "n/a" })),
  blockGates: [],
};

export const FINDING: ReviewFinding = {
  axis: "spec",
  file: "src/a.ts",
  line: 12,
  severity: "hard",
  kind: "missing",
  summary: "the guard is missing",
  citation: "spec §4",
};

export const DRAWER: DrawerView = {
  node: "build",
  kind: "agent",
  attempt: { round: 2, of: 3 },
  prompt: { status: "ok", text: "Write the change." },
  systemPrompt: { status: "preset" },
  config: { status: "captured", config: { model: "opus", tools: ["Read", "Edit"] } },
};

export const REVIEW_DRAWER: DrawerView = {
  node: "review-spec",
  kind: "review",
  review: {
    axis: "spec",
    findings: [
      FINDING,
      {
        axis: "spec",
        file: "src/a.ts",
        severity: "judgement",
        summary: "name it",
        citation: "spec §2",
      },
    ],
    dispositions: [{ finding: FINDING, disposition: "fixed", reason: "added the guard" }],
  },
};

export const GATES_FIGURES: DrawerFigures = {
  ...FIGURES,
  gates: [
    { name: "lint", cls: "gate-pass", chip: "⇢ m1max" },
    { name: "test", cls: "gate-fail", note: "fell back to local" },
  ],
};

export const LIVE_FIGURES: DrawerFigures = {
  ...FIGURES,
  outcome: "live",
  glyph: "●",
  live: {
    contextNow: "42,000",
    calls: "7",
    tokens: "9,100",
    input: "6,000",
    output: "1,100",
    cacheRead: "1,500",
    cacheWrite: "500",
  },
};

export const FAILED_BLOCK: DrawerBlock = { node: "gates", reason: "exit 1 in test-frontend" };

export const FAILURE: FailurePaneView = {
  headline: "2 tests failed",
  summary: [{ key: "node", value: "gates" }],
  tabs: ["output"],
  code: [],
  frames: [],
  output: [[{ text: "FAIL src/a.test.ts", color: "red" }]],
};
