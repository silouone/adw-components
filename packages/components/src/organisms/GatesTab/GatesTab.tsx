import "./GatesTab.css";

// `<GatesTab/>`: what the gates said — the baseline, every gate pass in the order it ran, the
// live one, the target's declared gates and, for a run blocked on a gate, why. The words
// arrive as `labels`.

import { TabSection } from "../../atoms/TabSection/TabSection";

export interface GatePassRow {
  readonly mark: "✓" | "✕";
  readonly name: string;
  readonly pass?: number;
  readonly skipped?: true;
  readonly host?: string;
  readonly ms?: number;
  /** The pass's duration, ready to render; absent with `ms`. */
  readonly msText?: string;
  readonly failing: readonly string[];
  readonly failingMore: number;
}

export interface GatesView {
  readonly baseline: {
    readonly text: string;
    readonly tone: "ok" | "bad" | "faint";
    readonly sha?: string;
  };
  readonly passes: readonly GatePassRow[];
  readonly live?: {
    readonly node: string;
    readonly gate: string;
    readonly host?: string;
    readonly slot?: number;
    readonly elapsedMs: number;
    /** The live row as the tab prints it: node · gate · host · slot · age. */
    readonly text: string;
  };
  /** `undefined` when the target is not on the wire. */
  readonly targetGates?: readonly { readonly name: string; readonly heavy: boolean }[];
  readonly whyRed?: string;
}

/** The words of the tab that its view does not carry. */
export interface GatesTabLabels {
  readonly baseline: string;
  readonly gatePasses: string;
  readonly targetGates: string;
  readonly whyRed: string;
  /** Before a pass's number: _pass_ `2`. */
  readonly pass: string;
  /** After the count of failing names that are not listed: `+3` _more_. */
  readonly more: string;
  /** After the flag of a gate that takes a slot. */
  readonly heavy: string;
  readonly noTarget: string;
}

export interface GatesTabProps {
  readonly view: GatesView;
  readonly labels: GatesTabLabels;
  /** The rail passes "rail": the root and sections render their rail variant. */
  readonly density?: "rail" | undefined;
}

function Pass({ p, labels }: { readonly p: GatePassRow; readonly labels: GatesTabLabels }) {
  return (
    <div class="gt-pass">
      <div class={`gt-line${p.skipped === true ? " faint" : ""}`}>
        <span class={p.mark === "✓" ? "ok" : "bad"}>{p.mark}</span>
        <span class="gt-name">{p.name}</span>
        {p.pass !== undefined && (
          <span class="faint">
            {labels.pass} {p.pass}
          </span>
        )}
        {p.host !== undefined && <span class="faint">{p.host}</span>}
        {p.msText !== undefined && <span class="faint">{p.msText}</span>}
      </div>
      {p.mark === "✕" && p.failing.length > 0 && (
        <ul class="gt-fail">
          {p.failing.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {p.failingMore > 0 && (
            <li class="faint">
              +{p.failingMore} {labels.more}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function GatesTab({ view: v, labels, density }: GatesTabProps) {
  return (
    <div class={density === "rail" ? "gatestab gt-rail" : "gatestab"}>
      <TabSection density={density} title={labels.baseline}>
        <div class={`gt-base ${v.baseline.tone}`}>
          {v.baseline.text}
          {v.baseline.sha !== undefined && <span class="faint"> {v.baseline.sha}</span>}
        </div>
      </TabSection>
      <TabSection density={density} title={labels.gatePasses} right={`(${v.passes.length})`}>
        {v.passes.map((p, i) => (
          <Pass key={`${p.name}-${i}`} p={p} labels={labels} />
        ))}
        {v.live !== undefined && <div class="gt-live">{v.live.text}</div>}
      </TabSection>
      <TabSection density={density} title={labels.targetGates}>
        {v.targetGates === undefined ? (
          <p class="faint">{labels.noTarget}</p>
        ) : (
          v.targetGates.map((g) => (
            <div key={g.name} class="gt-target">
              <span>{g.name}</span>
              {g.heavy && <span class="faint">⚑ {labels.heavy}</span>}
            </div>
          ))
        )}
      </TabSection>
      {v.whyRed !== undefined && (
        <TabSection density={density} title={labels.whyRed}>
          <div class="gt-why bad">{v.whyRed}</div>
        </TabSection>
      )}
    </div>
  );
}
