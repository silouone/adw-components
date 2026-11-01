import "./FocusRail.css";

// `<FocusRail/>`: rail 2 — a strip of one icon per focus tab, inert and dimmed until a run
// is selected; open, a panel hosting whatever the shell hands it or, without one, only its
// `◨` close. Its tab and toggle gestures are callbacks; the tab list and the words arrive
// as props.

import type { ComponentChildren } from "preact";

export type FocusTab = "run" | "walk" | "gates" | "tools" | "cost" | "route" | "result";

export interface FocusRailTab {
  readonly id: FocusTab;
  readonly glyph: string;
  readonly label: string;
}

/** The words of the rail that its tabs do not carry. */
export interface FocusRailLabels {
  readonly ariaLabel: string;
  readonly openPanel: string;
  readonly close: string;
}

export interface FocusRailProps {
  readonly selected: string | null;
  readonly tab: FocusTab;
  readonly open: boolean;
  readonly tabs: readonly FocusRailTab[];
  readonly labels: FocusRailLabels;
  readonly panel?: ComponentChildren;
  readonly onFocusTab: (tab: FocusTab) => void;
  readonly onFocusOpen: (open: boolean) => void;
}

export function FocusRail({
  selected,
  tab,
  open,
  tabs,
  labels,
  panel,
  onFocusTab,
  onFocusOpen,
}: FocusRailProps) {
  if (open) {
    return (
      <aside class="rail rail2 panel rail-dense" data-rail="focus">
        {panel ?? (
          <button
            type="button"
            class="toggle"
            title={labels.close}
            onClick={() => onFocusOpen(false)}
          >
            ◨
          </button>
        )}
      </aside>
    );
  }
  const inert = selected === null;
  const dim = inert ? " dim" : "";
  return (
    <nav class="rail rail2 strip" data-rail="focus" aria-label={labels.ariaLabel}>
      <button
        type="button"
        class={`toggle${dim}`}
        title={labels.openPanel}
        disabled={inert}
        onClick={() => onFocusOpen(true)}
      >
        ◨
      </button>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          class={`${t.id === tab ? "tile on" : "tile"}${dim}`}
          data-tab={t.id}
          title={t.label}
          disabled={inert}
          onClick={() => {
            onFocusTab(t.id);
            onFocusOpen(true);
          }}
        >
          {t.glyph}
        </button>
      ))}
    </nav>
  );
}
