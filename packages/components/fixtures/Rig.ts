import type { RigView } from "../src/molecules/Rig/Rig";

// Hand-written view models for `<RigTag/>`: its test and its stories read these.

/** What a step without a journaled rig says. */
export const NONE_LABEL = "rig not journaled";

/** A claude step at high effort, with a gear. */
export const RIG_CLAUDE: RigView = {
  provider: "claude",
  model: "opus-5-5",
  effort: "high",
  gear: "G2",
  title: "claude · claude-opus-5-5 · thinking high · gear G2",
};

/** A codex step at max effort. */
export const RIG_CODEX: RigView = {
  provider: "codex",
  model: "gpt-5-codex",
  effort: "max",
  title: "codex · gpt-5-codex · thinking max",
};

/** A step with a thinking budget instead of an effort. */
export const RIG_BUDGET: RigView = {
  provider: "claude",
  model: "haiku-4-5",
  budget: "8k budget",
  title: "claude · claude-haiku-4-5-20251001 · thinking 8k budget",
};

/** Only a model was journaled. */
export const RIG_MODEL_ONLY: RigView = {
  model: "model ?",
  title: "provider not journaled · model not journaled · thinking not journaled",
};
