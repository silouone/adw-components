import type { GanttStripView } from "../src/organisms/GanttStrip/GanttStrip";

// Hand-written view models for `<GanttStrip/>`: its test and its stories read these. The lanes
// are those of a blocked run: a build that passed, a gate that failed.

export const TICKET_ID = "sabado-320-a-fact-quoted-from-its-batch-neighbour";

export const FAILURE_TITLE = "open the failing node";

export const BLOCKED: GanttStripView = {
  cls: "bad",
  text: "blocked",
  failedNode: "gates-rebased",
  clock: "2m 30s",
  spans: [
    { role: "workspace", left: 0, width: 66.7, failed: false },
    { role: "gates", left: 66.7, width: 33.3, failed: true },
  ],
};

/** A green run: no lane marked, no failure chip. */
export const GREEN: GanttStripView = {
  cls: "ok",
  text: "green",
  clock: "2m 30s",
  spans: BLOCKED.spans.map((s) => ({ ...s, failed: false })),
};

/** A running run: a live block still open in the last lane, a repair round after a gate pass. */
export const RUNNING: GanttStripView = {
  cls: "live",
  text: "● live",
  clock: "1m 12s",
  spans: [
    { role: "workspace", left: 0, width: 38, failed: false },
    { role: "gates", left: 38, width: 14, failed: false },
    { role: "repair", left: 52, width: 20, failed: false },
    { role: "build", left: 72, width: 28, failed: false },
  ],
};
