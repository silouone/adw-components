import "./SlotsPanel.css";

// `<SlotsPanel/>`: the slots dropdown's body, a pure render of the rack — per runner a
// header, one row per bay (holder + gauge, or free + next waiter) and the queue in the
// pool's own order. Rows carry `data-ticket` and report a click through `onOpenRun`;
// the words arrive as `labels` and the texts of the view.

import { SLOT_GLYPH } from "../../glyphs";

export interface SlotBayView {
  readonly index: number;
  /** Set when the bay is free, e.g. `free` or `free · next <head>`. */
  readonly freeText?: string;
  readonly holder?: {
    readonly ticketId: string;
    readonly head: string;
    readonly gate: string;
    /** How much of the timeout is spent, 0–100: the gauge's fill. */
    readonly pct: number;
    readonly tone: "ok" | "warn" | "bad";
    /** The gauge's tooltip, e.g. `of 30 min`. */
    readonly timeoutText: string;
    readonly waitText: string;
  };
}

export interface SlotWaiterView {
  readonly runId: string;
  readonly ticketId: string;
  readonly position: number;
  readonly head: string;
  readonly placeText: string;
  readonly sinceText: string;
  readonly waitText: string;
}

export interface SlotRunnerView {
  readonly key: string;
  readonly kind: "local" | "ssh" | "e2b";
  readonly label: string;
  readonly note: string;
  readonly held: number;
  readonly baysTotal: number;
  readonly queued: number;
  readonly bays: readonly SlotBayView[];
  readonly queue: readonly SlotWaiterView[];
}

export interface SlotsPanelView {
  readonly runners: readonly SlotRunnerView[];
  /** The policy line under the runners. */
  readonly footText: string;
}

/** The words of the panel. */
export interface SlotsPanelLabels {
  /** The eyebrow of a bay, before its index. */
  readonly slot: string;
  readonly held: string;
  readonly queued: string;
  /** Before a waiter's `sinceText`. */
  readonly since: string;
  /** The line shown when no runner is configured. */
  readonly empty: string;
}

export interface SlotsPanelProps {
  readonly view: SlotsPanelView;
  readonly labels: SlotsPanelLabels;
  /** Opens the run of a holder or a waiter. */
  readonly onOpenRun: (ticketId: string) => void;
}

function BayRow({
  bay,
  labels,
  onOpenRun,
}: {
  readonly bay: SlotBayView;
  readonly labels: SlotsPanelLabels;
  readonly onOpenRun: (ticketId: string) => void;
}) {
  const eyebrow = (
    <i class="sl-eb">
      {labels.slot} {bay.index}
    </i>
  );
  const { holder } = bay;
  if (holder === undefined) {
    return (
      <div class="sl-row sl-bay-row">
        {eyebrow}
        <span class="sl-free">{bay.freeText}</span>
      </div>
    );
  }
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the row is a mouse shortcut to the run; the network tree's leaf is the keyboard path
    // biome-ignore lint/a11y/noStaticElementInteractions: the row is a mouse shortcut to the run; the network tree's leaf is the keyboard path
    <div
      class="sl-row sl-bay-row"
      data-ticket={holder.ticketId}
      onClick={() => onOpenRun(holder.ticketId)}
    >
      {eyebrow}
      <b>{holder.head}</b>
      <span class="sl-gate">{holder.gate}</span>
      <span class={`sl-gauge ${holder.tone}`} title={holder.timeoutText}>
        <span class="sl-gtxt">{holder.waitText}</span>
        <span class="sl-track">
          <span class="sl-fill" style={`width:${holder.pct}%`} />
        </span>
      </span>
    </div>
  );
}

function QueueRow({
  waiter,
  labels,
  onOpenRun,
}: {
  readonly waiter: SlotWaiterView;
  readonly labels: SlotsPanelLabels;
  readonly onOpenRun: (ticketId: string) => void;
}) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the row is a mouse shortcut to the run; the network tree's leaf is the keyboard path
    // biome-ignore lint/a11y/noStaticElementInteractions: the row is a mouse shortcut to the run; the network tree's leaf is the keyboard path
    <div
      class="sl-row sl-q-row"
      data-ticket={waiter.ticketId}
      onClick={() => onOpenRun(waiter.ticketId)}
    >
      <span class="sl-pos">{waiter.position}</span>
      <b>{waiter.head}</b>
      <span class="sl-pl">{waiter.placeText}</span>
      <span class="sl-since">
        {labels.since} {waiter.sinceText}
      </span>
      <b class="sl-wait">{waiter.waitText}</b>
    </div>
  );
}

function Runner({
  runner,
  labels,
  onOpenRun,
}: {
  readonly runner: SlotRunnerView;
  readonly labels: SlotsPanelLabels;
  readonly onOpenRun: (ticketId: string) => void;
}) {
  return (
    <section class="sl-runner" data-runner={runner.key}>
      <div class="sl-h">
        <span>{SLOT_GLYPH[runner.kind]}</span>
        <b>{runner.label}</b>
        <span>
          {runner.held}/{runner.baysTotal} {labels.held} · {runner.queued} {labels.queued}
        </span>
        <em class="sl-note">{runner.note}</em>
      </div>
      {runner.bays.map((bay) => (
        <BayRow key={bay.index} bay={bay} labels={labels} onOpenRun={onOpenRun} />
      ))}
      {runner.queue.map((w) => (
        <QueueRow key={w.runId} waiter={w} labels={labels} onOpenRun={onOpenRun} />
      ))}
    </section>
  );
}

export function SlotsPanel({ view, labels, onOpenRun }: SlotsPanelProps) {
  return (
    <div class="sl-panel">
      {view.runners.length === 0 ? (
        <span class="sl-free">{labels.empty}</span>
      ) : (
        view.runners.map((r) => (
          <Runner key={r.key} runner={r} labels={labels} onOpenRun={onOpenRun} />
        ))
      )}
      <div class="sl-foot">{view.footText}</div>
    </div>
  );
}
