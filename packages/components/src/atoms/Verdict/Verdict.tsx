import "./Verdict.css";

// `<VerdictEvidence/>`: the evidence behind a blocked run's verdict, one line per
// fact the classifier read — the run header shows it, the board card shows only
// `class · action`.

/** A blocked run's verdict, as the classifier reached it. */
export interface VerdictView {
  readonly class: string;
  readonly suggestedAction: string;
  readonly salvageable: boolean;
  readonly evidence: readonly string[];
}

export interface VerdictEvidenceProps {
  readonly verdict: VerdictView;
  /** The word appended to the cause when the verdict is salvageable. */
  readonly salvageableLabel: string;
}

export function VerdictEvidence({ verdict, salvageableLabel }: VerdictEvidenceProps) {
  return (
    <div class="verdict">
      <span class="cause-word">
        {verdict.class} · {verdict.suggestedAction}
        {verdict.salvageable ? ` · ${salvageableLabel}` : ""}
      </span>
      <ul class="verdict-evidence">
        {verdict.evidence.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
