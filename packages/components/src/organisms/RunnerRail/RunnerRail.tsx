import "./RunnerRail.css";

// `<RunnerRail/>`: rail 1 closed — a strip with a `◧` toggle, an `all` tile and one tile
// per runner, each with a status dot and a hover popover. Its gestures are callbacks;
// everything it draws arrives as a prop, the words as `labels`.

import type { OnFilter } from "../FiltersPanel/FiltersPanel";

export interface RunnerTile {
  readonly key: string;
  readonly planned: boolean;
  readonly glyph: string;
  /** The status dot's class: `live`, `ok` or `planned`. */
  readonly dot: string;
}

export interface PopoverFacts {
  readonly title: string;
  readonly status: "busy" | "idle" | "not configured";
  readonly kind: string;
  readonly rows: readonly { readonly k: string; readonly v: string }[];
  readonly hint?: string;
}

export interface RunnerPopover {
  readonly glyph: string;
  readonly dot: string;
  readonly facts: PopoverFacts;
}

export interface RunnerRailView {
  readonly tiles: readonly RunnerTile[];
  readonly popover?: RunnerPopover;
}

/** The words of the rail that its view does not carry. */
export interface RunnerRailLabels {
  readonly ariaLabel: string;
  readonly openNetwork: string;
  readonly allRunners: string;
  readonly all: string;
}

export interface RunnerRailProps {
  /** The tiles and the hovered runner's popover. */
  readonly view: RunnerRailView;
  readonly labels: RunnerRailLabels;
  /** The runner filter; `"*"` = every runner. */
  readonly hostFilter: string;
  readonly expandedRunners: ReadonlySet<string>;
  readonly onHoverRunner: (key: string | undefined) => void;
  readonly onFilter: OnFilter;
  readonly onToggleRail: (open: boolean) => void;
  readonly onToggleRunner: (key: string) => void;
}

// it), opens the panel with that runner expanded, and clears the popover. A planned runner
// is inert: a filter that matches nothing is no use.
export function RunnerRail({
  view,
  labels,
  hostFilter,
  expandedRunners,
  onHoverRunner,
  onFilter,
  onToggleRail,
  onToggleRunner,
}: RunnerRailProps) {
  const pick = (h: RunnerTile, active: boolean): void => {
    onHoverRunner(undefined);
    if (h.planned) return;
    onFilter("host", active ? "*" : h.key);
    onToggleRail(true);
    if (!expandedRunners.has(h.key)) onToggleRunner(h.key);
  };
  return (
    <nav class="rail rail1 strip" data-rail="host" aria-label={labels.ariaLabel}>
      <button
        type="button"
        class="toggle"
        title={labels.openNetwork}
        onClick={() => {
          onHoverRunner(undefined);
          onToggleRail(true);
        }}
      >
        ◧
      </button>
      <button
        type="button"
        class={hostFilter === "*" ? "tile on" : "tile"}
        data-runner="*"
        title={labels.allRunners}
        onClick={() => {
          onHoverRunner(undefined);
          onFilter("host", "*");
        }}
      >
        {labels.all}
      </button>
      {view.tiles.map((h) => {
        const classes = ["tile"];
        if (hostFilter === h.key) classes.push("on");
        if (h.planned) classes.push("planned");
        return (
          <button
            key={h.key}
            type="button"
            class={classes.join(" ")}
            data-runner={h.key}
            {...(h.planned ? { "aria-disabled": "true" } : {})}
            onMouseEnter={() => onHoverRunner(h.key)}
            onMouseLeave={() => onHoverRunner(undefined)}
            onClick={() => pick(h, hostFilter === h.key)}
          >
            {h.glyph}
            <i class={`rdot ${h.dot}`} />
          </button>
        );
      })}
      {view.popover !== undefined && <Popover p={view.popover} />}
    </nav>
  );
}

function Popover({ p }: { readonly p: RunnerPopover }) {
  const f = p.facts;
  return (
    <div class="pop" role="tooltip">
      <div class="pop-hd">
        <span class="pop-g">{p.glyph}</span>
        <b>{f.title}</b>
        <i class={`rdot pop-rdot ${p.dot}`} />
        <span class="pop-st">{f.status}</span>
      </div>
      <p class="pop-kind">{f.kind}</p>
      <dl class="pop-kv">
        {f.rows.map((r, i) => (
          <div key={i}>
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
          </div>
        ))}
      </dl>
      {f.hint !== undefined && <p class="pop-hint">{f.hint}</p>}
    </div>
  );
}
