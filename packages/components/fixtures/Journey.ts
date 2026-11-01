import type { UpNextEntry } from "../src/atoms/UpNext/UpNext";
import type { JourneyLabels, JourneyStation, JourneyView } from "../src/organisms/Journey/Journey";
import {
  BUILD_1,
  BUILD_2,
  DISPATCH,
  GATES_GREEN,
  GATES_RED,
  PLAN,
  PROVISION,
  REVIEW,
  RUN_FACES,
  RUN_STEPS,
} from "./HoverCard";

export { RUN_FACES };

// Hand-written view models for `<Journey/>`: its test and its stories read these. The stations
// are the run of `fixtures/HoverCard`, one per phase, with the ship phase still to come.

export const LABELS: JourneyLabels = {
  left: "left",
  steps: "steps",
  toGo: "to go",
  upNext: "up next",
  round: "round",
  turns: "turns",
  rigNotJournaled: "rig not journaled",
};

const stations: readonly JourneyStation[] = [
  {
    phase: "setup",
    status: "ok",
    durationMs: 900,
    share: 0.005,
    steps: [PROVISION, DISPATCH],
    pending: [],
    rounds: 0,
  },
  {
    phase: "plan",
    status: "ok",
    durationMs: 40_000,
    share: 0.22,
    steps: [PLAN],
    pending: [],
    rounds: 0,
  },
  {
    phase: "build",
    status: "warn",
    durationMs: 100_000,
    share: 0.55,
    steps: [BUILD_1, BUILD_2],
    pending: [],
    rounds: 2,
  },
  {
    phase: "gates",
    status: "warn",
    durationMs: 18_000,
    share: 0.1,
    steps: [GATES_RED, GATES_GREEN],
    pending: [],
    rounds: 1,
  },
  {
    phase: "review",
    status: "live",
    durationMs: 22_000,
    share: 0.12,
    steps: [REVIEW],
    pending: [],
    rounds: 0,
  },
  {
    phase: "ship",
    status: "pending",
    durationMs: 0,
    share: 0,
    steps: [],
    pending: ["open-pr"],
    rounds: 0,
  },
];

export const JOURNEY: JourneyView = {
  steps: RUN_STEPS,
  stations,
  total: 180_900,
  stationDur: ["900ms", "40s", "1m 40s", "18s", "22s", "—"],
};

/** The run before its first step: no station, nothing to draw. */
export const EMPTY: JourneyView = { steps: [], stations: [], total: 0, stationDur: [] };

/** The ship phase is still to come; the merge was skipped on this path. */
export const UP_NEXT: readonly UpNextEntry[] = [
  { node: "open-pr", status: "pending" },
  { node: "merge", status: "not-run" },
];
