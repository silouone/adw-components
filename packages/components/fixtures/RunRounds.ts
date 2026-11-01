import type { RunRoundsLabels, RunRoundsView } from "../src/molecules/RunRounds/RunRounds";

// Hand-written view models for `<RunRounds/>`: its test and its stories read these.

export const LABELS: RunRoundsLabels = {
  back: "← the build run this round maintains",
  rebase: "rebase round",
  ci: "CI round",
  live: "live",
};

export const hrefFor = (runId: string): string => `/run?id=${encodeURIComponent(runId)}`;

/** A round's screen: it links back to its build run and lists no rounds. */
export const ON_A_ROUND: RunRoundsView = { build: "acme-7-build-1", rounds: [] };

/** A build run's screen: three rounds, newest first, one still running, one unpriced. */
export const ON_A_BUILD: RunRoundsView = {
  rounds: [
    { runId: "acme-7-rebase-2", round: "rebase", state: "running", dur: "1m 04s", cost: "$0.12" },
    {
      runId: "acme-7-ci-1",
      round: "ci",
      state: "finished",
      outcome: "fixed",
      dur: "6m 30s",
      cost: "$1.48",
    },
    { runId: "acme-7-ci-0", round: "ci", state: "unknown", dur: "—", cost: "—" },
  ],
};
