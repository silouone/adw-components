import type { ViewTab } from "../src/molecules/ViewTabs/ViewTabs";

// Hand-written view models for `<ViewTabs/>`: its test and its stories read these.

export const TABS_LABEL = "timeline view";

/** The three timeline views, in key order 1, 2, 3. */
export const TABS: readonly ViewTab[] = [
  { value: "gantt", text: "gantt", hint: "rows × time — hover a step for its detail" },
  { value: "ledger", text: "ledger", hint: "every step in order, readable without hovering" },
  { value: "journey", text: "journey", hint: "phases — where the run is now" },
];
