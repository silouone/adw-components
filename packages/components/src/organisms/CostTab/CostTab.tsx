import "./CostTab.css";

// `<CostTab/>`: the focus panel's Cost tab — this run's spend, the agent stages' share of the
// wall clock, and the ticket's total across every attempt and round. No gantt, no
// token-type table. The words arrive as `labels`.

import { TabBlock } from "../RunTab/RunTab";

export interface CostStageRow {
  readonly node: string;
  readonly ms: number;
  /** `ms / wallMs`, unrounded; 0 when the run has no wall clock. */
  readonly share: number;
  readonly tokens?: number;
  /** The stage's duration, ready to render. */
  readonly msText: string;
  /** The stage's tokens as the row shows them; `—` when unknown. */
  readonly tokensText: string;
}

export interface CostAttemptRow {
  readonly kind: string;
  readonly ago: string;
  readonly model: string;
  readonly cost: string;
}

export interface CostView {
  readonly thisRun: {
    readonly usd: string;
    readonly tokens: string;
    readonly turns: string;
    readonly meter: string;
  };
  readonly byStage: {
    readonly rows: readonly CostStageRow[];
    readonly agentShare: number;
  };
  readonly ticket: {
    readonly count: string;
    readonly rows: readonly CostAttemptRow[];
    readonly total: string;
    readonly time: string;
  };
  readonly basis: string;
}

/** The words of the tab that its view does not carry. */
export interface CostTabLabels {
  readonly thisRun: string;
  readonly estCost: string;
  readonly tokens: string;
  readonly turns: string;
  readonly byStage: string;
  /** Before the agent stages' share, in the footer of the stage rows. */
  readonly agent: string;
  readonly ticketSoFar: string;
  readonly ticketTotal: string;
}

export interface CostTabProps {
  readonly view: CostView;
  readonly labels: CostTabLabels;
  /** The rail passes "rail": the root and sections render their rail variant. */
  readonly density?: "rail" | undefined;
}

const Cell = ({
  label,
  value,
  density,
}: {
  label: string;
  value: string;
  density: "rail" | undefined;
}) => (
  <div class={density === "rail" ? "ct-cell ct-rail" : "ct-cell"}>
    <span class="faint">{label}</span>
    <b>{value}</b>
  </div>
);

export function CostTab({ view: v, labels, density }: CostTabProps) {
  const rail = density === "rail" ? " ct-rail" : "";
  return (
    <div class={`costtab${rail}`}>
      <TabBlock density={density} title={labels.thisRun}>
        <div class="ct-cells">
          <Cell density={density} label={labels.estCost} value={v.thisRun.usd} />
          <Cell density={density} label={labels.tokens} value={v.thisRun.tokens} />
          <Cell density={density} label={labels.turns} value={v.thisRun.turns} />
        </div>
        <div class="ct-meter faint">{v.thisRun.meter}</div>
      </TabBlock>
      <TabBlock density={density} title={labels.byStage}>
        {v.byStage.rows.map((r) => (
          <div key={r.node} class={`ct-stage${rail}`}>
            <span>{r.node}</span>
            <span class="faint">{r.msText}</span>
            <span>{Math.round(r.share * 100)}%</span>
            <span class="faint">{r.tokensText}</span>
          </div>
        ))}
        {v.byStage.rows.length > 0 && (
          <div class="ct-agent faint">
            {labels.agent} {Math.round(v.byStage.agentShare * 100)}%
          </div>
        )}
      </TabBlock>
      <TabBlock density={density} title={labels.ticketSoFar}>
        <div class="ct-count faint">{v.ticket.count}</div>
        {v.ticket.rows.map((a, i) => (
          <div key={`${a.kind}-${i}`} class={`ct-attempt${rail}`}>
            <span>{a.kind}</span>
            <span class="faint">{a.ago}</span>
            <span class="faint">{a.model}</span>
            <span>{a.cost}</span>
          </div>
        ))}
        <div class="ct-total">
          <span>{labels.ticketTotal}</span>
          <b>{v.ticket.total}</b>
        </div>
        <div class="ct-time faint">{v.ticket.time}</div>
      </TabBlock>
      <div class="ct-basis faint">{v.basis}</div>
    </div>
  );
}
