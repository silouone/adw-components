import type { AutonomyChip } from "../src/molecules/AutonomyChips/AutonomyChips";

// Hand-written view models for `<AutonomyChips/>`: its test and its stories read these.

/** The word the host passes between the target and the level. */
export const SHADOW_LABEL = "shadow";

/** One target with a dial reading. */
export const CHIPS: Readonly<Record<string, AutonomyChip>> = {
  "silou-hq": { level: "HOTL", reason: "chore · merge: at the edge" },
};

/** Two targets, deliberately out of key order. */
export const CHIPS_UNSORTED: Readonly<Record<string, AutonomyChip>> = {
  zeta: { level: "HITL", reason: "r" },
  alpha: { level: "HOOTL", reason: "r" },
};

/** A target and a reason that look like markup. */
export const CHIPS_MARKUP: Readonly<Record<string, AutonomyChip>> = {
  "<b>t</b>": { level: "HITL", reason: "<img src=x>" },
};
