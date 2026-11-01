import "./RouteTab.css";

// `<RouteTab/>`: the focus panel's Route tab — how the run was routed: the resolution chain,
// the gear per stage and what the shadow router would pick. The words arrive as `labels`.

import { TabBlock } from "../RunTab/RunTab";

export interface RouteView {
  readonly resolution: string;
  readonly stages: readonly {
    readonly node: string;
    readonly model: string;
    readonly gear: string;
  }[];
  /** The last row: `repair / review-fix · escalate at round 3 / 2 · G2 → G3`;
   * absent when the plan carries no in-run escalation. */
  readonly escalationRow?: string;
  readonly mode: string;
  readonly wouldPick: string;
  readonly escalation: { readonly text: string; readonly title?: string };
}

/** The words of the tab that its view does not carry. */
export interface RouteTabLabels {
  readonly resolution: string;
  readonly gearPerStage: string;
  readonly shadowRouter: string;
  readonly mode: string;
  readonly wouldPick: string;
  readonly escalation: string;
}

export interface RouteTabProps {
  readonly view: RouteView;
  readonly labels: RouteTabLabels;
  /** The rail passes "rail": the root and rows render their rail variant. */
  readonly density?: "rail" | undefined;
}

export function RouteTab({ view: v, labels, density }: RouteTabProps) {
  const rail = density === "rail";
  const stage = rail ? " routetab-rail" : "";
  return (
    <div class={`routetab${stage}`}>
      <TabBlock density={density} title={labels.resolution}>
        <div class="rs-chain">{v.resolution}</div>
      </TabBlock>
      <TabBlock density={density} title={labels.gearPerStage}>
        {v.stages.length === 0 && <div class="faint">—</div>}
        {v.stages.map((s) => (
          <div key={s.node} class={`rs-stage${stage}`}>
            <span>{s.node}</span>
            <span class="faint">{s.model}</span>
            <span>{s.gear}</span>
          </div>
        ))}
        {v.escalationRow !== undefined && (
          <div class={`rs-stage${stage} rs-round faint`}>{v.escalationRow}</div>
        )}
      </TabBlock>
      <TabBlock density={density} title={labels.shadowRouter}>
        <dl class={rail ? "rt-kv rt-rail" : "rt-kv"}>
          <dt>{labels.mode}</dt>
          <dd class="rs-mode">{v.mode}</dd>
          <dt>{labels.wouldPick}</dt>
          <dd class="rs-pick">{v.wouldPick}</dd>
          <dt>{labels.escalation}</dt>
          <dd class="rs-esc" title={v.escalation.title}>
            {v.escalation.text}
          </dd>
        </dl>
      </TabBlock>
    </div>
  );
}
