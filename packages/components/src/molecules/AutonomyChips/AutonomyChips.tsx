import "./AutonomyChips.css";

// `<AutonomyChips/>`: one read-only chip per target in the board header — the
// level the autonomy dial would pick, labelled `shadow` because nothing acts on
// it. A `<span>`, never a button or link: a status, not a control. A target
// without an ODD has no entry, so no chip. The word `shadow` arrives as `label`.

/** The autonomy dial's levels, from a human in the loop to none. */
export type AutonomyLevel = "HITL" | "HOTL" | "HOOTL";

/** What the dial would pick for one target, and why. */
export interface AutonomyChip {
  readonly level: AutonomyLevel;
  readonly reason: string;
}

export interface AutonomyChipsProps {
  /** One chip per key, in key order; `undefined` or `{}` renders nothing. */
  readonly autonomy: Readonly<Record<string, AutonomyChip>> | undefined;
  /** The word between the target and the level, e.g. `shadow`. */
  readonly label: string;
}

export function AutonomyChips({ autonomy, label }: AutonomyChipsProps) {
  const targets = Object.keys(autonomy ?? {}).sort();
  return (
    <>
      {targets.map((target) => {
        const chip = autonomy?.[target];
        return chip === undefined ? null : (
          <span
            key={target}
            class="autonomy-chip"
            title={`${target} · ${label} — ${chip.level}: ${chip.reason}`}
          >
            {`${target} ${label} ${chip.level}`}
          </span>
        );
      })}
    </>
  );
}
