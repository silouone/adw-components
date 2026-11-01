import "./PhaseLegend.css";

// `<PhaseLegend/>`: the board's one key to the phase strip. A swatch per phase in run
// order, using the same `.ph-*` colours as the strip and the run page's journey, then
// the two marks that are not phases. Pure: the phase names and words in, markup out.

/** The words for the two non-phase marks and the strip's hint. */
export interface PhaseLegendLabels {
  readonly waiting: string;
  readonly blocked: string;
  readonly hint: string;
}

export interface PhaseLegendProps {
  readonly phases: readonly string[];
  readonly labels: PhaseLegendLabels;
}

export function PhaseLegend({ phases, labels }: PhaseLegendProps) {
  const SHOWN = phases.filter((p) => p !== "other");
  return (
    <div class="ph-legend">
      {SHOWN.map((p) => (
        <span key={p} class="pl-item">
          <i class={`pl-sw ph-${p}`} />
          {p}
        </span>
      ))}
      <span class="pl-item sep">
        <i class="pl-sw wait" />
        {labels.waiting}
      </span>
      <span class="pl-item">
        <i class="pl-sw blocked" />
        {labels.blocked}
      </span>
      <span class="pl-hint">{labels.hint}</span>
    </div>
  );
}
