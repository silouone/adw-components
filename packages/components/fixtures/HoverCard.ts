import type {
  BlockView,
  GateView,
  HoverCardLabels,
  Hovered,
  RunStepView,
  StepFace,
  StepFaces,
  StepMember,
} from "../src/organisms/HoverCard/HoverCard";
import type { RigView } from "../src/molecules/Rig/Rig";

// Hand-written view models for `<HoverCard/>`, and the one run the lanes, the ledger and the
// journey all draw: a live review, two gate runs (one red, one green) and a repair round.
// Their tests and stories read these.

export const LABELS: HoverCardLabels = {
  round: "round",
  turns: "turns",
  tokens: "tokens",
  toolCalls: "tool calls",
  noCapture: "no session capture",
  watchdog: "watchdog",
  openHint: "click to open its prompt and output",
  quickSteps: "quick steps",
  preExisting: "pre-existing",
  more: "more",
  rigNotJournaled: "rig not journaled",
  rigNone: "deterministic · no tokens",
};

export const RIG_CLAUDE: RigView = {
  provider: "claude",
  model: "opus-5-5",
  effort: "high",
  gear: "G2",
  title: "claude · claude-opus-5-5 · thinking high · gear G2",
};

export const RIG_CODEX: RigView = {
  provider: "codex",
  model: "gpt-6-sol",
  effort: "high",
  gear: "G1",
  title: "codex · gpt-6-sol · thinking high · gear G1",
};

/** A face with every figure present; override what a case is about. */
export const face = (overrides: Partial<StepFace> = {}): StepFace => ({
  kind: "agent",
  agent: true,
  outcome: "ok",
  glyph: "✓",
  durMs: 1_000,
  dur: "1.0s",
  purpose: "",
  why: "",
  phase: "build",
  rig: undefined,
  from: "+0ms",
  to: "+1.0s",
  turns: "—",
  tokens: "—",
  gates: [],
  ...overrides,
});

export const member = (role: string, block: BlockView): StepMember => ({ role, block });

export const faceKeyOf = ({ role, block }: StepMember): string =>
  `${role}::${block.node}::${block.start}`;

export const facesOf = (entries: readonly (readonly [StepMember, StepFace])[]): StepFaces =>
  new Map(entries.map(([m, f]) => [faceKeyOf(m), f]));

export const LINT_PASS: GateView = { name: "lint", outcome: "pass" };
export const TEST_FAIL: GateView = {
  name: "test",
  outcome: "fail",
  failingTests: ["parses a ticket id", "rejects an empty node"],
  introducedFailingTests: ["parses a ticket id"],
};
export const TEST_PASS: GateView = { name: "test", outcome: "pass" };
export const E2E_SKIPPED: GateView = {
  name: "e2e",
  outcome: "pass",
  skipped: true,
  reason: "paths",
};

/** The clock the run is read at: the review step is still open. */
export const NOW = 180_900;

const step = (role: string, railKey: string, block: BlockView): RunStepView => ({
  role,
  railKey,
  block,
});

export const PROVISION = step("workspace", "workspace::provision", {
  node: "provision",
  start: 0,
  end: 500,
  inProgress: false,
});
export const DISPATCH = step("workspace", "workspace::dispatch", {
  node: "dispatch",
  start: 500,
  end: 900,
  inProgress: false,
});
export const PLAN = step("plan", "plan::plan", {
  node: "plan",
  start: 900,
  end: 40_900,
  inProgress: false,
});
export const BUILD_1 = step("build", "build::build::1", {
  node: "build",
  start: 40_900,
  end: 100_900,
  inProgress: false,
  round: { round: 1, of: 2 },
  capture: { status: "ok", dots: [{}, {}, {}, {}] },
});
export const GATES_RED = step("workspace", "workspace::gates::1", {
  node: "gates",
  start: 100_900,
  end: 110_900,
  inProgress: false,
  gates: [LINT_PASS, TEST_FAIL, E2E_SKIPPED],
});
export const BUILD_2 = step("build", "build::build::2", {
  node: "build",
  start: 110_900,
  end: 150_900,
  inProgress: false,
  round: { round: 2, of: 2 },
  capture: { status: "none", dots: [] },
});
export const GATES_GREEN = step("workspace", "workspace::gates::2", {
  node: "gates",
  start: 150_900,
  end: 158_900,
  inProgress: false,
  gates: [LINT_PASS, TEST_PASS],
});
export const REVIEW = step("review", "review::review", {
  node: "review",
  start: 158_900,
  inProgress: true,
});

/** Every step of the run, in execution order. */
export const RUN_STEPS: readonly RunStepView[] = [
  PROVISION,
  DISPATCH,
  PLAN,
  BUILD_1,
  GATES_RED,
  BUILD_2,
  GATES_GREEN,
  REVIEW,
];

export const RUN_FACES: StepFaces = facesOf([
  [
    PROVISION,
    face({
      kind: "det",
      agent: false,
      glyph: "✓",
      durMs: 500,
      dur: "500ms",
      why: "set the workspace up",
      phase: "setup",
      from: "+0ms",
      to: "+500ms",
    }),
  ],
  [
    DISPATCH,
    face({
      kind: "det",
      agent: false,
      durMs: 400,
      dur: "400ms",
      why: "hand the ticket to a slot",
      phase: "setup",
      from: "+500ms",
      to: "+900ms",
    }),
  ],
  [
    PLAN,
    face({
      durMs: 40_000,
      dur: "40s",
      purpose: "read the ticket and plan the change",
      why: "read the ticket and plan the change",
      phase: "plan",
      rig: RIG_CLAUDE,
      from: "+900ms",
      to: "+40s",
      turns: "6",
      tokens: "310k",
    }),
  ],
  [
    BUILD_1,
    face({
      durMs: 60_000,
      dur: "1m 00s",
      purpose: "implement the plan",
      why: "implement the plan",
      phase: "build",
      rig: RIG_CODEX,
      from: "+40s",
      to: "+1m 41s",
      turns: "14",
      tokens: "1.2M",
    }),
  ],
  [
    GATES_RED,
    face({
      kind: "gate",
      agent: false,
      outcome: "bad",
      glyph: "✕",
      durMs: 10_000,
      dur: "10s",
      why: "run the gates",
      phase: "gates",
      from: "+1m 41s",
      to: "+1m 51s",
      gates: [
        { gate: LINT_PASS, suffix: "" },
        { gate: TEST_FAIL, suffix: "" },
        { gate: E2E_SKIPPED, suffix: "" },
      ],
    }),
  ],
  [
    BUILD_2,
    face({
      durMs: 40_000,
      dur: "40s",
      purpose: "implement the plan",
      why: "repair the red test",
      phase: "build",
      rig: RIG_CODEX,
      from: "+1m 51s",
      to: "+2m 31s",
      turns: "9",
      tokens: "640k",
    }),
  ],
  [
    GATES_GREEN,
    face({
      kind: "gate",
      agent: false,
      durMs: 8_000,
      dur: "8.0s",
      why: "run the gates",
      phase: "gates",
      from: "+2m 31s",
      to: "+2m 39s",
      gates: [
        { gate: LINT_PASS, suffix: "" },
        { gate: TEST_PASS, suffix: "" },
      ],
    }),
  ],
  [
    REVIEW,
    face({
      outcome: "live",
      glyph: "◌",
      durMs: 22_000,
      dur: "22s",
      purpose: "review the diff against the ticket",
      why: "review the diff against the ticket",
      phase: "review",
      rig: RIG_CLAUDE,
      from: "+2m 39s",
      to: "now",
      turns: "3",
      tokens: "90k",
    }),
  ],
]);

/** The pointer over the second build round, near the top left. */
export const HOVER_BUILD: Hovered = { members: [BUILD_2], x: 100, y: 100 };
/** The pointer over the red gate run. */
export const HOVER_GATES: Hovered = { members: [GATES_RED], x: 400, y: 120 };
/** The pointer over a marker clustering the two quick setup steps. */
export const HOVER_CLUSTER: Hovered = { members: [PROVISION, DISPATCH], x: 60, y: 80 };

/** A viewport of 1200 by 800 px at page zoom 1. */
export const VIEWPORT = { w: 1200, h: 800 } as const;
