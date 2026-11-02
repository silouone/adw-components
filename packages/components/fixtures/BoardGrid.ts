// Hand-written view models for `<BoardGrid/>`: its test and its stories read these.

export const BOARD_GRID_NOTICES: readonly string[] = [
  "projects.json: unreadable, showing the last good copy",
  "runs/ index is 2 minutes old",
];

/** The ledger header: cell 1 (the beacon) is self-describing and stays empty. */
export const BOARD_GRID_COLUMNS: readonly string[] = [
  "",
  "ticket",
  "lane",
  "now",
  "phases",
  "where",
  "time",
  "cost",
  "tokens",
  "pr",
  "runs",
];

export const BOARD_GRID_EMPTY = "No runs banked yet. Start one to write the first.";

export const BOARD_GRID_NO_MATCH = "No ticket matches the active filter.";
