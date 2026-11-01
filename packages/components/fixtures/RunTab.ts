// Hand-written view models for `<RunTab/>`: a run waiting for a slot, a run holding one, a
// live run with no queue entry and a run with two attempts.

import type { RunTabLabels, RunTabView } from "../src/organisms/RunTab/RunTab";
import { HANDLES_FINISHED, HANDLES_FULL, HANDLES_LABELS } from "./Handles";

export const RUN_TAB_LABELS: RunTabLabels = {
  inLine: "in line",
  inLineOn: "in line on",
  since: "since",
  waited: "waited",
  free: "free",
  behind: "behind",
  holding: "holding a slot",
  slot: "slot",
  on: "on",
  where: "where",
  runner: "runner",
  workspace: "workspace",
  inFlight: "in flight",
  factory: "factory",
  started: "started",
  agent: "agent",
  attempts: "attempts",
  handles: HANDLES_LABELS,
};

const WHERE = {
  runner: "this mac",
  workspace: "sabado · worktree",
  inFlight: "strip-tags",
  factory: "abc1234 dirty",
  started: "20m ago · 10:12",
};

const AGENT = { glyph: "✳", model: "claude-sonnet-5-5", line: "claude · worktree" };

const BUILD_ATTEMPT = {
  tone: "run",
  kind: "build",
  ago: "20m ago",
  outcome: "running",
  duration: "20m 0s",
} as const;

/** A run third in line on this mac: two bays held, one free, two runs behind it. */
export const RUN_TAB_WAITING: RunTabView = {
  queue: {
    kind: "queue",
    ordinal: "3rd",
    host: "this mac",
    since: "10:26",
    waited: "34m",
    bays: [
      {
        index: 1,
        holder: { ticketId: "sabado-1-holder", gate: "test", ageText: "13m", pct: 43 },
      },
      {
        index: 2,
        holder: { ticketId: "sabado-2-holder", gate: "lint", ageText: "4m", pct: 13 },
      },
      { index: 3 },
    ],
    behind: ["sabado-276-waiting", "sabado-277-waiting"],
  },
  where: WHERE,
  handles: HANDLES_FULL,
  agent: AGENT,
  attempts: { count: 1, rows: [BUILD_ATTEMPT] },
};

/** A run on the first bay of this mac, 43% into the gate's timeout. */
export const RUN_TAB_HOLDING: RunTabView = {
  ...RUN_TAB_WAITING,
  queue: { kind: "slot", slot: 1, host: "this mac", gate: "test", timeout: "30m", pct: 43 },
};

/** A live run that never queued: no queue block. */
export const RUN_TAB_RUNNING: RunTabView = { ...RUN_TAB_WAITING, queue: undefined };

/** A ticket whose CI round passed after a blocked build. */
export const RUN_TAB_ATTEMPTS: RunTabView = {
  ...RUN_TAB_RUNNING,
  handles: HANDLES_FINISHED,
  attempts: {
    count: 2,
    rows: [
      {
        tone: "ok",
        kind: "ci round",
        ago: "5m ago",
        outcome: "green",
        duration: "1m 30s",
        pr: { number: 4, url: "https://github.com/silouone/adw-factory/pull/4" },
      },
      {
        tone: "bad",
        kind: "build",
        ago: "50m ago",
        outcome: "blocked",
        duration: "12m 0s",
      },
    ],
  },
};
