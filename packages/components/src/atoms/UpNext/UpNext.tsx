import "./UpNext.css";

// `<UpNext/>`: the "up next" strip. Never a `.nd` block, never sharing its `k-*` kind
// classes, so a pending entry can never visually collide with a real deterministic
// one. Empty input renders nothing.

import { Fragment } from "preact";

/** One node still to run; `not-run` once the chain ended without reaching it. */
export interface UpNextEntry {
  readonly node: string;
  readonly status: "pending" | "not-run";
}

export interface UpNextProps {
  readonly entries: readonly UpNextEntry[];
  /** The strip's lead-in word, e.g. "up next". */
  readonly label: string;
}

export function UpNext({ entries, label }: UpNextProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <div class="un">
      <span class="un-label">{label}</span>
      {entries.map((e, i) => (
        <Fragment key={`${e.node}-${i}`}>
          {i > 0 && <span class="un-sep">→</span>}
          <span class={`un-item${e.status === "not-run" ? " un-gone" : ""}`}>{e.node}</span>
        </Fragment>
      ))}
    </div>
  );
}
