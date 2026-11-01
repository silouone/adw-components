import "./Ledger.css";

// `<Ledger/>`: the run as a list, not a chart — one row per step in execution order, readable
// without hovering. Quick clean deterministic bursts fold; a failed gate prints every failing
// test under its row; the remaining chain trails as ghost rows. A mini bar per row keeps the
// "when" on the run's own span without owning the layout.
//
// Pure: a `LedgerView` and the step faces in, markup out. The words arrive as `labels`.

import { useState } from "preact/hooks";
import type { UpNextEntry } from "../../atoms/UpNext/UpNext";
import { RigTag } from "../../molecules/Rig/Rig";
import {
  faceKey,
  type GateFace,
  type HoverAt,
  hoverProps,
  type RunStepView,
  type StepFaces,
} from "../HoverCard/HoverCard";

export type LedgerRowView =
  | { readonly kind: "step"; readonly step: RunStepView }
  | {
      readonly kind: "fold";
      readonly steps: readonly RunStepView[];
      /** The folded steps' summed duration, formatted. */
      readonly dur: string;
    };

export interface LedgerView {
  readonly rows: readonly LedgerRowView[];
  /** The run's own span, in ms: where the mini bars start and how long they run. */
  readonly span: { readonly lo: number; readonly span: number };
}

export interface LedgerLabels {
  readonly step: string;
  readonly whatResult: string;
  readonly agentThinking: string;
  readonly when: string;
  readonly took: string;
  readonly turnsTokens: string;
  /** After the count of a fold: `4 quick steps`. */
  readonly quickSteps: string;
  /** A chain node the run ended without reaching. */
  readonly skipped: string;
  readonly upNext: string;
  /** Beside a failing test that was already red before the run. */
  readonly preExisting: string;
  readonly rigNotJournaled: string;
}

export interface LedgerProps {
  readonly ledger: LedgerView;
  readonly upNext: readonly UpNextEntry[];
  readonly faces: StepFaces;
  /** The clock an open step's mini bar runs to. */
  readonly now: number;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly labels: LedgerLabels;
}

type Span = LedgerView["span"];

export function Ledger({
  ledger,
  upNext,
  faces,
  now,
  scope,
  onScope,
  onHover,
  labels,
}: LedgerProps) {
  const { rows, span } = ledger;
  // Keyed by the fold's first step — stable across a live re-render.
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) => {
    const next = new Set(open);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpen(next);
  };

  return (
    <div class="lg lg-scroll">
      <div class="lg-row lg-head">
        <span />
        <span>{labels.step}</span>
        <span>{labels.whatResult}</span>
        <span>{labels.agentThinking}</span>
        <span>{labels.when}</span>
        <span class="lg-num">{labels.took}</span>
        <span class="lg-num">{labels.turnsTokens}</span>
      </div>
      {rows.map((row) => {
        if (row.kind === "step") {
          return (
            <StepRow
              key={`${row.step.block.node}::${row.step.block.start}`}
              step={row.step}
              span={span}
              now={now}
              faces={faces}
              scope={scope}
              onScope={onScope}
              onHover={onHover}
              labels={labels}
            />
          );
        }
        const first = row.steps[0];
        if (first === undefined) return null;
        const key = `${first.block.node}::${first.block.start}`;
        const isOpen = open.has(key);
        const last = row.steps[row.steps.length - 1] ?? first;
        return (
          <div key={key} class="lg-group">
            <button
              type="button"
              class="lg-row fold"
              onClick={() => toggle(key)}
              aria-expanded={isOpen ? "true" : "false"}
            >
              <span class="mk ok">✓</span>
              <span class="lg-name">
                {isOpen ? "▾" : "▸"} {row.steps.length} {labels.quickSteps}
              </span>
              <span class="lg-what">{row.steps.map((s) => s.block.node).join(" · ")}</span>
              <span />
              <MiniBar start={first.block.start} end={last.block.end ?? now} span={span} cls="ok" />
              <span class="lg-num">{row.dur}</span>
              <span />
            </button>
            {isOpen &&
              row.steps.map((s) => (
                <StepRow
                  key={`${s.block.node}::${s.block.start}`}
                  step={s}
                  span={span}
                  now={now}
                  faces={faces}
                  scope={scope}
                  onScope={onScope}
                  onHover={onHover}
                  labels={labels}
                  sub
                />
              ))}
          </div>
        );
      })}
      {upNext.map((u) => (
        <div key={u.node} class="lg-row ghost">
          <span class="mk">○</span>
          <span class="lg-name">{u.node}</span>
          <span class="lg-what">{u.status === "not-run" ? labels.skipped : labels.upNext}</span>
          <span />
          <span class="lg-mini" />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function MiniBar({
  start,
  end,
  span,
  cls,
}: {
  readonly start: number;
  readonly end: number;
  readonly span: Span;
  readonly cls: string;
}) {
  const left = ((start - span.lo) / span.span) * 100;
  const width = ((end - start) / span.span) * 100;
  return (
    <span class="lg-mini">
      <i class={cls} style={`left:${left.toFixed(2)}%;width:max(2px,${width.toFixed(2)}%)`} />
    </span>
  );
}

function gateChip({ gate: g, suffix: scoped }: GateFace): {
  readonly cls: string;
  readonly text: string;
} {
  if (g.skipped === true) return { cls: "skipped", text: `– ${g.name}` };
  if (g.outcome === "pass") {
    return { cls: "ok", text: `✓ ${g.name}${scoped}` };
  }
  const n = g.failingTests?.length;
  return {
    cls: "bad",
    text: `✕ ${g.name}${scoped}${n !== undefined ? ` · ${n}` : ""}`,
  };
}

function StepRow({
  step,
  span,
  now,
  faces,
  scope,
  onScope,
  onHover,
  labels,
  sub = false,
}: {
  readonly step: RunStepView;
  readonly span: Span;
  readonly now: number;
  readonly faces: StepFaces;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly labels: LedgerLabels;
  readonly sub?: boolean;
}) {
  const { block, railKey } = step;
  const face = faces.get(faceKey(step));
  if (face === undefined) return null;
  const { outcome: cls, agent } = face;
  const selected = scope === railKey;
  const failing = (block.gates ?? []).filter((g) => (g.failingTests?.length ?? 0) > 0);
  return (
    <>
      <button
        type="button"
        class={`lg-row ${cls}${sub ? " sub" : ""}${selected ? " sel" : ""}`}
        data-rail={railKey}
        onClick={() => {
          onScope(railKey);
        }}
        {...hoverProps([step], onHover)}
      >
        <span class={`mk ${cls}`}>{face.glyph}</span>
        <span class="lg-name">
          {block.node}
          {block.round !== undefined && (
            <span class="badge round badge-round">↻{block.round.round}</span>
          )}
        </span>
        <span class="lg-what">
          {block.gates !== undefined && block.gates.length > 0 ? (
            <span class="lg-gates">
              {face.gates.map((gf, i) => {
                const chip = gateChip(gf);
                return (
                  <span key={`${gf.gate.name}:${i}`} class={`chip lg-chip ${chip.cls}`}>
                    {chip.text}
                  </span>
                );
              })}
            </span>
          ) : (
            face.why
          )}
        </span>
        <span class="lg-rig">
          {agent && <RigTag rig={face.rig} none={labels.rigNotJournaled} compact />}
        </span>
        <MiniBar start={block.start} end={block.end ?? now} span={span} cls={cls} />
        <span class="lg-num">{face.dur}</span>
        <span class="lg-num lg-dim">{agent ? `${face.turns} · ${face.tokens}` : ""}</span>
      </button>
      {failing.map((g, i) => (
        <div key={`${g.name}:${i}`} class="lg-fail">
          {(g.failingTests ?? []).map((t) => (
            <div key={t}>
              <span class="bad">✕</span> {t}
              {g.introducedFailingTests !== undefined && !g.introducedFailingTests.includes(t) ? (
                <i> {labels.preExisting}</i>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
