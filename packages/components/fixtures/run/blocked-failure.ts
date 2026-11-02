import type { RunPageView } from "../../src/pages/RunPage/RunPage";
import { DOCK_BLOCKED, FAILURE_BANNER, RUN_PAGE_BASE, RUN_SCREEN } from "../RunPage";
import { BLOCKED as STRIP_BLOCKED } from "../GanttStrip";
import { BLOCKED as HEAD_BLOCKED } from "../RunHeader";

/** A blocked run: the failing gate is named in the strip, the header and the dock banner. */
export const BLOCKED_FAILURE: RunPageView = {
  ...RUN_PAGE_BASE,
  run: {
    ...RUN_SCREEN,
    identity: { ...RUN_SCREEN.identity, gate: "test-frontend" },
    head: HEAD_BLOCKED,
    strip: STRIP_BLOCKED,
    failureScope: "gates-rebased",
    failure: FAILURE_BANNER,
    leftBehind: { files: 3, path: "/home/op/adw-factory/runs/acme-7/workspace" },
    dock: DOCK_BLOCKED,
  },
};
