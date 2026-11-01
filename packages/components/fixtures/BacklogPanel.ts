import type { CopyRunMenuView } from "../src/molecules/CopyRunMenu/CopyRunMenu";
import type {
  BacklogPanelLabels,
  BacklogPanelView,
} from "../src/organisms/BacklogPanel/BacklogPanel";
import type { BacklogRowData } from "../src/organisms/BacklogRow/BacklogRow";
import { backlogRow, dispatchLineFor } from "./BacklogRow";

export { BACKLOG_TOKEN } from "./BacklogRow";

// Hand-written view models for `<BacklogPanel/>`: its test and its stories read these. Rendering
// the markdown body, tidying the reason, the dep ids, the outcome tones and the dispatch lines is
// the factory's projection; here the finished view is written out.

export const BACKLOG_PANEL_LABELS: BacklogPanelLabels = {
  close: "close (esc)",
  copyId: "copy id",
  id: "id",
  lastRun: "last run",
  pr: "PR",
  drift: "ledger drift",
  blocked: "why blocked — last run",
  attempts: "attempts",
  fields: {
    id: "id",
    project: "project",
    kind: "kind",
    status: "status",
    lane: "lane",
    priority: "priority",
    state: "state",
    created: "created",
    model: "model",
    review: "review",
    parseError: "parseError",
  },
  copyMenu: {
    copy: "copy",
    pick: "copy the run command — pick where the gate runs",
    thisMac: "this mac",
    line: "dispatch line",
  },
};

export const PANEL_PLAIN_LINE = dispatchLineFor("proj-abc123", "proj");
export const PANEL_FLAGGED_LINE = `${PANEL_PLAIN_LINE} --gate-host m1max`;

/** The project declares no gate host: one click copies. */
export const COPY_NO_HOSTS: CopyRunMenuView = {
  hasMenu: false,
  lastLine: PANEL_PLAIN_LINE,
  items: [],
};

/** One declared gate host: « this mac » then `m1max`. */
export const COPY_ONE_HOST: CopyRunMenuView = {
  hasMenu: true,
  lastLine: PANEL_PLAIN_LINE,
  items: [
    { host: undefined, line: PANEL_PLAIN_LINE },
    { host: "m1max", line: PANEL_FLAGGED_LINE },
  ],
};

/** Three declared hosts, in declared order. */
export const COPY_MANY_HOSTS: CopyRunMenuView = {
  hasMenu: true,
  lastLine: PANEL_PLAIN_LINE,
  items: [
    { host: undefined, line: PANEL_PLAIN_LINE },
    ...["zeta", "alpha", "m1max"].map((host) => ({
      host,
      line: `${PANEL_PLAIN_LINE} --gate-host ${host}`,
    })),
  ],
};

export const BACKLOG_PANEL_BODY_HTML =
  "<h1>Heading</h1><p>Some text.</p><ul><li>First</li><li>Second</li></ul>";

export const backlogPanelRow = (over: Partial<BacklogRowData> = {}): BacklogRowData =>
  backlogRow({ title: "Add the export button", ...over });

export const backlogPanelView = (over: Partial<BacklogPanelView> = {}): BacklogPanelView => ({
  section: "ready",
  copy: COPY_NO_HOSTS,
  bucketHint: undefined,
  reasonText: "",
  depIds: [],
  bodyHtml: BACKLOG_PANEL_BODY_HTML,
  attemptTones: [],
  ...over,
});

/** A blocked row with two attempts and two deps, for the stories. */
export const BLOCKED_PANEL_ROW: BacklogRowData = backlogPanelRow({
  status: "blocked",
  state: "blocked",
  created: "2026-09-20",
  model: "claude-sonnet-5",
  lastRunId: "proj-abc123-2000",
  lastPr: "https://github.com/o/r/pull/42",
  deps: [
    { id: "proj-0001", status: "done", met: true, hard: false },
    { id: "proj-0002", status: "blocked", met: false, hard: true },
    { id: "proj-0003", status: "queued", met: false, hard: false },
  ],
  attemptsList: [
    { runId: "proj-abc123-1000", outcome: "blocked" },
    { runId: "proj-abc123-2000", outcome: "green", pr: "https://github.com/o/r/pull/42" },
  ],
});
export const BLOCKED_PANEL_VIEW: BacklogPanelView = backlogPanelView({
  section: "blocked",
  copy: COPY_ONE_HOST,
  bucketHint: "draws on Fable 31% used",
  reasonText: "build: agent reported an error result: API Error: 400 — long tail kept",
  depIds: ["0001", "0002", "0003"],
  attemptTones: ["blocked", "green"],
});
