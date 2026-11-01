import type { Crumb, StageHeaderLabels } from "../src/molecules/StageHeader/StageHeader";

// Hand-written view models for `<StageHeader/>`: its test and its stories read these.

export const STAGE_LABELS: StageHeaderLabels = {
  run: "run",
  back: "back to the board",
  fullScreen: "full screen",
  fullScreenHint: "close both rails",
  copy: "copy",
  copied: "copied",
};

/** No selection: every filter reads `all`. */
export const CRUMBS_ALL: readonly Crumb[] = [
  { eyebrow: "RUNNER", value: "all" },
  { eyebrow: "PROJECT", value: "all" },
];

/** Three segments, the last with the provider glyph before its value. */
export const CRUMBS_THREE: readonly Crumb[] = [
  { eyebrow: "RUNNER", value: "this mac" },
  { eyebrow: "WORKSPACE", value: "adw-factory · worktree" },
  { eyebrow: "AGENT", value: "claude · feat", glyph: "✳" },
];

export const CRUMBS_ONE: readonly Crumb[] = [{ eyebrow: "RUNNER", value: "all" }];

export const CRUMBS_NO_GLYPH: readonly Crumb[] = [{ eyebrow: "AGENT", value: "unknown · feat" }];

/** The run open on the stage: its full id and the label the host derived from it. */
export const RUN_ID = "adw-demo-9-agent-1791963430406";
export const RUN = { runId: RUN_ID, label: "1791963430406" } as const;
