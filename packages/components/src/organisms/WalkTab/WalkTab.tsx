import "./WalkTab.css";

// `<WalkTab/>`: what is left before the PR — the lane line, a segmented progress bar and the
// lane's full node graph merged with the run's nodes. A live row draws `…`. The words arrive as
// `labels`.

export interface WalkRowView {
  readonly node: string;
  readonly state: "done" | "now" | "next";
  readonly tone: "ok" | "bad" | "warn" | "live" | "faint";
  readonly runs: number;
  readonly purpose: string;
  /** In the lane's graph, as opposed to a node the run ran beyond it. */
  readonly listed: boolean;
  readonly ms?: number;
  /** `…` for the live row, else the duration, else empty; ready to render. */
  readonly msText: string;
}

export interface WalkTabView {
  readonly lane: "chore" | "feat" | "bug";
  readonly blurb: string;
  readonly done: number;
  readonly total: number;
  readonly hue: number;
  readonly rows: readonly WalkRowView[];
}

/** The words of the tab that its view does not carry. */
export interface WalkTabLabels {
  /** After `done/total`: `12/25` _nodes_. */
  readonly nodes: string;
  readonly noGraph: string;
}

export interface WalkTabProps {
  /** `undefined` when the run has no node graph. */
  readonly view: WalkTabView | undefined;
  readonly labels: WalkTabLabels;
  /** The rail passes "rail": the root and sections render their rail variant. */
  readonly density?: "rail" | undefined;
}

export function WalkTab({ view, labels, density }: WalkTabProps) {
  const root = density === "rail" ? "walktab wk-rail" : "walktab";
  if (view === undefined) {
    return (
      <div class={root}>
        <p class="wk-none">{labels.noGraph}</p>
      </div>
    );
  }
  return (
    <div class={root}>
      <div class="wk-lane" style={`--hue:${view.hue}`}>
        <span class="wk-laneName">{view.lane.toUpperCase()}</span>
        <span class="faint">{view.blurb}</span>
        <span class="wk-count">
          {view.done}/{view.total} {labels.nodes}
        </span>
      </div>
      <div class="wk-bar">
        {view.rows
          .filter((r) => r.listed)
          .map((r) => (
            <i
              key={r.node}
              class={r.tone === "faint" ? "seg faint wk-faint" : `seg ${r.tone}`}
              title={r.node}
            />
          ))}
      </div>
      <div class="wk-rows">
        {view.rows.map((r) => (
          <div key={r.node} class={`wk-row ${r.state}`}>
            <span class={`wk-dot ${r.tone}${r.state === "next" ? " hollow" : ""}`}>●</span>
            <span class="wk-node">{r.node}</span>
            <span class="wk-runs faint">{r.runs >= 2 ? `↻${r.runs}` : ""}</span>
            <span class="wk-purpose faint">{r.purpose}</span>
            <span class="wk-ms faint">{r.msText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
