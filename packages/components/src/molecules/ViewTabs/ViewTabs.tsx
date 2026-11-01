import "./ViewTabs.css";

// `<ViewTabs/>`: the run header's timeline tablist. It renders the active tab and reports a
// pick; the keys 1/2/3 are bound by the host. Arrow keys are deliberately NOT bound — they
// scroll the zoomed gantt. The words (`label`, each tab's `text` and `hint`) arrive as props.

export type RunViewTab = "gantt" | "ledger" | "journey";

/** One tab: its `value`, the `text` on its button and the `hint` of its tooltip. */
export interface ViewTab {
  readonly value: RunViewTab;
  readonly text: string;
  readonly hint: string;
}

export interface ViewTabsProps {
  readonly active: RunViewTab;
  readonly tabs: readonly ViewTab[];
  /** The accessible name of the tablist. */
  readonly label: string;
  readonly onPick: (tab: RunViewTab) => void;
}

export function ViewTabs({ active, tabs, label, onPick }: ViewTabsProps) {
  return (
    <div class="view-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, i) => {
        const on = active === tab.value;
        return (
          <button
            type="button"
            role="tab"
            key={tab.value}
            data-view={tab.value}
            aria-selected={on ? "true" : "false"}
            class={on ? "on" : ""}
            title={`${tab.hint} (${i + 1})`}
            onClick={() => onPick(tab.value)}
          >
            <span class={`vt-ico vt-${tab.value}`} aria-hidden="true" />
            {tab.text}
            <kbd>{i + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}
