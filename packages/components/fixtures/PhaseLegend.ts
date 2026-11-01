import type { PhaseLegendLabels } from "../src/atoms/PhaseLegend/PhaseLegend";

// Hand-written view model for `<PhaseLegend/>`: its test and its stories read this.

/** The seven phases of a run, in run order. */
export const PHASES: readonly string[] = [
  "setup",
  "plan",
  "build",
  "test",
  "gates",
  "review",
  "ship",
];

/** The words the host passes for the non-phase marks and the hint. */
export const PHASE_LEGEND_LABELS: PhaseLegendLabels = {
  waiting: "waiting for a slot",
  blocked: "blocked",
  hint: "full height = agent · thin = code",
};
