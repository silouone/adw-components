import type {
  DrawnBox,
  LanesLabels,
  LanesView,
  LaneRowView,
  TimelineLayout,
} from "../src/organisms/Lanes/Lanes";
import {
  BUILD_1,
  BUILD_2,
  GATES_GREEN,
  GATES_RED,
  NOW,
  PLAN,
  PROVISION,
  DISPATCH,
  REVIEW,
  RIG_CLAUDE,
  RIG_CODEX,
  RUN_FACES,
} from "./HoverCard";
import type { RunStepView, StepOutcome } from "../src/organisms/HoverCard/HoverCard";

export { RUN_FACES };

// Hand-written view models for `<Lanes/>`: its test and its stories read these. The layout is
// a committed `TimelineLayout`: a cluster of two quick setup steps, a plan, a build with its
// repair round around a red and a green gate run, and a review still live at `NOW`.

export const LABELS: LanesLabels = {
  fit: "fit",
  deterministic: "deterministic · no tokens",
  rigNotJournaled: "rig not journaled",
  queued: "queued",
};

/** A box over one or more steps, placed on the run's own span `[0, NOW]` (percent). */
export const boxOf = (
  steps: readonly RunStepView[],
  outcomeClass: StepOutcome,
  render: DrawnBox["render"],
  label?: string,
): DrawnBox => {
  const first = steps[0] as RunStepView;
  const last = steps[steps.length - 1] as RunStepView;
  const start = first.block.start;
  const end = last.block.end ?? NOW;
  return {
    label: label ?? first.block.node,
    outcomeClass,
    render,
    left: (start / NOW) * 100,
    width: ((end - start) / NOW) * 100,
    members: steps,
  };
};

export const SETUP_BOX = boxOf([PROVISION, DISPATCH], "ok", "marker", "provision +1");
export const PLAN_BOX = boxOf([PLAN], "ok", "box");
export const BUILD_1_BOX = boxOf([BUILD_1], "ok", "box");
export const GATES_RED_BOX = boxOf([GATES_RED], "bad", "box");
export const BUILD_2_BOX = boxOf([BUILD_2], "ok", "box");
export const GATES_GREEN_BOX = boxOf([GATES_GREEN], "ok", "box");
export const REVIEW_BOX = boxOf([REVIEW], "live", "box");

export const LAYOUT: TimelineLayout = {
  boxes: [
    SETUP_BOX,
    PLAN_BOX,
    BUILD_1_BOX,
    GATES_RED_BOX,
    BUILD_2_BOX,
    GATES_GREEN_BOX,
    REVIEW_BOX,
  ],
  ticks: [
    { pct: 0, label: "0" },
    { pct: 33.333, label: "1m 00s" },
    { pct: 66.667, label: "2m 00s" },
    { pct: 100, label: "3m 00s" },
  ],
};

const lanes: readonly LaneRowView[] = [
  {
    lane: {
      role: "workspace",
      blocks: [PROVISION, DISPATCH, GATES_RED, GATES_GREEN].map((s) => s.block),
    },
    hue: 210,
    isWorkspace: true,
    label: "code",
    caveat: "deterministic steps: no model runs here",
    share: 15,
    busy: "19s",
    rigs: [undefined],
  },
  {
    lane: { role: "plan", blocks: [PLAN.block] },
    hue: 150,
    isWorkspace: false,
    label: "plan",
    share: 22,
    busy: "40s",
    rigs: [RIG_CLAUDE],
  },
  {
    lane: { role: "build", blocks: [BUILD_1.block, BUILD_2.block] },
    hue: 30,
    isWorkspace: false,
    label: "build",
    share: 55,
    busy: "1m 40s",
    rigs: [RIG_CODEX],
  },
  {
    lane: { role: "review", blocks: [REVIEW.block] },
    hue: 280,
    isWorkspace: false,
    label: "review",
    share: 12,
    busy: "22s",
    rigs: [RIG_CLAUDE],
  },
];

export const LANES: LanesView = {
  lanes,
  railKeys: new Map<DrawnBox, string>([
    [SETUP_BOX, "workspace::provision"],
    [PLAN_BOX, "plan::plan"],
    [BUILD_1_BOX, "build::build::1"],
    [GATES_RED_BOX, "workspace::gates::1"],
    [BUILD_2_BOX, "build::build::2"],
    [GATES_GREEN_BOX, "workspace::gates::2"],
    [REVIEW_BOX, "review::review"],
  ]),
};
