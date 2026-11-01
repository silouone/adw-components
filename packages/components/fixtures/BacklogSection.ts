import type { BacklogRowData, BacklogRowProps } from "../src/organisms/BacklogRow/BacklogRow";
import { BACKLOG_ROW_LABELS, backlogRow, backlogRowView } from "./BacklogRow";

export { BACKLOG_GRID_CSS, BACKLOG_TOKEN } from "./BacklogRow";

// Hand-written inputs for `<BacklogSection/>`: its test and its stories read these.

export const BACKLOG_SECTION_NOTES: Readonly<Record<string, string>> = {
  blocked: "the last run ended blocked — the reason is on the row",
  waiting: "a dependency is not done yet",
  ready: "dispatchable now, priority order",
  "in-flight": "in-progress or in-review, no live run",
};

export const BACKLOG_SECTION_ROWS: readonly BacklogRowData[] = [
  backlogRow({ id: "proj-101", title: "Add the export button", lane: "feat", priority: 1 }),
  backlogRow({ id: "proj-102", title: "Fix the stale cache", lane: "bug", priority: 2 }),
  backlogRow({ id: "proj-103", title: "Tidy the settings page", lane: "chore", priority: 3 }),
];

/** What the root owns for each row: its view, labels and callbacks. */
export const backlogSectionRowProps = (
  row: BacklogRowData,
): Omit<BacklogRowProps, "row" | "token"> => ({
  view: backlogRowView({ idText: row.id.replace(/^proj-/, "") }),
  labels: BACKLOG_ROW_LABELS,
  onSelect: () => {},
  onCopy: () => {},
});
