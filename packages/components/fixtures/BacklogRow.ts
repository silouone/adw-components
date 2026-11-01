import type {
  BacklogPrView,
  BacklogRowData,
  BacklogRowLabels,
  BacklogRowView,
  BacklogWaitView,
} from "../src/organisms/BacklogRow/BacklogRow";

// Hand-written view models for `<BacklogRow/>`: its test and its stories read these. Deriving
// the section, the why line, the wave, the age and the PR cell from the wire row is the
// factory's projection; here the finished view is written out.

export const BACKLOG_TOKEN = "tok";

/** The page owns the row's `grid-template-columns`; the stories stand in for it. */
export const BACKLOG_GRID_CSS =
  ".bl-cols{display:grid;grid-template-columns:2ch 9ch 9ch minmax(0,2fr) 7ch 4ch minmax(0,2fr) 16ch auto;gap:var(--sp-8);align-items:center}";

export const BACKLOG_ROW_LABELS: BacklogRowLabels = {
  noRuns: "no runs",
  attempts: "attempt(s)",
  reviewOff: "review: off",
  id: "id",
  copyIdTitle: "copy id (y)",
  run: "run",
  runKey: "(c)",
  dispatchLine: "dispatch line",
  pr: "PR",
  openLastRun: "open the last run",
  need: "need",
  unknown: "unknown",
};

/** A ready ticket that never ran. */
export const backlogRow = (over: Partial<BacklogRowData> = {}): BacklogRowData => ({
  id: "proj-abc123",
  project: "proj",
  title: "A title",
  kind: "ticket",
  lane: "chore",
  priority: 2,
  status: "queued",
  state: "ready",
  closed: false,
  deps: [],
  attemptsList: [],
  ...over,
});

/** A row of a kind that carries no lane and no priority (the keys are absent). */
export const backlogRowWithoutLane = (over: Partial<BacklogRowData> = {}): BacklogRowData => {
  const { lane: _lane, priority: _priority, ...rest } = backlogRow(over);
  return rest;
};

export const dispatchLineFor = (id: string, project: string, tail = ""): string =>
  `adw run --target ${project} --ticket ${id} --isolation worktree${tail}`;

/** The view of a ready ticket that never ran. */
export const backlogRowView = (over: Partial<BacklogRowView> = {}): BacklogRowView => ({
  section: "ready",
  idText: "abc123",
  why: { text: "ready", tone: "ok" },
  waits: undefined,
  joiners: [],
  dispatchLine: dispatchLineFor("proj-abc123", "proj"),
  last: undefined,
  pr: undefined,
  ...over,
});

/** The view of a row that ran: `blocked · 2h ago · ×2`. */
export const BLOCKED_ROW = backlogRow({
  lane: "bug",
  priority: 1,
  status: "blocked",
  state: "blocked",
  lastRunId: "proj-abc123-1000",
});
export const BLOCKED_VIEW = backlogRowView({
  section: "blocked",
  why: { text: "gates: gates exhausted 3 repair rounds", tone: "bad" },
  last: { outcome: "blocked", tone: "blocked", age: "2h ago", attempts: 2 },
});

/** A waiting row: wave 3, waiting on `02` and `03`. */
export const waitingRow = (ids: readonly string[]): BacklogRowData =>
  backlogRow({
    id: "proj-99",
    state: "waiting",
    deps: ids.map((id) => ({ id, status: "queued", met: false, hard: false })),
  });

export const waitingView = (
  ids: readonly string[],
  states: Readonly<Record<string, string>> = {},
  tone = "warn",
): BacklogRowView => {
  const waits: BacklogWaitView = {
    wave: 3,
    deps: ids.map((id) => ({
      id,
      label: id.replace(/^proj-/, ""),
      state: states[id] ?? "ready",
    })),
  };
  const joiners = ids.map((_, i) => (i === 0 ? "" : i === ids.length - 1 ? " & " : ", "));
  return backlogRowView({
    section: "waiting",
    idText: "99",
    why: { text: "waiting", tone },
    waits,
    joiners,
    dispatchLine: dispatchLineFor("proj-99", "proj"),
  });
};

/** An open PR in review, three days old. */
export const REVIEW_PR: BacklogPrView = {
  number: 612,
  url: "https://github.com/o/r/pull/612",
  bucket: "review",
  title: "PR #612 · reviewer · CI green · review none",
  glyph: "◔",
  label: "review",
  age: "3d",
  desync: false,
};
