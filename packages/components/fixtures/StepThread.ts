import type { StepThreadView } from "../src/molecules/StepThread/StepThread";

// Hand-written view models for `<StepThread/>`: its test and its stories read these.

/** The hover card of the trailing wait dot, as the host words it. */
export const WAIT_LABEL = "waiting for a slot";

/** Code, an agent and a blocked gate: three phases, so two phase gaps. */
export const THREE_PHASES: StepThreadView = {
  n: 3,
  gaps: 2,
  waits: false,
  dots: [
    { cls: "st-dot ph-setup k-det", tip: "setup · dispatch\n500ms\ncode" },
    { cls: "st-dot ph-plan k-agent gap", tip: "plan · plan\n1m 05s\nagent" },
    { cls: "st-dot ph-gates k-gate blocked gap", tip: "gates · gates\n3.0s\ngate run\nblocked" },
  ],
};

/** `build` then `red-check` share a phase; `test` opens the next one. */
export const SAME_PHASE_THEN_NEW: StepThreadView = {
  n: 3,
  gaps: 1,
  waits: false,
  dots: [
    { cls: "st-dot ph-build k-agent", tip: "build · build\n1m 05s\n1.50M tokens\nagent" },
    { cls: "st-dot ph-build k-gate", tip: "build · red-check\n3.0s\ngate run" },
    { cls: "st-dot ph-test k-agent gap", tip: "test · test\n40s\nagent" },
  ],
};

/** One agent step, then the run waits for a slot. */
export const WAITING: StepThreadView = {
  n: 2,
  gaps: 0,
  waits: true,
  dots: [{ cls: "st-dot ph-build k-agent", tip: "build · build\n1m 05s\nagent" }],
};

/** A longer run: a live step, a warning and a blocked step. */
export const LONG_RUN: StepThreadView = {
  n: 8,
  gaps: 5,
  waits: false,
  dots: [
    { cls: "st-dot ph-setup k-det", tip: "setup · dispatch\n500ms\ncode" },
    { cls: "st-dot ph-plan k-agent gap", tip: "plan · plan\n41s\nagent" },
    { cls: "st-dot ph-build k-agent gap", tip: "build · build\n2m 10s\nagent" },
    { cls: "st-dot ph-test k-agent gap", tip: "test · test\n38s\nagent" },
    { cls: "st-dot ph-gates k-gate warn gap", tip: "gates · gates\n31s\ngate run\nwarn" },
    { cls: "st-dot ph-review k-agent live gap", tip: "review · review\n52s\nagent" },
    { cls: "st-dot ph-ship k-det gap", tip: "ship · commit\n500ms\ncode" },
    { cls: "st-dot ph-other k-det blocked", tip: "other · publish\n1s\ncode\nblocked" },
  ],
};

/** No phases yet: the empty thread. */
export const EMPTY: StepThreadView = { n: 0, gaps: 0, waits: false, dots: [] };
