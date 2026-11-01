import "./FiltersPanel.css";

// `<FiltersPanel/>` and `<FiltersChip/>`: the board's whole filter surface, behind the
// top bar's `filters` chip. The panel is a label/chips grid — project, health, lane, built
// by, isolation, window and a ticket-id search. It writes nothing: every gesture calls
// `onChange(name, value)` and the page is the one writer of the filter values; every other
// component reads them as a prop.
//
// Its `FiltersPanelView` holds the counts recomputed against the active filter: project
// chips and `all` stay UNFILTERED (every card), the health and scope chips count over the
// visible cards. The window row is `RangeChips`, fed by the view's `range`. The words the
// view does not carry arrive as `labels`.

import type { ComponentChildren } from "preact";
import { Dropdown, type DropdownChange } from "../../molecules/Dropdown/Dropdown";
import { RangeChips, type RangeBar, type RangeWindow } from "../../molecules/RangeChips/RangeChips";

export type HealthKey = "green" | "blocked" | "unfinished";
export type IsolationKind = "worktree" | "container" | "remote";

/** The window row: chips, histogram and the line after it, already worded. */
export interface FiltersRangeView {
  readonly windows: readonly RangeWindow[];
  readonly bars: readonly RangeBar[];
  readonly label: string;
}

export interface FiltersPanelView {
  /** The chip's text: `filters all` or the active filters joined. */
  readonly label: string;
  readonly totalTickets: number;
  readonly projects: readonly {
    readonly key: string;
    readonly label: string;
    readonly legacy: boolean;
    readonly count: number;
  }[];
  readonly tally: {
    readonly green: number;
    readonly blocked: number;
    readonly unfinished: number;
    readonly live: number;
  };
  readonly lanes: readonly {
    readonly key: "feat" | "bug" | "chore";
    readonly count: number;
  }[];
  readonly providers: readonly {
    readonly key: "claude" | "codex";
    readonly count: number;
  }[];
  readonly isolations: readonly {
    readonly key: IsolationKind;
    readonly count: number;
  }[];
  readonly hosts: readonly {
    readonly key: string;
    readonly label: string;
    readonly count: number;
  }[];
  /** The host filter value that means "any runner". */
  readonly anyHost: string;
  readonly range: FiltersRangeView;
}

/** The words of the panel that its view does not carry. */
export interface FiltersPanelLabels {
  readonly rows: {
    readonly project: string;
    readonly health: string;
    readonly lane: string;
    readonly builtBy: string;
    readonly isolation: string;
    readonly gateHost: string;
    readonly window: string;
    readonly search: string;
  };
  readonly all: string;
  readonly green: string;
  readonly blocked: string;
  readonly unfinished: string;
  readonly live: string;
  readonly searchPlaceholder: string;
  readonly searchLabel: string;
}

/** Adds `item` to `list`, or removes it when it is already there. */
const toggled = <T,>(list: readonly T[], item: T): readonly T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** The filter values the panel shows, one record. */
export interface BoardFilters {
  readonly proj: string;
  readonly health: Readonly<Record<HealthKey, boolean>>;
  readonly liveOnly: boolean;
  readonly host: string;
  readonly lanes: readonly ("feat" | "bug" | "chore")[];
  readonly providers: readonly ("claude" | "codex")[];
  readonly isolations: readonly IsolationKind[];
  readonly q: string;
  /** The active window chip's value. */
  readonly days: string;
}
export type FilterName = Exclude<keyof BoardFilters, "days">;
export type OnFilter = <K extends FilterName>(name: K, value: BoardFilters[K]) => void;

export interface FiltersPanelProps {
  /** The counts and labels recomputed against the active filter. */
  readonly view: FiltersPanelView;
  readonly labels: FiltersPanelLabels;
  readonly filters: BoardFilters;
  readonly onChange: OnFilter;
  readonly onWindow: (days: string, pinned: boolean) => void;
}

export interface FiltersChipProps extends FiltersPanelProps {
  readonly open: boolean;
  readonly pinned: boolean;
  readonly onOpenChange: (change: DropdownChange) => void;
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ComponentChildren;
}) {
  return (
    <div class="fp-row">
      <span class="fp-l">{label}</span>
      <div class="fp-c">{children}</div>
    </div>
  );
}

export function FiltersPanel({ view, labels, filters, onChange, onWindow }: FiltersPanelProps) {
  const { tally, totalTickets, range } = view;
  const CHIP = "chip fp-chip";
  const toggleHealth = (key: HealthKey) => () =>
    onChange("health", { ...filters.health, [key]: !filters.health[key] });
  return (
    <div class="fp">
      <Row label={labels.rows.project}>
        <button
          type="button"
          class={`${CHIP}${filters.proj === "*" ? " on" : ""}`}
          data-proj="*"
          onClick={() => onChange("proj", "*")}
        >
          <i>{labels.all}</i>
          <b>{totalTickets}</b>
        </button>
        {view.projects.map((g) => (
          <button
            type="button"
            key={g.key}
            class={`${CHIP}${g.legacy ? " opt-legacy" : ""}${filters.proj === g.key ? " on" : ""}`}
            data-proj={g.key}
            onClick={() => onChange("proj", g.key)}
          >
            <i>{g.label}</i>
            <b>{g.count}</b>
          </button>
        ))}
      </Row>
      <Row label={labels.rows.health}>
        <button
          type="button"
          class={`${CHIP} ok${filters.health.green ? " on" : ""}`}
          data-health="green"
          onClick={toggleHealth("green")}
        >
          <i>{labels.green}</i>
          <b>{tally.green}</b>
        </button>
        <button
          type="button"
          class={`${CHIP} bad${filters.health.blocked ? " on" : ""}`}
          data-health="blocked"
          onClick={toggleHealth("blocked")}
        >
          <i>{labels.blocked}</i>
          <b>{tally.blocked}</b>
        </button>
        <button
          type="button"
          class={`${CHIP}${filters.health.unfinished ? " on" : ""}`}
          data-health="unfinished"
          onClick={toggleHealth("unfinished")}
        >
          <i>{labels.unfinished}</i>
          <b>{tally.unfinished}</b>
        </button>
        <button
          type="button"
          class={`${CHIP} live${filters.liveOnly ? " on" : ""}`}
          data-live="true"
          onClick={() => onChange("liveOnly", !filters.liveOnly)}
        >
          <i>{labels.live}</i>
          <b>{tally.live}</b>
        </button>
      </Row>
      <Row label={labels.rows.lane}>
        {view.lanes.map(({ key: lane, count }) => (
          <button
            type="button"
            key={lane}
            class={`${CHIP}${filters.lanes.includes(lane) ? " on" : ""}`}
            data-lane={lane}
            onClick={() => onChange("lanes", toggled(filters.lanes, lane))}
          >
            <i>{lane}</i>
            <b>{count}</b>
          </button>
        ))}
      </Row>
      <Row label={labels.rows.builtBy}>
        {view.providers.map(({ key: provider, count }) => (
          <button
            type="button"
            key={provider}
            class={`${CHIP}${filters.providers.includes(provider) ? " on" : ""}`}
            data-provider={provider}
            onClick={() => onChange("providers", toggled(filters.providers, provider))}
          >
            <i>{provider}</i>
            <b>{count}</b>
          </button>
        ))}
      </Row>
      <Row label={labels.rows.isolation}>
        {view.isolations.map(({ key: isolation, count }) => (
          <button
            type="button"
            key={isolation}
            class={`${CHIP}${filters.isolations.includes(isolation) ? " on" : ""}`}
            data-isolation={isolation}
            onClick={() => onChange("isolations", toggled(filters.isolations, isolation))}
          >
            <i>{isolation}</i>
            <b>{count}</b>
          </button>
        ))}
      </Row>
      {view.hosts.length > 0 && (
        <Row label={labels.rows.gateHost}>
          {view.hosts.map((o) => (
            <button
              type="button"
              key={o.key}
              class={`${CHIP} host${filters.host === o.key ? " on" : ""}`}
              data-host={o.key}
              onClick={() => onChange("host", filters.host === o.key ? view.anyHost : o.key)}
            >
              <i>{o.label}</i>
              <b>{o.count}</b>
            </button>
          ))}
        </Row>
      )}
      <Row label={labels.rows.window}>
        <RangeChips
          windows={range.windows}
          days={filters.days}
          bars={range.bars}
          label={range.label}
          onPick={onWindow}
        />
      </Row>
      <Row label={labels.rows.search}>
        <input
          type="search"
          class="fp-q"
          data-q="true"
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchLabel}
          value={filters.q}
          onInput={(e) => onChange("q", e.currentTarget.value)}
        />
      </Row>
    </div>
  );
}

// filters, its panel is `<FiltersPanel/>`.
export function FiltersChip({ open, pinned, onOpenChange, ...panel }: FiltersChipProps) {
  const { view } = panel;
  return (
    <Dropdown
      id="filters"
      open={open}
      pinned={pinned}
      onOpenChange={onOpenChange}
      chip={<b title={view.label}>{view.label}</b>}
    >
      <FiltersPanel {...panel} />
    </Dropdown>
  );
}
