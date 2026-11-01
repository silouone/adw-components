import "./RunTab.css";

// `<RunTab/>`: the focus panel's Run tab — where the run stands in line or on a bay, where
// it runs, the handles, the agent box and the attempts. Nothing here repeats the run
// screen: no gantt, no token table, no node durations. The words arrive as `labels`.

import type { ComponentChildren } from "preact";
import { Handles, type HandlesLabels, type HandlesView } from "../../molecules/Handles/Handles";

export interface QueueBay {
  readonly index: number;
  readonly holder?: {
    readonly ticketId: string;
    readonly gate: string;
    readonly ageText: string;
    readonly pct: number;
  };
}

export interface QueueBlock {
  readonly kind: "queue";
  readonly ordinal: string;
  readonly host: string;
  readonly since: string;
  readonly waited: string;
  readonly bays: readonly QueueBay[];
  readonly behind: readonly string[];
}

export interface SlotBlock {
  readonly kind: "slot";
  readonly slot: number;
  readonly host: string;
  readonly gate: string;
  readonly timeout: string;
  readonly pct: number;
}

export interface Where {
  readonly runner: string;
  readonly workspace: string;
  readonly inFlight: string;
  readonly factory: string;
  readonly started: string;
}

export interface AgentBox {
  readonly glyph: string;
  readonly model: string;
  readonly line: string;
}

export interface AttemptRow {
  readonly tone: string;
  readonly kind: "build" | "rebase round" | "ci round" | "feedback round";
  readonly ago: string;
  readonly outcome: string;
  readonly duration: string;
  readonly pr?: { readonly number: number; readonly url: string };
}

export interface RunTabView {
  readonly queue: QueueBlock | SlotBlock | undefined;
  readonly where: Where;
  readonly handles: HandlesView;
  readonly agent: AgentBox;
  readonly attempts: { readonly count: number; readonly rows: readonly AttemptRow[] };
}

/** The words of the tab that its view does not carry. */
export interface RunTabLabels {
  /** The eyebrow of the waiting block. */
  readonly inLine: string;
  /** Between a waiter's ordinal and its host: `3rd` _in line on_ `this mac`. */
  readonly inLineOn: string;
  readonly since: string;
  readonly waited: string;
  readonly free: string;
  readonly behind: string;
  /** The eyebrow of the block of a run that holds a slot. */
  readonly holding: string;
  readonly slot: string;
  /** Between a slot and its host: `slot 1` _on_ `this mac`. */
  readonly on: string;
  readonly where: string;
  readonly runner: string;
  readonly workspace: string;
  readonly inFlight: string;
  readonly factory: string;
  readonly started: string;
  readonly agent: string;
  readonly attempts: string;
  readonly handles: HandlesLabels;
}

export interface RunTabProps {
  readonly view: RunTabView;
  readonly labels: RunTabLabels;
  readonly onCopy: (text: string) => void;
  /** The rail passes "rail": every restyled element renders `rt-rail`. */
  readonly density?: "rail" | undefined;
}

export function TabBlock({
  title,
  right,
  density,
  children,
}: {
  readonly title: string;
  readonly right?: string;
  readonly density?: "rail" | undefined;
  readonly children: ComponentChildren;
}) {
  return (
    <section class={density === "rail" ? "rt-sec rt-rail" : "rt-sec"}>
      <div class="eyebrow">
        <span>{title}</span>
        {right !== undefined && <span class="faint">{right}</span>}
      </div>
      {children}
    </section>
  );
}

const Gauge = ({ pct }: { readonly pct: number }) => (
  <span class="gauge">
    <i style={`width:${Math.round(pct)}%`} />
  </span>
);

function InLine({
  q,
  labels,
  density,
}: {
  readonly q: QueueBlock;
  readonly labels: RunTabLabels;
  readonly density: "rail" | undefined;
}) {
  const rail = density === "rail" ? " rt-rail" : "";
  return (
    <TabBlock title={labels.inLine} density={density}>
      <div class={`rt-line${rail}`}>
        {q.ordinal} {labels.inLineOn} {q.host}
      </div>
      <div class={`rt-line${rail} faint`}>
        {labels.since} {q.since} · {labels.waited} {q.waited}
      </div>
      {q.bays.map((b) => (
        <div key={b.index} class="bay">
          <span class="faint">{b.index}</span>
          {b.holder === undefined ? (
            <span class="faint">{labels.free}</span>
          ) : (
            <>
              <span>{b.holder.ticketId}</span>
              <span class="faint">
                {b.holder.gate} · {b.holder.ageText}
              </span>
              <Gauge pct={b.holder.pct} />
            </>
          )}
        </div>
      ))}
      {q.behind.length > 0 && (
        <div class="rt-behind">
          <span class="faint">{labels.behind}</span>
          {q.behind.map((id) => (
            <span key={id} class="chip rt-chip">
              {id}
            </span>
          ))}
        </div>
      )}
    </TabBlock>
  );
}

function Holding({
  q,
  labels,
  density,
}: {
  readonly q: SlotBlock;
  readonly labels: RunTabLabels;
  readonly density: "rail" | undefined;
}) {
  const rail = density === "rail" ? " rt-rail" : "";
  return (
    <TabBlock title={labels.holding} density={density}>
      <Gauge pct={q.pct} />
      <div class={`rt-line${rail}`}>
        {labels.slot} {q.slot} {labels.on} {q.host} · {q.gate} · {q.timeout}
      </div>
    </TabBlock>
  );
}

export function RunTab({ view, labels, onCopy, density }: RunTabProps) {
  const { queue, where, agent, attempts } = view;
  const rail = density === "rail" ? " rt-rail" : "";
  return (
    <div class={`runtab${rail}`}>
      {queue?.kind === "queue" && <InLine q={queue} labels={labels} density={density} />}
      {queue?.kind === "slot" && <Holding q={queue} labels={labels} density={density} />}
      <TabBlock title={labels.where} density={density}>
        <dl class={`rt-kv${rail}`}>
          <dt>{labels.runner}</dt>
          <dd>{where.runner}</dd>
          <dt>{labels.workspace}</dt>
          <dd>{where.workspace}</dd>
          <dt>{labels.inFlight}</dt>
          <dd>{where.inFlight}</dd>
          <dt>{labels.factory}</dt>
          <dd>{where.factory}</dd>
          <dt>{labels.started}</dt>
          <dd>{where.started}</dd>
        </dl>
      </TabBlock>
      <Handles view={view.handles} labels={labels.handles} onCopy={onCopy} density={density} />
      <TabBlock title={labels.agent} density={density}>
        <div class={`agent-box${rail}`}>
          <span>
            {agent.glyph} {agent.model}
          </span>
          <span class="faint">{agent.line}</span>
        </div>
      </TabBlock>
      <TabBlock title={labels.attempts} right={`(${attempts.count})`} density={density}>
        {attempts.rows.map((a, i) => (
          <div key={`${a.kind}-${i}`} class="attempt">
            <span class={`dot ${a.tone}`}>●</span>
            <span>{a.kind}</span>
            <span class="faint">{a.ago}</span>
            <span class={`out ${a.tone}`}>{a.outcome}</span>
            <span class="faint">{a.duration}</span>
            {a.pr !== undefined && (
              <a class="chip rt-chip" href={a.pr.url} target="_blank" rel="noopener noreferrer">
                #{a.pr.number}
              </a>
            )}
          </div>
        ))}
      </TabBlock>
    </div>
  );
}
