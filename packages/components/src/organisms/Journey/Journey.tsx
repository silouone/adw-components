import "./Journey.css";

// `<Journey/>`: phases, not roles — "where is the run now". One proportional bar of where the
// time went (instant steps omitted, a hatched tail for what is left), a station line with loop
// badges, and the selected station's steps below. The selection is interface state, so a live
// re-render keeps it.
//
// Pure: a `JourneyView` and the step faces in, markup out. The words arrive as `labels`.

import { useState } from "preact/hooks";
import type { UpNextEntry } from "../../atoms/UpNext/UpNext";
import { RigTag } from "../../molecules/Rig/Rig";
import {
  faceKey,
  type HoverAt,
  hoverProps,
  type RunStepView,
  type StepFaces,
} from "../HoverCard/HoverCard";

export type StationStatus = "ok" | "warn" | "bad" | "live" | "pending";

export interface JourneyStation {
  readonly phase: string;
  readonly status: StationStatus;
  readonly durationMs: number;
  /** This station's share of the run's summed step time, 0..1. */
  readonly share: number;
  readonly steps: readonly RunStepView[];
  /** Chain nodes still to run in this phase (`status: "pending"` only). */
  readonly pending: readonly string[];
  readonly rounds: number;
}

export interface JourneyView {
  readonly steps: readonly RunStepView[];
  readonly stations: readonly JourneyStation[];
  /** The summed step time, in ms. */
  readonly total: number;
  /** One formatted duration per station, parallel to `stations`. */
  readonly stationDur: readonly string[];
}

export interface JourneyLabels {
  /** After the count of chain nodes still to run: `3 left`. */
  readonly left: string;
  /** After the count of a station's steps: `4 steps`. */
  readonly steps: string;
  /** After the count of pending nodes: `2 to go`. */
  readonly toGo: string;
  readonly upNext: string;
  /** Before the round number: `round 2`. */
  readonly round: string;
  /** After the turn count of an agent step: `5 turns`. */
  readonly turns: string;
  readonly rigNotJournaled: string;
}

export interface JourneyProps {
  readonly journey: JourneyView;
  readonly upNext: readonly UpNextEntry[];
  readonly faces: StepFaces;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  /** A dropped stream: the live ring stops pulsing (`jn-stale`). */
  readonly stale?: boolean;
  readonly labels: JourneyLabels;
}

/** A step shorter than this share of the run gets no bar segment. */
const MIN_SEGMENT_SHARE = 0.002;

const RING: Record<StationStatus, string> = {
  ok: "✓",
  warn: "↻",
  bad: "✕",
  live: "◌",
  pending: "○",
};

function defaultPhase(stations: readonly JourneyStation[]): string | undefined {
  return (
    stations.find((s) => s.steps.some((x) => x.block.inProgress))?.phase ??
    stations.find((s) => s.status === "pending")?.phase ??
    stations[stations.length - 1]?.phase
  );
}

export function Journey({
  journey,
  upNext,
  faces,
  scope,
  onScope,
  onHover,
  stale = false,
  labels,
}: JourneyProps) {
  const { steps, stations, total } = journey;
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const current =
    stations.find((s) => s.phase === picked) ??
    stations.find((s) => s.phase === defaultPhase(stations));
  const left = upNext.filter((u) => u.status === "pending").length;

  return (
    <div class={stale ? "jn jn-stale" : "jn"}>
      <div class="jn-bar">
        {steps.flatMap((s) => {
          const face = faces.get(faceKey(s));
          if (face === undefined || !(total > 0)) return [];
          if (face.durMs / total <= MIN_SEGMENT_SHARE) return [];
          return [
            <button
              type="button"
              key={`${s.block.node}::${s.block.start}`}
              class={`jn-seg ph-${face.phase} ${face.outcome}`}
              data-node={s.block.node}
              style={`flex-grow:${face.durMs}`}
              onClick={() => {
                onScope(s.railKey);
              }}
              {...hoverProps([s], onHover)}
            >
              {face.durMs / total > 0.07 ? s.block.node : ""}
            </button>,
          ];
        })}
        {left > 0 && (
          <span class="jn-left" style={`flex-grow:${Math.max(total * 0.06, 1)}`}>
            {left} {labels.left}
          </span>
        )}
      </div>
      <div class="jn-line">
        {stations.map((st, i) => (
          <div key={st.phase} class="jn-hop">
            {i > 0 && <span class={`jn-rail ${st.status}`} />}
            <button
              type="button"
              class={`jn-st ph-${st.phase} ${st.status}${st.phase === current?.phase ? " sel" : ""}`}
              data-phase={st.phase}
              onClick={() => setPicked(st.phase)}
            >
              <span class="jn-ring">{RING[st.status]}</span>
              {st.rounds > 0 && <span class="jn-loop">↻{st.rounds}</span>}
              <span class="jn-name">{st.phase}</span>
              <span class="jn-dur">{journey.stationDur[i]}</span>
              <span class="jn-pct">
                {st.steps.length > 0 ? `${Math.round(st.share * 100)}%` : ""}
              </span>
            </button>
          </div>
        ))}
      </div>
      {current !== undefined && (
        <div class="jn-detail">
          <div class="jn-dh">
            <span class={`jn-dname ph-${current.phase}`}>{current.phase}</span>
            <span class="jn-dcount">
              {current.steps.length} {labels.steps}
              {current.pending.length > 0 ? ` · ${current.pending.length} ${labels.toGo}` : ""}
            </span>
          </div>
          {current.steps.map((s) => (
            <StepLine
              key={`${s.block.node}::${s.block.start}`}
              step={s}
              faces={faces}
              scope={scope}
              onScope={onScope}
              onHover={onHover}
              labels={labels}
            />
          ))}
          {current.pending.map((node) => (
            <div key={node} class="jn-step ghost">
              <span class="mk">○</span>
              <b>{node}</b>
              <span class="jn-why">{labels.upNext}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepLine({
  step,
  faces,
  scope,
  onScope,
  onHover,
  labels,
}: {
  readonly step: RunStepView;
  readonly faces: StepFaces;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly labels: JourneyLabels;
}) {
  const { block, railKey } = step;
  const face = faces.get(faceKey(step));
  if (face === undefined) return null;
  const { outcome: cls, agent } = face;
  return (
    <button
      type="button"
      class={`jn-step ${cls}${scope === railKey ? " sel" : ""}`}
      data-rail={railKey}
      onClick={() => {
        onScope(railKey);
      }}
      {...hoverProps([step], onHover)}
    >
      <span class={`mk ${cls}`}>{face.glyph}</span>
      <b>{block.node}</b>
      {block.round !== undefined && (
        <span class="badge round badge-round">
          {labels.round} {block.round.round}
        </span>
      )}
      <span class="jn-why">{face.why}</span>
      {face.gates.map(({ gate: g, suffix }, i) => (
        <span
          key={`${g.name}:${i}`}
          class={`chip jn-chip ${g.skipped === true ? "skipped" : g.outcome === "pass" ? "ok" : "bad"}`}
        >
          {g.skipped === true ? "–" : g.outcome === "pass" ? "✓" : "✕"} {g.name}
          {suffix}
          {g.failingTests !== undefined ? ` · ${g.failingTests.length}` : ""}
        </span>
      ))}
      {agent && <RigTag rig={face.rig} none={labels.rigNotJournaled} compact />}
      <span class="jn-t">
        {agent ? `${face.turns} ${labels.turns} · ` : ""}
        {face.dur}
      </span>
    </button>
  );
}
