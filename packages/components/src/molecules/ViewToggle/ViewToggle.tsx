import "./ViewToggle.css";

// `<ViewToggle/>`: the board's `▦ / ☰` switch. It mirrors the host's `view` through `.on`
// and `aria-pressed` and reports a click through `onView`, even on the active view; the
// host decides what a pick does. The words (`labels`) arrive as props.

export type BoardView = "cards" | "ledger";

const CHOICES: readonly { readonly value: BoardView; readonly glyph: string }[] = [
  { value: "cards", glyph: "▦" },
  { value: "ledger", glyph: "☰" },
];

/** The words of the switch: its group name and the tooltip of each button. */
export interface ViewToggleLabels {
  readonly group: string;
  readonly cards: string;
  readonly ledger: string;
}

export interface ViewToggleProps {
  readonly view: BoardView;
  readonly labels: ViewToggleLabels;
  readonly onView: (kind: BoardView) => void;
}

export function ViewToggle({ view: current, labels, onView }: ViewToggleProps) {
  return (
    <fieldset class="vt" aria-label={labels.group}>
      {CHOICES.map((c) => (
        <button
          key={c.value}
          type="button"
          data-view={c.value}
          class={current === c.value ? "on" : ""}
          aria-pressed={current === c.value}
          title={labels[c.value]}
          onClick={() => onView(c.value)}
        >
          {c.glyph}
        </button>
      ))}
    </fieldset>
  );
}
