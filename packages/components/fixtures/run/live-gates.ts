import type { RunPageView } from "../../src/pages/RunPage/RunPage";
import { RUNNING } from "../GanttStrip";
import { LIVE } from "../RunHeader";
import { RUN_PAGE_BASE, RUN_SCREEN } from "../RunPage";

/** A run in flight: the gates round is open, the dock sits on the overview. */
export const LIVE_GATES: RunPageView = {
  ...RUN_PAGE_BASE,
  run: {
    ...RUN_SCREEN,
    head: LIVE,
    strip: RUNNING,
    dock: { ...RUN_SCREEN.dock, cls: "live", text: "● live" },
  },
};
