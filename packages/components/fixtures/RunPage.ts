// Hand-written view models for `<RunPage/>`: its test and its stories read these. The pieces are the
// organisms' own fixtures, composed; the three screen states live in `./run/`.

import type { RunPageLabels, RunPageView, RunScreenView } from "../src/pages/RunPage/RunPage";
import {
  BLOCKED as DOCK_BLOCKED,
  FAILURE_BANNER,
  GREEN as DOCK_GREEN,
  LABELS as DOCK_LABELS,
  SUMMARY,
} from "./Dock";
import { FAILURE_TITLE, GREEN as STRIP_GREEN, TICKET_ID } from "./GanttStrip";
import { LABELS as HOVER_LABELS, VIEWPORT } from "./HoverCard";
import { JOURNEY, LABELS as JOURNEY_LABELS } from "./Journey";
import { LABELS as LANES_LABELS, LANES, LAYOUT, RUN_FACES } from "./Lanes";
import { LABELS as LEDGER_LABELS, LEDGER, UP_NEXT } from "./Ledger";
import { IDENTITY, LABELS as HEADER_LABELS } from "./RunHeader";
import { LABELS as ROUNDS_LABELS, ON_A_BUILD } from "./RunRounds";

export { TICKET_ID };

export const RUN_PAGE_LABELS: RunPageLabels = {
  crumb: "all runs",
  header: HEADER_LABELS,
  rounds: ROUNDS_LABELS,
  lanes: LANES_LABELS,
  ledger: LEDGER_LABELS,
  journey: JOURNEY_LABELS,
  hover: HOVER_LABELS,
  dock: DOCK_LABELS,
  upNext: "up next",
  failureTitle: FAILURE_TITLE,
};

export const RUN_PAGE_GRID_URL = "/board?token=t%20k";

/** The screen's pieces with nothing run-specific: a header, the lanes, the dock overview. */
export const RUN_SCREEN: RunScreenView = {
  identity: { ...IDENTITY, ticketId: TICKET_ID },
  head: { cls: "ok", text: "green", chips: [] },
  strip: STRIP_GREEN,
  providers: ["claude"],
  rounds: ON_A_BUILD,
  layout: LAYOUT,
  lanes: LANES,
  ledger: LEDGER,
  journey: JOURNEY,
  faces: RUN_FACES,
  upNext: UP_NEXT,
  viewNow: 180_900,
  dock: DOCK_GREEN,
  summary: SUMMARY,
};

/** The page before its first frame, on the run route, dock open on the overview. */
export const RUN_PAGE_BASE: RunPageView = {
  labels: RUN_PAGE_LABELS,
  embedded: false,
  stale: false,
  gridUrl: RUN_PAGE_GRID_URL,
  scope: "run",
  shut: false,
  full: false,
  md: false,
  tab: "gantt",
  viewport: VIEWPORT,
  zoom: 1,
};

export { DOCK_BLOCKED, FAILURE_BANNER };
