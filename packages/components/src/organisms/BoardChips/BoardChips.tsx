import "./BoardChips.css";

// `<BoardChips/>`: the board route's context inside the one app header — the KPI chip, the slots
// chip, the autonomy chips, the filters chip and the `▦ / ☰` view toggle; the usage chip stays
// the header's last child. The KPI chip carries the counts, its dropdown the KPI panel.
//
// Controlled: the page owns which dropdown is open (`open`) and which is pinned (`pinned`), by
// id, and hears every gesture through `onDropdown`. The words arrive as `labels`.

import {
  type BoardView,
  ViewToggle,
  type ViewToggleLabels,
} from "../../molecules/ViewToggle/ViewToggle";
import { type AutonomyChip, AutonomyChips } from "../../molecules/AutonomyChips/AutonomyChips";
import { Dropdown, type DropdownChange } from "../../molecules/Dropdown/Dropdown";
import {
  SlotsChip,
  type SlotsChipLabels,
  type SlotsChipView,
} from "../../molecules/SlotsChip/SlotsChip";
import {
  type BoardFilters,
  FiltersChip,
  type FiltersPanelLabels,
  type FiltersPanelView,
  type OnFilter,
} from "../FiltersPanel/FiltersPanel";
import { KpiPanel, type KpiPanelLabels, type KpiPanelView } from "../KpiPanel/KpiPanel";

/** The three dropdowns of the bar, by id. */
export type BoardChipsDropdown = "kpi" | "slots" | "filters";

export interface BoardChipsView {
  readonly tickets: number;
  readonly runs: number;
  readonly live: number;
  readonly green: number;
  readonly blocked: number;
  /** The range chip's key, named under the KPI panel. */
  readonly windowLabel: string;
  readonly kpis: KpiPanelView;
  readonly filters: FiltersPanelView;
  readonly slots: SlotsChipView;
}

/** The words of the bar, then those of each chip's panel. */
export interface BoardChipsLabels {
  readonly ticket: string;
  readonly tickets: string;
  readonly run: string;
  readonly runs: string;
  readonly live: string;
  readonly green: string;
  readonly blocked: string;
  /** The word between an autonomy chip's target and its level, e.g. `shadow`. */
  readonly shadow: string;
  readonly kpi: KpiPanelLabels;
  readonly slots: SlotsChipLabels;
  readonly filters: FiltersPanelLabels;
  readonly viewToggle: ViewToggleLabels;
}

export interface BoardChipsProps {
  readonly view: BoardChipsView;
  readonly labels: BoardChipsLabels;
  /** The wire's autonomy tally, or undefined before the first payload. */
  readonly autonomy: Readonly<Record<string, AutonomyChip>> | undefined;
  readonly filters: BoardFilters;
  readonly boardView: BoardView;
  /** The dropdown whose panel is showing, by hover or pin. */
  readonly open: BoardChipsDropdown | undefined;
  /** The dropdown pinned open, if any. */
  readonly pinned: BoardChipsDropdown | undefined;
  readonly onDropdown: (id: BoardChipsDropdown, change: DropdownChange) => void;
  readonly onFilter: OnFilter;
  readonly onWindow: (days: string, pinned: boolean) => void;
  readonly onView: (kind: BoardView) => void;
  readonly onOpenRun: (ticketId: string) => void;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function BoardChips({
  view: v,
  labels,
  autonomy,
  filters,
  boardView,
  open,
  pinned,
  onDropdown,
  onFilter,
  onWindow,
  onView,
  onOpenRun,
}: BoardChipsProps) {
  const gesture = (id: BoardChipsDropdown) => ({
    open: open === id,
    pinned: pinned === id,
    onOpenChange: (change: DropdownChange) => onDropdown(id, change),
  });
  return (
    <>
      <Dropdown
        id="kpi"
        {...gesture("kpi")}
        chip={
          <span class="kpi-face" data-chip="kpi">
            <span>{plural(v.tickets, labels.ticket, labels.tickets)}</span>
            <span>{plural(v.runs, labels.run, labels.runs)}</span>
            <span class="live">
              ● {v.live} {labels.live}
            </span>
            <span class="ok">
              {v.green} {labels.green}
            </span>
            <span class="bad">
              {v.blocked} {labels.blocked}
            </span>
          </span>
        }
      >
        <KpiPanel view={v.kpis} labels={labels.kpi} />
      </Dropdown>
      <SlotsChip view={v.slots} labels={labels.slots} {...gesture("slots")} onOpenRun={onOpenRun} />
      <AutonomyChips autonomy={autonomy} label={labels.shadow} />
      <FiltersChip
        view={v.filters}
        labels={labels.filters}
        filters={filters}
        onChange={onFilter}
        onWindow={onWindow}
        {...gesture("filters")}
      />
      <ViewToggle view={boardView} labels={labels.viewToggle} onView={onView} />
    </>
  );
}
