import "./UsageChip.css";

// `<UsageChip/>`: the always-visible fused usage chip — one row per subscription gauge
// (short name, percent, mini bar, countdown to the reset) and a caret. Before a read has
// landed it is a loading placeholder, and with no usable read an unavailable dash. It
// never waits on anything: the view carries the tone and the countdown text, `open`
// marks the chip, and a click is reported through `onToggle`.

/** One gauge row: the `short` name, `pct` spent, its `tone` and the `countdown` to the reset. */
export interface GaugeView {
  readonly key: string;
  readonly short: string;
  /** How much of the allowance is spent, 0–100: the percent and the mini bar. */
  readonly pct: number;
  readonly tone: "ok" | "warn" | "bad";
  /** Time to the reset; empty when the gauge reports none. */
  readonly countdown: string;
}

export type UsageChipView =
  /** No read has landed yet: the chip still mounts, as a placeholder. */
  | { readonly kind: "loading" }
  /** The read failed, or reported nothing usable. */
  | { readonly kind: "unavailable" }
  | { readonly kind: "gauges"; readonly gauges: readonly GaugeView[] };

export interface UsageChipProps {
  readonly view: UsageChipView;
  readonly open: boolean;
  /** The chip's name, shown while loading or unavailable. */
  readonly label: string;
  readonly onToggle: () => void;
}

function GaugeRow({ gauge }: { readonly gauge: GaugeView }) {
  return (
    <span class={`up-fr ${gauge.tone}`}>
      <i>{gauge.short}</i>
      <b>{gauge.pct}%</b>
      <span class="up-mini">
        <span style={`width:${gauge.pct}%`} />
      </span>
      <em class="up-cd">{gauge.countdown}</em>
    </span>
  );
}

export function UsageChip({ view, open, label, onToggle }: UsageChipProps) {
  if (view.kind === "loading") {
    return (
      <button
        type="button"
        class={`up-fused up-loading up-fused-loading${open ? " up-on up-fused-on" : ""}`}
        onClick={onToggle}
      >
        <i>{label}</i>
        <b>…</b>
      </button>
    );
  }

  if (view.kind === "unavailable") {
    return (
      <button type="button" class="up-fused" onClick={onToggle}>
        <i>{label}</i>
        <b>—</b>
      </button>
    );
  }

  return (
    <button type="button" class={`up-fused${open ? " up-on up-fused-on" : ""}`} onClick={onToggle}>
      {view.gauges.map((g) => (
        <GaugeRow key={g.key} gauge={g} />
      ))}
      <i class="up-car">▾</i>
    </button>
  );
}
