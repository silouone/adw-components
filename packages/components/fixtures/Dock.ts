import type { DockFailure, DockLabels, DockView } from "../src/organisms/Dock/Dock";
import { DRAWER, FAILED_BLOCK, FAILURE, FIGURES, BLOCK, LABELS as DRAWER_LABELS } from "./Drawer";
import { LABELS as SCOPE_LABELS, SUMMARY } from "./RunScopeSection";

// Hand-written view models for `<Dock/>`: its test and its stories read these. A blocked run with
// two boxes on the rail: a build that passed, a gates box holding the failing node.

export { SUMMARY };

export const LABELS: DockLabels = {
  overview: "overview",
  run: "run",
  blockedAt: "blocked at",
  gate: "gate",
  open: "open",
  restoreGantt: "restore the Gantt",
  fullScreen: "full screen — collapse the Gantt to its header",
  markdown: "md",
  raw: "raw",
  markdownTitle: "markdown / raw",
  close: "close (Esc) — back to the full Gantt",
  drawer: DRAWER_LABELS,
  scope: SCOPE_LABELS,
};

export const FAILURE_BANNER: DockFailure = { headline: "2 tests failed", gate: "test-frontend" };

export const BLOCKED: DockView = {
  cls: "bad",
  text: "blocked",
  failedNode: "gates",
  failureScope: "gates::1",
  stripLine: "✕ blocked at gates — 2 tests failed",
  rail: [
    {
      key: "build::1",
      box: { label: "build", outcomeClass: "ok" },
      dur: "1m 05s",
      drawers: [
        {
          key: "build::build::0",
          member: { role: "build", block: BLOCK },
          drawer: DRAWER,
          figures: FIGURES,
        },
      ],
    },
    {
      key: "gates::1",
      box: { label: "gates", outcomeClass: "bad" },
      dur: "25s",
      drawers: [
        {
          key: "gates::gates::65000",
          member: { role: "gates", block: FAILED_BLOCK },
          failure: FAILURE,
          figures: { ...FIGURES, outcome: "bad", glyph: "✕", blockGates: [] },
        },
      ],
    },
  ],
};

/** A green run: no failing node, no strip line, only the build on the rail. */
export const GREEN: DockView = { cls: "ok", text: "green", rail: BLOCKED.rail.slice(0, 1) };
