import "./DepGraph.css";

// `<DepGraph/>`: the project's waves as columns, cards positioned from `layout` (computed by the
// caller). A pure function of its props but for the hovered id, which is local state, and the
// caller's query, which lights the matching cards (`view.hits`). Live state: running / blocked /
// held cards, the flow and stalled edges, and the header summary.

import { useState } from "preact/hooks";
import { SECTION_GLYPH, type SectionKey } from "../../glyphs";

// The graph, layout and view types `<DepGraph/>` renders, copied as its own.
// The factory's `graph-layout.ts` output and `depGraphViewOf` result must satisfy them structurally.

export type BacklogState = "running" | "ready" | "waiting" | "in-flight" | "blocked";

export interface BacklogGraphNode {
  readonly id: string;
  /** The id's sequence part minus the project's common id prefix. */
  readonly label: string;
  /** The row title; for an outside node, the dep id. */
  readonly title: string;
  /** The frontmatter status, verbatim. */
  readonly status: string;
  /** Absent for closed, non-ticket and outside nodes. */
  readonly state?: BacklogState;
  readonly closed: boolean;
  /** `!closed`; for an outside node, `!met`. */
  readonly open: boolean;
  /** A dep that is not a row of this project. */
  readonly outside: boolean;
  /** The owning project of an own node; set for a multi-project selection only. */
  readonly project?: string;
  /** The owning target of an outside node living in another store. */
  readonly target?: string;
  readonly kind: "ticket" | "epic" | "manual" | "malformed" | "outside";
  readonly priority?: 1 | 2 | 3;
  /** Epoch ms of the row's last run; running / in-flight nodes only. */
  readonly lastAt?: number;
  /** The row's `run-end.reason`; blocked nodes only. */
  readonly reason?: string;
  readonly wave: number;
  readonly critical: boolean;
  /** The nearest blocked ancestor's label. */
  readonly heldBy?: string;
  /** A closed node with n open deps. */
  readonly openDeps: number;
}

export interface BacklogGraphEdge {
  /** The dep. */
  readonly from: string;
  /** The ticket that needs it. */
  readonly to: string;
  readonly met: boolean;
  readonly critical: boolean;
  /** `from` and `to` belong to different projects; set for a multi-project selection only. */
  readonly cross?: boolean;
}

export interface BacklogGraph {
  readonly nodes: readonly BacklogGraphNode[];
  readonly edges: readonly BacklogGraphEdge[];
  readonly maxWave: number;
  /** Ids, wave-ascending. */
  readonly criticalPath: readonly string[];
}

export interface LayoutNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Set only on a collapsed band's squares. */
  readonly collapsed?: true;
}

export interface LayoutEdge {
  readonly from: string;
  readonly to: string;
  /** An SVG path: `M`, then `C` curves and `L` pass-throughs, absolute. */
  readonly d: string;
}

export interface LayoutColumn {
  readonly wave: number;
  readonly x: number;
}

export interface LaneBand {
  readonly project: string;
  readonly y: number;
  readonly h: number;
}

export interface GraphLayout {
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
  readonly columns: readonly LayoutColumn[];
  readonly width: number;
  readonly height: number;
  /** One band per project; absent when the layout is not laned. */
  readonly lanes?: readonly LaneBand[];
}

export interface GraphLive {
  readonly running: ReadonlySet<string>;
  readonly blocked: ReadonlySet<string>;
  readonly held: ReadonlySet<string>;
}

export interface DepGraphView {
  readonly live: GraphLive;
  readonly summary: readonly string[];
  readonly searching: boolean;
  readonly hits: ReadonlySet<string>;
  /** The band class per `layout.lanes` entry. */
  readonly bands: readonly string[];
  readonly nodeW: number;
  readonly statusText: ReadonlyMap<string, string>;
  /** Every node's ancestors and descendants, itself included. */
  readonly lineages: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Several projects at once: the marks that tell them apart. */
export interface DepGraphMulti {
  readonly projects: number;
  /** project → its `proj-<n>` class */
  readonly colors: ReadonlyMap<string, string>;
}

export interface DepGraphProps {
  readonly graph: BacklogGraph;
  readonly layout: GraphLayout;
  readonly onSelect: (id: string) => void;
  /** The card the drawer is focused on. */
  readonly focus?: string | undefined;
  /** Live marks, hits, lineages and status text: everything derived from the graph. */
  readonly view: DepGraphView;
  /** The entire-graph view (G11): waves are depth, every column reads `wave n`. */
  readonly entire?: boolean;
  /** Set only when the selection spans several projects; undefined renders as for one. */
  readonly multi?: DepGraphMulti | undefined;
  /** False when the drawer draws the summary line itself, outside the zoom. */
  readonly summary?: boolean;
}

function sectionOf(n: BacklogGraphNode): SectionKey {
  return n.closed ? "closed" : (n.state ?? "other");
}

function headerOf(
  wave: number,
  entire: boolean,
): {
  readonly head: string;
  readonly sub?: string;
} {
  if (entire) return { head: `wave ${wave}` };
  if (wave === 0) return { head: "done / outside" };
  return {
    head: `wave ${wave}`,
    sub: wave === 1 ? "fires now" : `after wave ${wave - 1}`,
  };
}

const titleOf = (n: BacklogGraphNode): string =>
  n.reason === undefined || n.reason === ""
    ? `${n.id} — ${n.title}`
    : `${n.id} — ${n.title}\n\nblocked: ${n.reason}`;

const cls = (...parts: readonly (string | false)[]): string =>
  parts.filter((p) => p !== false).join(" ");

export function DepGraph({
  graph,
  layout,
  onSelect,
  view,
  focus,
  entire = false,
  multi,
  summary = true,
}: DepGraphProps) {
  const [hovered, setHovered] = useState<string | undefined>(undefined);
  const lineage = hovered === undefined ? undefined : view.lineages.get(hovered);
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const edgesByKey = new Map(graph.edges.map((e) => [`${e.from}>${e.to}`, e] as const));
  const { live, summary: parts, searching, hits } = view;
  const litOf = (from: string, to: string): boolean =>
    lineage?.has(from) === true && lineage.has(to);
  const hit = (id: string): boolean => lineage === undefined && hits.has(id);
  const dimNode = (id: string): boolean =>
    lineage !== undefined ? !lineage.has(id) : searching && !hits.has(id);
  const dimEdge = (from: string, to: string, lit: boolean): boolean =>
    lineage !== undefined ? !lit : searching && !(hits.has(from) && hits.has(to));
  const flowing = layout.edges.filter((le) => live.running.has(le.from));

  return (
    <>
      {summary && parts.length > 0 && <div class="dg-sum">{parts.join(" · ")}</div>}
      <div
        class={entire ? "dg dg-entire" : "dg"}
        style={{ width: layout.width, height: layout.height }}
      >
        {layout.lanes?.map((b, i) => (
          <div
            key={b.project}
            class={`dg-lane ${view.bands[i]}`}
            data-lane={b.project}
            style={{
              top: b.y,
              height: b.h,
              width: layout.width,
            }}
          />
        ))}
        {layout.columns.map((c) => {
          const { head, sub } = headerOf(c.wave, entire);
          return (
            <div key={c.wave} class="dg-colh" style={{ left: c.x, width: view.nodeW }}>
              <b>{head}</b>
              {sub !== undefined && (
                <>
                  {" "}
                  <em>· {sub}</em>
                </>
              )}
            </div>
          );
        })}
        <svg class="dg-svg" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((le) => {
            const e = edgesByKey.get(`${le.from}>${le.to}`);
            if (e === undefined) {
              throw new Error(`DepGraph: layout edge ${le.from}>${le.to} not in graph`);
            }
            const lit = litOf(le.from, le.to);
            const flow = live.running.has(le.from);
            const stalled = !flow && (live.blocked.has(le.from) || live.held.has(le.from));
            return (
              <path
                key={`${le.from}>${le.to}`}
                class={cls(
                  "dg-edge",
                  e.met ? "dg-met" : "dg-unmet",
                  e.critical && "dg-crit",
                  multi !== undefined && e.cross === true && "dg-cross",
                  flow && "dg-flow",
                  stalled && "dg-stalled",
                  lit && "dg-on",
                  dimEdge(le.from, le.to, lit) && "dg-dim",
                )}
                d={le.d}
                data-from={le.from}
                data-to={le.to}
              />
            );
          })}
          {flowing.flatMap((le) => {
            const lit = litOf(le.from, le.to);
            return ["0s", "0.9s"].map((begin) => (
              <circle
                key={`${le.from}>${le.to}@${begin}`}
                class={cls("dg-dot", lit && "dg-on", dimEdge(le.from, le.to, lit) && "dg-dim")}
                r="3"
              >
                <animateMotion
                  dur="1.8s"
                  begin={begin}
                  repeatCount="indefinite"
                  {...({ path: le.d } as Record<string, string>)}
                />
              </circle>
            ));
          })}
        </svg>
        {layout.nodes.map((ln) => {
          const n = nodesById.get(ln.id);
          if (n === undefined) {
            throw new Error(`DepGraph: layout node ${ln.id} not in graph`);
          }
          const section = sectionOf(n);
          const fx = live.running.has(n.id) || live.blocked.has(n.id);
          const stripe =
            multi === undefined || n.project === undefined
              ? undefined
              : multi.colors.get(n.project);
          if (ln.collapsed === true) {
            return (
              <button
                key={n.id}
                type="button"
                class={cls(
                  "dg-node",
                  "dg-sq",
                  `s-${section}`,
                  n.critical && "dg-crit",
                  n.id === focus && "dg-focus",
                  hit(n.id) && "dg-hit",
                  dimNode(n.id) && "dg-dim",
                  stripe ?? false,
                )}
                style={{
                  left: ln.x,
                  top: ln.y,
                  width: ln.w,
                  height: ln.h,
                }}
                data-id={n.id}
                title={`${n.project ?? ""} · ${n.kind} · ${view.statusText.get(n.id) ?? ""}\n${titleOf(n)}`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(undefined)}
                onClick={() => onSelect(n.id)}
              />
            );
          }
          return (
            <button
              key={n.id}
              type="button"
              class={cls(
                "dg-node",
                `s-${section}`,
                n.kind === "manual" && "dg-manual",
                n.outside && "dg-outside",
                n.critical && "dg-crit",
                n.id === focus && "dg-focus",
                n.heldBy !== undefined && "dg-held",
                hit(n.id) && "dg-hit",
                dimNode(n.id) && "dg-dim",
              )}
              style={{ left: ln.x, top: ln.y, width: ln.w, height: ln.h }}
              data-id={n.id}
              title={titleOf(n)}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(undefined)}
              onClick={() => onSelect(n.id)}
            >
              {stripe !== undefined && <i class={`dg-stripe ${stripe}`} aria-hidden="true" />}
              {fx && <i class="dg-fx" aria-hidden="true" />}
              <span class="dg-top">
                <i class="dg-g">{n.status === "rejected" ? "✕" : SECTION_GLYPH[section]}</i>
                <span class="dg-seq">{n.label}</span>
                {n.priority === 1 && <i class="dg-p1">P1</i>}
                {n.openDeps > 0 && <i class="dg-drift">⚠ {n.openDeps} dep open</i>}
                {n.heldBy !== undefined && <i class="dg-via">⛔ via {n.heldBy}</i>}
                <span class="dg-st">
                  {multi !== undefined && n.project !== undefined
                    ? `${n.project} · ${view.statusText.get(n.id) ?? ""}`
                    : (view.statusText.get(n.id) ?? "")}
                </span>
              </span>
              <span class="dg-title">{n.title}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
