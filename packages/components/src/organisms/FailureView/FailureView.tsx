import "./FailureView.css";

// `<FailureView/>`: a blocked run's failure as a triage view — a summary column (headline,
// node/gate/exit/at, the recipe's last line) beside a code / stack / output tab row.
//
// Pure: a `FailurePaneView` in, markup out. Every output line arrives already split into
// coloured spans, so no escape byte reaches a text node. The words arrive in the view.

import { useState } from "preact/hooks";

export type FailureTab = "code" | "stack" | "output";

/** One `key value` line of the summary column; the `gate` row carries the gate class. */
export interface SummaryRow {
  readonly key: string;
  readonly value: string;
}

/** One source line of the code tab. A `caret` row has no number. */
export interface CodeRow {
  readonly kind: "ctx" | "hit" | "caret";
  readonly num?: number;
  readonly text: string;
}

export interface StackFrame {
  readonly fn?: string;
  readonly path: string;
  readonly line: number;
  readonly col: number;
  /** A frame inside a dependency: drawn dimmed. */
  readonly lib: boolean;
}

export type AnsiColor = "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "dim";

/** A run of one output line; `color` is absent for plain text. */
export interface AnsiSpan {
  readonly text: string;
  readonly color?: AnsiColor;
}

export interface FailurePaneView {
  readonly headline: string;
  readonly last?: string;
  readonly summary: readonly SummaryRow[];
  readonly tabs: readonly FailureTab[];
  readonly code: readonly CodeRow[];
  readonly frames: readonly StackFrame[];
  readonly output: readonly (readonly AnsiSpan[])[];
}

export interface FailureViewProps {
  readonly view: FailurePaneView;
}

function CodeTab({ view }: { readonly view: FailurePaneView }) {
  return (
    <pre class="fv-code">
      {view.code.map((row, i) => (
        <div key={i} class={`fv-ln fv-${row.kind}`}>
          <i>{row.num ?? ""}</i>
          <span>{row.text}</span>
        </div>
      ))}
    </pre>
  );
}

function StackTab({ view }: { readonly view: FailurePaneView }) {
  return (
    <div class="fv-stack">
      {view.frames.map((fr, i) => (
        <div key={i} class={`fv-fr ${fr.lib ? "fv-lib" : "fv-own"}`}>
          {fr.fn !== undefined && <span class="fv-fn">{fr.fn}</span>} {fr.path}:{fr.line}:{fr.col}
        </div>
      ))}
    </div>
  );
}

function OutputTab({ view }: { readonly view: FailurePaneView }) {
  return (
    <pre class="fv-out">
      {view.output.map((line, i) => (
        <div key={i} class="fv-ln">
          <i>{i + 1}</i>
          <span>
            {line.map((s, j) => (
              <span key={j} class={s.color ? `ans-${s.color} fv-ans-${s.color}` : undefined}>
                {s.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </pre>
  );
}

export function FailureView({ view }: FailureViewProps) {
  const tabs = view.tabs;
  const [picked, setPicked] = useState<FailureTab>();
  const selected = picked !== undefined && tabs.includes(picked) ? picked : tabs[0];

  return (
    <div class="fv">
      <div class="fv-sum">
        <span class="fv-x">✕</span>
        <div class="fv-head">{view.headline}</div>
        <dl class="fv-rows">
          {view.summary.map((r) => (
            <div key={r.key} class="fv-row" data-row={r.key}>
              <dt>{r.key}</dt>
              <dd class={r.key === "gate" ? "fv-gate" : undefined}>{r.value}</dd>
            </div>
          ))}
        </dl>
        {view.last !== undefined && <div class="fv-last">{view.last}</div>}
      </div>
      <div class="fv-main">
        {tabs.length > 0 && (
          <div class="fv-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                class={`fv-tab${t === selected ? " on" : ""}`}
                aria-selected={t === selected}
                data-tab={t}
                onClick={() => setPicked(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {selected === "code" && <CodeTab view={view} />}
        {selected === "stack" && <StackTab view={view} />}
        {selected === "output" && <OutputTab view={view} />}
      </div>
    </div>
  );
}
