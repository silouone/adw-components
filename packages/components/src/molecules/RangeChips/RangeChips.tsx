import "./RangeChips.css";

// `<RangeChips/>`: the time-window chips (`2H … ALL`), the per-day histogram and the
// "since <date> · <in> of <total>" label, as the `window` row of a filters panel.
//
// Pure: the caller hands over the chips, the bars (height already a percentage, lit
// already decided, tooltip already worded) and the label; nothing here reads a clock or
// formats a date. A chip click is the operator's own pick, so `pinned` is always true.

/** One window chip: the value it reports and the word it shows. */
export interface RangeWindow {
  readonly days: string;
  readonly label: string;
}

/** One histogram bar: `height` is a percentage of the tallest bar. */
export interface RangeBar {
  readonly height: number;
  readonly lit: boolean;
  readonly title: string;
}

export interface RangeChipsProps {
  readonly windows: readonly RangeWindow[];
  /** The active window: the one chip that is on. */
  readonly days: string;
  readonly bars: readonly RangeBar[];
  /** The line after the histogram, e.g. `since Oct 29 · 3 of 4`. */
  readonly label: string;
  readonly onPick: (days: string, pinned: boolean) => void;
}

export function RangeChips({ windows, days, bars, label, onPick }: RangeChipsProps) {
  return (
    <div class="range">
      {windows.map((w) => (
        <button
          type="button"
          key={w.days}
          class={`chip fp-chip${days === w.days ? " on" : ""}`}
          data-days={w.days}
          onClick={() => onPick(w.days, true)}
        >
          <i>{w.label}</i>
        </button>
      ))}
      <span class="range-hist">
        {bars.map((bar, i) => (
          <span
            key={i}
            class={`range-bar${bar.lit ? " lit" : ""}`}
            style={`height:${bar.height}%`}
            title={bar.title}
          />
        ))}
      </span>
      <span class="range-label">{label}</span>
    </div>
  );
}
