import "./Handles.css";

// `<Handles/>`: the names a run is found by, as rows that copy on click, then the
// commands that act on it. Each row shows the tail of its value (the full value in the
// tooltip) and flashes `copied`. The copy is a callback, the flash is interface state,
// and the words (`labels`) arrive as props.

import { useEffect, useRef, useState } from "preact/hooks";

const COPIED_MS = 1200;

/** One handle: what it is (`key`), the full `value`, and the `shown` tail of it. */
export interface HandleRow {
  readonly key: string;
  readonly value: string;
  readonly shown: string;
  readonly hint?: string;
}

/** One command button: its `label` and the complete `command` it copies. */
export interface HandleCommand {
  readonly label: string;
  readonly command: string;
}

export interface HandlesView {
  readonly rows: readonly HandleRow[];
  readonly commands: readonly HandleCommand[];
}

/** The words of the section: its eyebrow, the copy hint and the flash. */
export interface HandlesLabels {
  readonly title: string;
  readonly hint: string;
  readonly copied: string;
}

export interface HandlesProps {
  readonly view: HandlesView;
  readonly labels: HandlesLabels;
  readonly onCopy: (text: string) => void;
  readonly flashMs?: number;
  /** The rail passes "rail": `rt-rail` on the section, `hd-rail` on its rows. */
  readonly density?: "rail" | undefined;
}

export function Handles({ view, labels, onCopy, flashMs = COPIED_MS, density }: HandlesProps) {
  const rail = density === "rail" ? " hd-rail" : "";
  const [flash, setFlash] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copied = (id: string, text: string): void => {
    onCopy(text);
    setFlash(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(undefined), flashMs);
  };

  return (
    <section class={density === "rail" ? "rt-sec rt-rail" : "rt-sec"}>
      <div class="eyebrow">
        <span>{labels.title}</span>
        <span class="faint">{labels.hint}</span>
      </div>
      {view.rows.map((r) => (
        <button
          key={r.key}
          type="button"
          class={`hd-row${rail}`}
          data-handle={r.key}
          title={r.value}
          onClick={() => copied(`row:${r.key}`, r.value)}
        >
          <span class={`hd-key${rail}`}>{r.key}</span>
          <span class="hd-val">{flash === `row:${r.key}` ? labels.copied : r.shown}</span>
          {r.hint !== undefined && <span class={`hd-hint${rail}`}>{r.hint}</span>}
        </button>
      ))}
      <div class={`hd-cmds${rail}`}>
        {view.commands.map((c) => (
          <button
            key={c.label}
            type="button"
            class={`hd-cmd${rail}`}
            data-cmd={c.label}
            title={c.command}
            onClick={() => copied(`cmd:${c.label}`, c.command)}
          >
            {flash === `cmd:${c.label}` ? labels.copied : c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
