import type { BaseRedLabels, RunBaseRed } from "../src/atoms/BaseRedChip/BaseRedChip";

// Hand-written view models for `<BaseRedChip/>`: its test and its stories read these.

/** Two red gates over a 13-char sha: the title keeps seven chars and lists both gates. */
export const BASE_RED: RunBaseRed = {
  sha: "abcdef1234567",
  gates: [
    { name: "test", count: 12 },
    { name: "lint", count: 2 },
  ],
};

/** A sha shorter than seven chars, one gate. */
export const BASE_RED_SHORT_SHA: RunBaseRed = {
  sha: "abc",
  gates: [{ name: "test", count: 3 }],
};

/** One gate over a full sha: the title carries no separator. */
export const BASE_RED_ONE_GATE: RunBaseRed = {
  sha: "abcdef1234567",
  gates: [{ name: "lint", count: 2 }],
};

/** Three gates, to check the title lists every gate in order. */
export const BASE_RED_THREE_GATES: RunBaseRed = {
  sha: "abcdef1234567",
  gates: [
    { name: "a", count: 1 },
    { name: "b", count: 2 },
    { name: "c", count: 3 },
  ],
};

/** The words the host passes for the chip and its title. */
export const BASE_RED_LABELS: BaseRedLabels = {
  chip: "base red",
  base: "base",
  wasRed: "was red",
  tests: "tests",
};
