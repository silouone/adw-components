import "./BaseRedChip.css";

// `<BaseRedChip/>`: the status a run wears when it went green over a red base. A pure
// function of the run's `baseRed`; one chip shared by the card and the ledger row. A
// `<span>`, never a button or link: a filled block is a status, not a control.

const SHA_CHARS = 7;

/** The base commit and the gates that were red on it. */
export interface RunBaseRed {
  readonly sha: string;
  readonly gates: readonly { readonly name: string; readonly count: number }[];
}

/** The words of the chip and of its title: `<base> <sha7> <wasRed>: <gate> (<n> <tests>), …` */
export interface BaseRedLabels {
  readonly chip: string;
  readonly base: string;
  readonly wasRed: string;
  readonly tests: string;
}

/** `<base> <sha7> <wasRed>: <gate> (<n> <tests>), …` */
export function baseRedTitle(baseRed: RunBaseRed, labels: BaseRedLabels): string {
  const gates = baseRed.gates.map((g) => `${g.name} (${g.count} ${labels.tests})`).join(", ");
  return `${labels.base} ${baseRed.sha.slice(0, SHA_CHARS)} ${labels.wasRed}: ${gates}`;
}

export function BaseRedChip({
  baseRed,
  labels,
}: {
  readonly baseRed: RunBaseRed | undefined;
  readonly labels: BaseRedLabels;
}) {
  return baseRed === undefined ? null : (
    <span class="base-red-chip" title={baseRedTitle(baseRed, labels)}>
      {labels.chip}
    </span>
  );
}
