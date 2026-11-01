import "./HoverCard.css";

// `<HoverCard/>`: the one detail card every timeline view shares. Takes `hovered` (written by
// the run container from any step in any view), the viewport box and the page zoom; renders
// nothing when the pointer is over no step. Pointer-transparent and fixed-positioned, so it
// never steals the click that opens the Dock.
//
// Pure: view models in, markup out. The step figures arrive in `faces`, the words as `labels`.
// The step view-model types shared by `Journey`, `Ledger` and `Lanes` are declared here.

import { RigTag, type RigView } from "../../molecules/Rig/Rig";

const MAX_FAILS = 6;
const CARD_W = 380;
const CARD_H = 320;

/** One gate of a gate step, as the journal reports it. */
export interface GateView {
  readonly name: string;
  readonly outcome: "pass" | "fail";
  readonly skipped?: boolean;
  readonly reason?: string;
  readonly preExisting?: boolean;
  readonly failingTests?: readonly string[];
  /** The failing tests this run introduced; the others were red before it. */
  readonly introducedFailingTests?: readonly string[];
}

/** The part of a timeline block the step views read. */
export interface BlockView {
  readonly node: string;
  readonly start: number;
  readonly end?: number;
  readonly inProgress: boolean;
  readonly round?: { readonly round: number; readonly of: number };
  readonly reason?: string;
  readonly watchdog?: { readonly reason: string };
  readonly capture?: { readonly status: string; readonly dots: readonly unknown[] };
  readonly gates?: readonly GateView[];
  /** The gate host a slot wait is queued on. */
  readonly queuedOn?: string;
}

/** One block and the lane (role) it was filed into. */
export interface StepMember {
  readonly role: string;
  readonly block: BlockView;
}

/** A member and the rail key of the drawn box that holds it. */
export interface RunStepView extends StepMember {
  readonly railKey: string;
}

export type StepOutcome = "ok" | "bad" | "warn" | "live";

export interface GateFace {
  readonly gate: GateView;
  readonly suffix: string;
}

/** The figures of one step, already formatted. */
export interface StepFace {
  readonly kind: "agent" | "gate" | "det";
  readonly agent: boolean;
  readonly outcome: StepOutcome;
  readonly glyph: string;
  readonly durMs: number;
  readonly dur: string;
  readonly purpose: string;
  /** `block.reason`, else the node's purpose. */
  readonly why: string;
  readonly phase: string;
  readonly rig: RigView | undefined;
  readonly from: string;
  readonly to: string;
  readonly turns: string;
  readonly tokens: string;
  readonly gates: readonly GateFace[];
}

/** Keyed by `role::node::start`: a pointer resting on a step across a live tick still holds the
 * previous tick's block object. */
export type StepFaces = ReadonlyMap<string, StepFace>;

export const faceKey = ({ role, block }: StepMember): string =>
  `${role}::${block.node}::${block.start}`;

/** What a view reports: the members under the pointer and its viewport px. */
export interface HoverAt {
  readonly members: readonly StepMember[];
  readonly clientX: number;
  readonly clientY: number;
}

/** The one pointer gesture the three step views share: enter and move report where the pointer
 * is, leave reports that it left. */
export function hoverProps(members: readonly StepMember[], onHover: (at: HoverAt | null) => void) {
  const at = (e: MouseEvent) => onHover({ members, clientX: e.clientX, clientY: e.clientY });
  return {
    onMouseEnter: at,
    onMouseMove: at,
    onMouseLeave: () => onHover(null),
  };
}

/** The hover state: one step, or every member of a clustered marker, and the pointer in layout px. */
export interface Hovered {
  readonly members: readonly StepMember[];
  readonly x: number;
  readonly y: number;
}

export interface HoverCardLabels {
  /** Before the round counter: `round 2/3`. */
  readonly round: string;
  readonly turns: string;
  readonly tokens: string;
  readonly toolCalls: string;
  readonly noCapture: string;
  readonly watchdog: string;
  readonly openHint: string;
  /** After the member count of a cluster: `4 quick steps`. */
  readonly quickSteps: string;
  readonly preExisting: string;
  readonly more: string;
  /** What an agent step whose rig was never journaled says. */
  readonly rigNotJournaled: string;
  /** What a deterministic step says in the rig line. */
  readonly rigNone: string;
}

export interface HoverCardProps {
  readonly faces: StepFaces;
  readonly hovered?: Hovered | undefined;
  /** The viewport in viewport px, and the page zoom that turns it into layout px. */
  readonly viewport: { readonly w: number; readonly h: number };
  readonly zoom: number;
  readonly labels: HoverCardLabels;
}

export function HoverCard({ faces, hovered: h, viewport, zoom, labels }: HoverCardProps) {
  if (h === undefined || h.members.length === 0) return null;
  const vw = viewport.w / zoom;
  const vh = viewport.h / zoom;
  const left = Math.max(8, Math.min(h.x + 16, vw - CARD_W - 8));
  const top = h.y + 18 + CARD_H > vh ? Math.max(8, h.y - 18 - CARD_H) : h.y + 18;
  return (
    <div class="hc" style={`left:${left}px;top:${top}px`} role="tooltip">
      {h.members.length === 1 && h.members[0] !== undefined ? (
        <StepDetail member={h.members[0]} faces={faces} labels={labels} />
      ) : (
        <ClusterDetail members={h.members} faces={faces} labels={labels} />
      )}
    </div>
  );
}

function StepDetail({
  member,
  faces,
  labels,
}: {
  readonly member: StepMember;
  readonly faces: StepFaces;
  readonly labels: HoverCardLabels;
}) {
  const { block } = member;
  const face: StepFace | undefined = faces.get(faceKey(member));
  if (face === undefined) return null;
  const { agent } = face;
  return (
    <>
      <div class="hc-head">
        <span class={`mk ${face.outcome}`}>{face.glyph}</span>
        <b>{block.node}</b>
        {block.round !== undefined && (
          <span class="badge round badge-round">
            {labels.round} {block.round.round}/{block.round.of}
          </span>
        )}
        <span class="hc-dur">{face.dur}</span>
      </div>
      {face.purpose !== "" && <div class="hc-purpose">{face.purpose}</div>}
      <div class="hc-meta">
        <span>{face.phase}</span>
        <span>
          {face.from} → {face.to}
        </span>
      </div>
      <div class="hc-rig">
        <RigTag rig={face.rig} none={agent ? labels.rigNotJournaled : labels.rigNone} />
      </div>
      {agent && (
        <div class="hc-kpi">
          <div>
            <b>{face.turns}</b>
            <i>{labels.turns}</i>
          </div>
          <div>
            <b>{face.tokens}</b>
            <i>{labels.tokens}</i>
          </div>
          <ToolCalls block={block} labels={labels} />
        </div>
      )}
      {face.gates.length > 0 && <Gates gates={face.gates} labels={labels} />}
      {block.reason !== undefined && <div class="hc-reason">{block.reason}</div>}
      {block.watchdog !== undefined && (
        <div class="hc-reason">
          {labels.watchdog}: {block.watchdog.reason}
        </div>
      )}
      <div class="hc-foot">{labels.openHint}</div>
    </>
  );
}

function ToolCalls({
  block,
  labels,
}: {
  readonly block: BlockView;
  readonly labels: HoverCardLabels;
}) {
  if (block.capture?.status === "ok") {
    return (
      <div>
        <b>{block.capture.dots.length}</b>
        <i>{labels.toolCalls}</i>
      </div>
    );
  }
  return (
    <div class="hc-nocap">
      <i>{labels.noCapture}</i>
    </div>
  );
}

function Gates({
  gates,
  labels,
}: {
  readonly gates: readonly GateFace[];
  readonly labels: HoverCardLabels;
}) {
  return (
    <div class="hc-gates">
      {gates.map(({ gate: g, suffix }, i) => {
        const fails = g.failingTests ?? [];
        const introduced = g.introducedFailingTests;
        return (
          <div
            key={`${g.name}:${i}`}
            class={`hc-gate ${g.skipped === true ? "skipped" : g.outcome}`}
          >
            <span>
              {g.skipped === true ? "–" : g.outcome === "pass" ? "✓" : "✕"} {g.name}
              {suffix}
              {g.preExisting === true ? ` · ${labels.preExisting}` : ""}
              {g.skipped === true && g.reason !== undefined ? ` · ${g.reason}` : ""}
            </span>
            {fails.length > 0 && (
              <ul class="hc-fails">
                {fails.slice(0, MAX_FAILS).map((t) => (
                  <li key={t}>
                    {t}
                    {introduced !== undefined && !introduced.includes(t)
                      ? ` (${labels.preExisting})`
                      : ""}
                  </li>
                ))}
                {fails.length > MAX_FAILS && (
                  <li class="more">
                    +{fails.length - MAX_FAILS} {labels.more}
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A clustered marker: every member, one line each. */
function ClusterDetail({
  members,
  faces,
  labels,
}: {
  readonly members: readonly StepMember[];
  readonly faces: StepFaces;
  readonly labels: HoverCardLabels;
}) {
  return (
    <>
      <div class="hc-head">
        <b>
          {members.length} {labels.quickSteps}
        </b>
      </div>
      {members.map((member) => {
        const face = faces.get(faceKey(member));
        if (face === undefined) return null;
        return (
          <div class="hc-line" key={`${member.block.node}::${member.block.start}`}>
            <span class={`mk ${face.outcome}`}>{face.glyph}</span>
            <b>{member.block.node}</b>
            <span class="hc-dur">{face.dur}</span>
          </div>
        );
      })}
    </>
  );
}
