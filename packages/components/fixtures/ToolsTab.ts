// Hand-written view models for `<ToolsTab/>`: a run with a declared target and three captured
// agent rows, the bare run, one still live, and the skill-set and capture edges.

import type { ToolsTabLabels, ToolsView } from "../src/organisms/ToolsTab/ToolsTab";

export const TOOLS_TAB_LABELS: ToolsTabLabels = {
  couldUse: "the agent could use",
  factoryDefault: "the factory default",
  suiteGuard: "the suite guard denies the rest",
  skillsReaching: "skills reaching it",
  repo: "repo",
  categories: "categories",
  everyRepoSkill: "every repo skill",
  everyCategory: "every factory category",
  none: "none",
  everyStage: "every stage",
  contextGiven: "context it was given",
  files: "files",
  specs: "specs",
  artifacts: "artifacts",
  toolCalls: "tool calls",
  captured: "captured",
  noCaptureData: "no capture data",
  noCapture: "no capture",
  calls: "calls",
};

/** Declared tools, one global skill list, the repo's skills off, three agent rows (two captured). */
export const TOOLS_TAB: ToolsView = {
  allowed: ["Read", "Edit", "Bash(bun:*)"],
  skills: { repo: { kind: "none" }, global: { kind: "list", names: ["engineering"] } },
  context: {
    files: ["CLAUDE.md", "specs/constitution.md"],
    specs: ["adw-v1.32-board-redesign.md"],
    artifacts: ["plan → .adw/artifacts/plan.md"],
  },
  calls: {
    captured: 2,
    total: 3,
    rows: [
      { node: "plan", state: "ok", calls: 12, ms: 60_000, msText: "1m 00s" },
      { node: "build", state: "none", ms: 1, msText: "0s" },
      { node: "build-fix", state: "ok", calls: 3, ms: 180_000, msText: "3m 03s" },
    ],
  },
};

/** Nothing declared and nothing captured: every default applies. */
export const TOOLS_TAB_BARE: ToolsView = {
  skills: { repo: { kind: "all" }, global: { kind: "all" } },
  context: { files: [], specs: [], artifacts: [] },
};

/** Two agents still running: one with a count so far, one without any. */
export const TOOLS_TAB_LIVE: ToolsView = {
  ...TOOLS_TAB_BARE,
  calls: {
    captured: 1,
    total: 2,
    rows: [
      { node: "build", state: "live", calls: 4, msText: "…" },
      { node: "review-spec", state: "live", msText: "…" },
    ],
  },
};

/** Every agent captured. */
export const TOOLS_TAB_ALL_CAPTURED: ToolsView = {
  ...TOOLS_TAB_BARE,
  calls: {
    captured: 2,
    total: 2,
    rows: [
      { node: "plan", state: "ok", ms: 1, msText: "0s" },
      { node: "build", state: "ok", ms: 1, msText: "0s" },
    ],
  },
};

/** No agent captured. */
export const TOOLS_TAB_NONE_CAPTURED: ToolsView = {
  ...TOOLS_TAB_BARE,
  calls: {
    captured: 0,
    total: 2,
    rows: [
      { node: "plan", state: "none", ms: 1, msText: "0s" },
      { node: "build", state: "none", ms: 1, msText: "0s" },
    ],
  },
};

/** A target that allows no tool at all. */
export const TOOLS_TAB_NO_TOOLS: ToolsView = { ...TOOLS_TAB_BARE, allowed: [] };
