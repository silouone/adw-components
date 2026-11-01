// Hand-written view models for `<BoardChips/>`: its test and its stories read these. The chips
// inside it are the siblings', from their same-named fixture modules.

import type { BoardChipsLabels, BoardChipsView } from "../src/organisms/BoardChips/BoardChips";
import { CHIPS } from "./AutonomyChips";
import { FILTERS_LABELS, FILTERS_OFF, FILTERS_VIEW } from "./FiltersPanel";
import { KPI_PANEL, KPI_PANEL_EMPTY, KPI_PANEL_LABELS } from "./KpiPanel";
import { CHIP_LABELS, CHIP_NONE, CHIP_PARTIAL } from "./SlotsChip";
import { TOGGLE_LABELS } from "./ViewToggle";

export { CHIPS as BOARD_CHIPS_AUTONOMY };
export { FILTERS_OFF as BOARD_CHIPS_FILTERS };

export const BOARD_CHIPS_LABELS: BoardChipsLabels = {
  ticket: "ticket",
  tickets: "tickets",
  run: "run",
  runs: "runs",
  live: "live",
  green: "green",
  blocked: "blocked",
  shadow: "shadow",
  kpi: KPI_PANEL_LABELS,
  slots: CHIP_LABELS,
  filters: FILTERS_LABELS,
  viewToggle: TOGGLE_LABELS,
};

/** Three tickets, three runs: one live, one green, one blocked; a rack of five bays. */
export const BOARD_CHIPS: BoardChipsView = {
  tickets: 3,
  runs: 3,
  live: 1,
  green: 1,
  blocked: 1,
  windowLabel: "7d",
  kpis: KPI_PANEL,
  filters: FILTERS_VIEW,
  slots: CHIP_PARTIAL,
};

/** An empty board still reads: zero of everything, dashes in the panel, no rack. */
export const BOARD_CHIPS_EMPTY: BoardChipsView = {
  tickets: 0,
  runs: 0,
  live: 0,
  green: 0,
  blocked: 0,
  windowLabel: "1d",
  kpis: KPI_PANEL_EMPTY,
  filters: FILTERS_VIEW,
  slots: CHIP_NONE,
};

/** One ticket, one run: the singular. */
export const BOARD_CHIPS_ONE: BoardChipsView = {
  ...BOARD_CHIPS_EMPTY,
  tickets: 1,
  runs: 1,
  green: 1,
};

/** Several tickets, several runs: the plural. */
export const BOARD_CHIPS_SEVERAL: BoardChipsView = {
  ...BOARD_CHIPS_EMPTY,
  tickets: 2,
  runs: 2,
  green: 2,
};

/** The bug lane and the codex provider picked: the filters chip names them. */
export const BOARD_CHIPS_NARROWED: BoardChipsView = {
  ...BOARD_CHIPS,
  tickets: 1,
  filters: { ...FILTERS_VIEW, label: "bug · codex" },
};
