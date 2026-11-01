import "./Lanes.css";

// `<Lanes/>`: the gridded time axis and one row per lane, its blocks positioned from `layout`
// (the true linear geometry, laid out once by the host and passed down — this component never
// lays anything out itself).
//
// Click-to-select goes through a direct `onClick` on each drawn box, reporting the rail key
// through `onScope`.
//
// Pure: a `TimelineLayout`, a `LanesView` and the step faces in, markup out. The words arrive
// as `labels`; the zoom level is interface state nobody else reads.

import { useState } from "preact/hooks";
import { RigTag, type RigView } from "../../molecules/Rig/Rig";
import {
  type BlockView,
  faceKey,
  type HoverAt,
  hoverProps,
  type StepFace,
  type StepFaces,
  type StepMember,
  type StepOutcome,
} from "../HoverCard/HoverCard";

/** One box drawn on the chart: a single step, or a cluster of quick ones. */
export interface DrawnBox {
  /** The node name for a singleton; `"<first> +N"` for a cluster. */
  readonly label: string;
  /** Worst-of-members: a failed instant node must not hide inside a cluster. */
  readonly outcomeClass: StepOutcome;
  /** `marker` for a box too narrow to carry a name; a cluster is always a marker. */
  readonly render: "box" | "marker";
  /** Percent of the run's own span, 0..100. */
  readonly left: number;
  /** Percent of the run's own span, >= 0; 0 for an instantaneous marker. */
  readonly width: number;
  /** Execution order, 1 or more. */
  readonly members: readonly StepMember[];
}

export interface TimelineTick {
  /** Percent of the track, 0..100. */
  readonly pct: number;
  readonly label: string;
}

export interface TimelineLayout {
  /** Execution order, one entry per drawn box. */
  readonly boxes: readonly DrawnBox[];
  readonly ticks: readonly TimelineTick[];
}

export interface LaneRowView {
  readonly lane: { readonly role: string; readonly blocks: readonly BlockView[] };
  readonly hue: number;
  readonly isWorkspace: boolean;
  /** The lane's name as shown. */
  readonly label: string;
  /** A tooltip on the name, when the role needs a caveat. */
  readonly caveat?: string;
  /** The lane's share of the run's time, 0..100. */
  readonly share: number;
  /** The lane's busy time, formatted. */
  readonly busy: string;
  /** What the lane's steps ran on: one rig, or one per gear or provider the lane mixed. */
  readonly rigs: readonly (RigView | undefined)[];
}

export interface LanesView {
  readonly lanes: readonly LaneRowView[];
  /** The rail key of each drawn box, by the box object of `layout.boxes`. */
  readonly railKeys: ReadonlyMap<DrawnBox, string>;
}

export interface LanesLabels {
  /** The zoom chip that fits the run to the width. */
  readonly fit: string;
  /** The sub-line of the workspace lane. */
  readonly deterministic: string;
  readonly rigNotJournaled: string;
  /** Before the gate host a slot wait is queued on: `queued: host`. */
  readonly queued: string;
}

export interface LanesProps {
  readonly layout: TimelineLayout;
  readonly lanes: LanesView;
  readonly faces: StepFaces;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly labels: LanesLabels;
  /** A dropped stream: the live treatment is stripped (`chart-stale`). */
  readonly stale?: boolean;
  /** On the run route, where the console is a flex column (`chart-docked`). */
  readonly docked?: boolean;
  /** The dock is shut: the chart takes the height left (`chart-grow`). */
  readonly grow?: boolean;
}

type ZoomLevel = "fit" | "2" | "4";
const ZOOM_LEVELS: readonly ZoomLevel[] = ["fit", "2", "4"];
const ZOOM_MULTIPLIER: Record<ZoomLevel, number> = { fit: 1, "2": 2, "4": 4 };

export function Lanes({
  layout,
  lanes,
  faces,
  scope,
  onScope,
  onHover,
  labels,
  stale = false,
  docked = false,
  grow = false,
}: LanesProps) {
  const boxesByRole = new Map<string, DrawnBox[]>();
  for (const box of layout.boxes) {
    const role = box.members[0]?.role;
    if (role === undefined) continue;
    const arr = boxesByRole.get(role) ?? [];
    arr.push(box);
    boxesByRole.set(role, arr);
  }

  const [zoom, setZoom] = useState<ZoomLevel>("fit");

  return (
    <div
      class={`chart${docked ? " chart-docked" : ""}${grow ? " chart-grow" : ""}${stale ? " chart-stale" : ""}`}
    >
      <div class="chart-ids">
        <div class="chart-ids-head">
          <ZoomControl zoom={zoom} onChange={setZoom} labels={labels} />
        </div>
        {lanes.lanes.map((row) => (
          <LaneId key={row.lane.role} row={row} labels={labels} />
        ))}
      </div>
      <div class="chart-scroll">
        <div class="chart-inner" style={`--adw-lanes-scale:${ZOOM_MULTIPLIER[zoom]}`}>
          <div class="axis-row">
            <div class="axis">
              {layout.ticks.map((t, i) => (
                <span key={i} class="ax" style={`left:${t.pct.toFixed(3)}%`}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          <div class="lanes">
            <div class="grid-overlay">
              {layout.ticks.map((t, i) => (
                <i key={i} style={`left:${t.pct.toFixed(3)}%`} />
              ))}
            </div>
            {lanes.lanes.map(({ lane, hue }) => (
              <div key={lane.role} class="ln" style={`--hue:${hue}`}>
                <div class="ln-track">
                  {(boxesByRole.get(lane.role) ?? []).map((box) => {
                    const railKey = lanes.railKeys.get(box) ?? "";
                    return (
                      <DrawnBoxEl
                        key={railKey}
                        box={box}
                        railKey={railKey}
                        faces={faces}
                        scope={scope}
                        onScope={onScope}
                        onHover={onHover}
                        labels={labels}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The `.ln-id` column of a lane, lifted into `.chart-ids` — the id column and its lane's track
 * are siblings in separate subtrees, so the id column owns `--hue` itself. Two lines: role,
 * share and total time, then what the lane's steps ran on — one rig in full, or one compact chip
 * per rig when the lane mixed gears or providers. Never the lane's single last model. */
function LaneId({ row, labels }: { readonly row: LaneRowView; readonly labels: LanesLabels }) {
  const { lane, hue, isWorkspace, share, caveat, rigs, busy } = row;

  return (
    <div class="ln-id" style={`--hue:${hue}`}>
      <div class="ln-l1">
        <span class="ln-name" {...(caveat !== undefined ? { title: caveat } : {})}>
          {isWorkspace ? "⌘" : "◆"} {row.label}
        </span>
        <span class="ln-meter">
          <b>{share.toFixed(0)}%</b>
        </span>
        <span class="ln-busy">
          {lane.blocks.length > 1 ? `×${lane.blocks.length} · ` : ""}
          {busy}
        </span>
      </div>
      <div class="ln-sub">
        {isWorkspace ? (
          labels.deterministic
        ) : rigs.length > 1 ? (
          rigs.map((rig, i) => <RigTag key={i} rig={rig} none={labels.rigNotJournaled} compact />)
        ) : (
          <RigTag rig={rigs[0]} none={labels.rigNotJournaled} />
        )}
      </div>
    </div>
  );
}

/** `fit`/`2×`/`4×`. */
function ZoomControl({
  zoom,
  onChange,
  labels,
}: {
  readonly zoom: ZoomLevel;
  readonly onChange: (z: ZoomLevel) => void;
  readonly labels: LanesLabels;
}) {
  return (
    <div class="zoom-ctl">
      {ZOOM_LEVELS.map((z) => (
        <button
          type="button"
          key={z}
          class={`chip zoom-chip${zoom === z ? " on" : ""}`}
          data-zoom={z}
          onClick={() => onChange(z)}
        >
          {z === "fit" ? labels.fit : `${z}×`}
        </button>
      ))}
    </div>
  );
}

function DrawnBoxEl({
  box,
  railKey,
  faces,
  scope,
  onScope,
  onHover,
  labels,
}: {
  readonly box: DrawnBox;
  readonly railKey: string;
  readonly faces: StepFaces;
  readonly scope: string | undefined;
  readonly onScope: (scope: string) => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly labels: LanesLabels;
}) {
  const isSelected = scope === railKey;
  // Detail lives on the shared hover card, not a native title — two tooltips on one element
  // fight each other.
  const hover = hoverProps(box.members, onHover);

  const onClick = () => {
    onScope(railKey);
  };

  if (box.render === "marker") {
    return (
      <button
        type="button"
        class={`nd-marker ${box.outcomeClass}${isSelected ? " sel" : ""}`}
        style={`left:${box.left.toFixed(3)}%`}
        data-rail={railKey}
        aria-label={box.label}
        onClick={onClick}
        {...hover}
      >
        {/* A live point is the one marker worth a glyph: a zero-width open block must still
            read as running. */}
        {box.outcomeClass === "live" && <span class="mk live nd-mk">◌</span>}
      </button>
    );
  }

  const member = box.members[0];
  if (member === undefined) return null;
  const { block } = member;
  // The face's kind already folds in the lane the block was filed into.
  const face: StepFace | undefined = faces.get(faceKey(member));
  if (face === undefined) return null;

  return (
    <button
      type="button"
      class={`nd k-${face.kind} ${face.outcome}${isSelected ? " sel" : ""}${block.watchdog !== undefined ? " wd" : ""}`}
      style={`left:${box.left.toFixed(3)}%;width:${box.width.toFixed(3)}%`}
      data-rail={railKey}
      onClick={onClick}
      {...hover}
    >
      {block.gates !== undefined && block.gates.length > 0 ? (
        <GateSegments gates={block.gates} />
      ) : (
        <b class="nd-label">
          {face.glyph} {block.node}
        </b>
      )}
      {block.round !== undefined && <span class="nd-round">↻{block.round.round}</span>}

      {block.queuedOn !== undefined && (
        <span class="nd-queued">
          {labels.queued}: {block.queuedOn}
        </span>
      )}
    </button>
  );
}

/** One coloured segment per gate — the gate's names and failing tests are the hover card's job;
 * the bar only says which went red. */
function GateSegments({ gates }: { readonly gates: NonNullable<BlockView["gates"]> }) {
  return (
    <span class="gsegs">
      {gates.map((g, i) => (
        <span key={`${g.name}:${i}`} class={`gseg ${g.skipped === true ? "skipped" : g.outcome}`} />
      ))}
    </span>
  );
}
