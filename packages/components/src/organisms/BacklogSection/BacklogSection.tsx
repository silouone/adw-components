import "./BacklogSection.css";

// `<BacklogSection/>`: one state-major section. The collapse flag is a prop and the toggle a
// callback: the owner keeps it keyed by section, so the root's j/k walk skips a collapsed
// section's rows and it survives a view-model update. Every section defaults OPEN. The one-line
// notes under the heads arrive as `notes`, keyed by section key.

import { BacklogRow, type BacklogRowData, type BacklogRowProps } from "../BacklogRow/BacklogRow";

export interface BacklogSectionProps {
  /** A state key (`ready`, `blocked`, …) or a by-wave group, `wave-<n>`. */
  readonly sectionKey: string;
  /** Shown in place of the key — the by-wave groups' line. */
  readonly heading?: string | undefined;
  /** The note under the head, by section key; a key without one shows none. */
  readonly notes: Readonly<Record<string, string>>;
  readonly rows: readonly BacklogRowData[];
  readonly token: string;
  readonly collapsed: boolean;
  /** Toggles this section's collapse; the owner knows the key. */
  readonly onCollapse: () => void;
  /** Per-row extras the root owns (view, labels, hue, cursor, selection, callbacks). */
  readonly rowProps: (row: BacklogRowData) => Omit<BacklogRowProps, "row" | "token">;
}

export function BacklogSection({
  sectionKey,
  heading,
  notes,
  rows,
  token,
  collapsed,
  onCollapse,
  rowProps,
}: BacklogSectionProps) {
  const note = notes[sectionKey];

  return (
    <details class="grp grp-tight bl-section" open={!collapsed}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is a native, keyboard-operable disclosure control, fully controlled here. */}
      <summary
        class="grp-hd bl-section-head"
        onClick={(e) => {
          e.preventDefault();
          onCollapse();
        }}
      >
        <i class="caret">▸</i>
        <b class={`s-${sectionKey}`}>{heading ?? sectionKey}</b>
        <span class="grp-n bl-section-count">{rows.length}</span>
        {note !== undefined && <span class="bl-section-note">{note}</span>}
      </summary>
      <div class="bl-section-body">
        {rows.map((row) => (
          <BacklogRow key={row.id} row={row} token={token} {...rowProps(row)} />
        ))}
      </div>
    </details>
  );
}
