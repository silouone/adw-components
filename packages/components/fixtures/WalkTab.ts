// Hand-written view models for `<WalkTab/>`: a bug run at its gates after two repair rounds, the
// same lane before anything ran, a failed node with a re-run one, a node beyond the lane's graph,
// and short chore and feat graphs.

import type { WalkRowView, WalkTabLabels, WalkTabView } from "../src/organisms/WalkTab/WalkTab";

export const WALK_TAB_LABELS: WalkTabLabels = {
  nodes: "nodes",
  noGraph: "no node graph for this run",
};

const BLURB = "something is broken and the fix must ship with a regression test";
const FACTORY = "owned by the factory";

const row = (
  node: string,
  state: WalkRowView["state"],
  tone: WalkRowView["tone"],
  over: Partial<WalkRowView> = {},
): WalkRowView => ({
  node,
  state,
  tone,
  runs: state === "next" ? 0 : 1,
  purpose: FACTORY,
  listed: true,
  msText: state === "now" ? "…" : state === "done" ? "5ms" : "",
  ...over,
});

const done = (node: string, over: Partial<WalkRowView> = {}) => row(node, "done", "ok", over);
const next = (node: string, over: Partial<WalkRowView> = {}) => row(node, "next", "faint", over);

const BUG_HEAD = ["dispatch", "provision", "baseline", "trace-audit", "baseline-green-check"];
const BUG_BODY = [
  "assemble-plan",
  "plan",
  "review-plan",
  "assemble-test-only",
  "build-test-only",
  "red-check",
  "assemble-fix",
];
const BUG_TAIL = [
  "trace",
  "review-standards",
  "review-spec",
  "strip-tags",
  "commit",
  "rebase-onto-base",
  "gates-rebased",
  "review-stamp",
  "push",
  "open-pr",
  "pr-preview",
];

/** Twelve nodes done, the gates live (third time), `repair` run twice beyond the graph under it. */
export const WALK_TAB: WalkTabView = {
  lane: "bug",
  blurb: BLURB,
  done: 12,
  total: 25,
  hue: 20,
  rows: [
    ...[...BUG_HEAD, ...BUG_BODY].map((n, i) =>
      done(n, { purpose: i === 0 ? FACTORY : "a step of the lane" }),
    ),
    next("build-fix", { purpose: "writes the fix" }),
    row("gates", "now", "live", { runs: 3, purpose: "the target's gates" }),
    done("repair", { runs: 2, listed: false, purpose: "repairs a red gate" }),
    ...BUG_TAIL.map((n) => next(n, { purpose: "a step of the lane" })),
  ],
};

/** The same lane before anything ran: every node next. */
export const WALK_TAB_FRESH: WalkTabView = {
  ...WALK_TAB,
  done: 0,
  rows: [...[...BUG_HEAD, ...BUG_BODY, "build-fix", "gates", ...BUG_TAIL].map((n) => next(n))],
};

/** A failed node and a node run twice. */
export const WALK_TAB_FAILED: WalkTabView = {
  ...WALK_TAB,
  done: 2,
  rows: [
    done("dispatch"),
    row("provision", "done", "bad"),
    done("baseline", { runs: 2 }),
    next("trace-audit"),
  ],
};

/** One node the run ran beyond the lane's graph: a row, not a bar segment. */
export const WALK_TAB_UNLISTED: WalkTabView = {
  ...WALK_TAB,
  done: 1,
  total: 2,
  rows: [done("dispatch"), done("revise-test-only", { listed: false }), next("provision")],
};

/** A chore run: its own lane name and graph. */
export const WALK_TAB_CHORE: WalkTabView = {
  lane: "chore",
  blurb: "mechanical work with no judgment",
  done: 0,
  total: 3,
  hue: 200,
  rows: [next("dispatch"), next("build"), next("push")],
};

/** A feat run: its own lane name and graph. */
export const WALK_TAB_FEAT: WalkTabView = {
  lane: "feat",
  blurb: "new capability where the shape is not obvious",
  done: 0,
  total: 4,
  hue: 140,
  rows: [next("dispatch"), next("plan"), next("test"), next("push")],
};
