import type {
  BacklogGraph,
  BacklogGraphEdge,
  BacklogGraphNode,
  DepGraphView,
  GraphLayout,
} from "../src/organisms/DepGraph/DepGraph";
import golden from "./layout-golden.json";

// Hand-written inputs for `<DepGraph/>`: its test and its stories read these. The graph, the layout
// (the committed `layout-golden.json`) and the view are literals; nothing here is derived by the factory.

export const DEP_GRAPH_NODE_W = 212;

const node = (
  id: string,
  wave: number,
  over: { readonly [K in keyof BacklogGraphNode]?: BacklogGraphNode[K] | undefined } = {},
): BacklogGraphNode =>
  ({
    id,
    label: id,
    title: `title of ${id}`,
    status: "queued",
    state: "waiting",
    closed: false,
    open: true,
    outside: false,
    kind: "ticket",
    wave,
    critical: false,
    openDeps: 0,
    ...over,
  }) as BacklogGraphNode;

const edge = (
  from: string,
  to: string,
  over: Partial<BacklogGraphEdge> = {},
): BacklogGraphEdge => ({ from, to, met: false, critical: false, ...over });

export const depGraphNode = node;
export const depGraphEdge = edge;

const held = { heldBy: "01" } as const;
const cqcNode = (n: string, wave: number, over: Parameters<typeof node>[2] = {}) =>
  node(`cqc-be-${n}`, wave, { label: n, ...held, ...over });

/** An eleven-card graph over six waves: 00 done, 01 blocked, every other card held behind 01. */
export const CQC_GRAPH: BacklogGraph = {
  nodes: [
    node("cqc-be-00", 0, {
      label: "00",
      closed: true,
      state: undefined,
      status: "done",
      open: false,
    }),
    node("cqc-be-01", 1, {
      label: "01",
      state: "blocked",
      status: "blocked",
      priority: 1,
      critical: true,
      reason: "red base",
    }),
    cqcNode("02", 2, { critical: true }),
    cqcNode("03", 2),
    cqcNode("04", 3),
    cqcNode("05", 3, { critical: true }),
    cqcNode("08", 3),
    cqcNode("09", 3),
    cqcNode("07", 3),
    cqcNode("06", 4, { critical: true }),
    cqcNode("10", 5, { critical: true }),
  ],
  edges: [
    edge("cqc-be-00", "cqc-be-01", { met: true }),
    edge("cqc-be-00", "cqc-be-07", { met: true }),
    edge("cqc-be-01", "cqc-be-02", { critical: true }),
    edge("cqc-be-01", "cqc-be-03"),
    edge("cqc-be-02", "cqc-be-04"),
    edge("cqc-be-02", "cqc-be-05", { critical: true }),
    edge("cqc-be-03", "cqc-be-04"),
    edge("cqc-be-03", "cqc-be-05"),
    edge("cqc-be-03", "cqc-be-07"),
    edge("cqc-be-03", "cqc-be-08"),
    edge("cqc-be-03", "cqc-be-09"),
    edge("cqc-be-05", "cqc-be-06", { critical: true }),
    edge("cqc-be-04", "cqc-be-10"),
    edge("cqc-be-05", "cqc-be-10"),
    edge("cqc-be-06", "cqc-be-10", { critical: true }),
  ],
  maxWave: 5,
  criticalPath: ["cqc-be-01", "cqc-be-02", "cqc-be-05", "cqc-be-06", "cqc-be-10"],
};

/** The layout of `CQC_GRAPH` with its done wave shown: the committed golden, key `cqc|true`. */
export const CQC_LAYOUT = golden["cqc|true"] as GraphLayout;

/** The same layout with the wave-0 card and its edges and column left out (done cards hidden). */
export const CQC_LAYOUT_HIDING_DONE: GraphLayout = {
  ...CQC_LAYOUT,
  nodes: CQC_LAYOUT.nodes.filter((n) => n.id !== "cqc-be-00"),
  edges: CQC_LAYOUT.edges.filter((e) => e.from !== "cqc-be-00"),
  columns: CQC_LAYOUT.columns.filter((c) => c.wave !== 0),
};

/** Each card's ancestors and descendants, itself included, for `CQC_GRAPH`. */
const lineage = (...ids: readonly string[]): ReadonlySet<string> =>
  new Set(ids.map((i) => `cqc-be-${i}`));
const CQC_LINEAGES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ["cqc-be-00", lineage("00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10")],
  ["cqc-be-01", lineage("00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10")],
  ["cqc-be-02", lineage("00", "01", "02", "04", "05", "06", "10")],
  ["cqc-be-03", lineage("00", "01", "03", "04", "05", "06", "07", "08", "09", "10")],
  ["cqc-be-04", lineage("00", "01", "02", "03", "04", "10")],
  ["cqc-be-05", lineage("00", "01", "02", "03", "05", "06", "10")],
  ["cqc-be-06", lineage("00", "01", "02", "03", "05", "06", "10")],
  ["cqc-be-07", lineage("00", "01", "03", "07")],
  ["cqc-be-08", lineage("00", "01", "03", "08")],
  ["cqc-be-09", lineage("00", "01", "03", "09")],
  ["cqc-be-10", lineage("00", "01", "02", "03", "04", "05", "06", "10")],
]);

const EMPTY: ReadonlySet<string> = new Set();

/** The view of `CQC_GRAPH`: 01 blocked, the other nine held behind it, nothing running, no search. */
export const CQC_VIEW: DepGraphView = {
  live: {
    running: EMPTY,
    blocked: new Set(["cqc-be-01"]),
    held: new Set(CQC_GRAPH.nodes.filter((n) => n.heldBy !== undefined).map((n) => n.id)),
  },
  summary: ["✕ 1 blocked", "⛔ 9 held behind a block"],
  searching: false,
  hits: EMPTY,
  bands: [],
  nodeW: DEP_GRAPH_NODE_W,
  statusText: new Map(
    CQC_GRAPH.nodes.map((n) => [n.id, n.closed ? "done" : (n.state ?? "other")] as const),
  ),
  lineages: CQC_LINEAGES,
};

/** A graph over `nodes` and `edges`, with no critical path. */
export const depGraphOf = (
  nodes: readonly BacklogGraphNode[],
  edges: readonly BacklogGraphEdge[] = [],
  maxWave = 2,
): BacklogGraph => ({ nodes, edges, maxWave, criticalPath: [] });

const COL_STEP = 332;
const ROW_STEP = 64;
const PAD = 24;
const CARD_H = 50;

/** A deterministic grid: one column per wave, ascending; each edge runs from a card's right to the next's left. */
export const depGraphLayout = (graph: BacklogGraph): GraphLayout => {
  const waves = [...new Set(graph.nodes.map((n) => n.wave))].sort((a, b) => a - b);
  const rows = new Map<number, number>();
  const nodes = graph.nodes.map((n) => {
    const row = rows.get(n.wave) ?? 0;
    rows.set(n.wave, row + 1);
    return {
      id: n.id,
      x: PAD + COL_STEP * waves.indexOf(n.wave),
      y: PAD + ROW_STEP * row,
      w: DEP_GRAPH_NODE_W,
      h: CARD_H,
    };
  });
  const at = new Map(nodes.map((n) => [n.id, n] as const));
  const edges = graph.edges.map((e) => {
    const from = at.get(e.from);
    const to = at.get(e.to);
    const d =
      from === undefined || to === undefined
        ? ""
        : `M ${from.x + DEP_GRAPH_NODE_W} ${from.y + CARD_H / 2} L ${to.x} ${to.y + CARD_H / 2}`;
    return { from: e.from, to: e.to, d };
  });
  const tallest = Math.max(0, ...rows.values());
  return {
    nodes,
    edges,
    columns: waves.map((wave, i) => ({ wave, x: PAD + COL_STEP * i })),
    width: nodes.length === 0 ? 0 : PAD + COL_STEP * waves.length + PAD,
    height: nodes.length === 0 ? 0 : PAD + ROW_STEP * tallest + PAD,
  };
};

/** Every id reachable from `start` along `next`, `start` included. */
const reach = (
  start: string,
  next: ReadonlyMap<string, readonly string[]>,
): ReadonlySet<string> => {
  const seen = new Set([start]);
  const todo = [start];
  for (let id = todo.pop(); id !== undefined; id = todo.pop()) {
    for (const n of next.get(id) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        todo.push(n);
      }
    }
  }
  return seen;
};

const adjacency = (pairs: readonly (readonly [string, string])[]) =>
  pairs.reduce(
    (m, [a, b]) => m.set(a, [...(m.get(a) ?? []), b]),
    new Map<string, readonly string[]>(),
  );

/**
 * The view of any graph: running = running / in-flight, blocked, held = has `heldBy`, status text
 * from the state (`texts` overrides per id), lineages along the edges. `over` wins last.
 */
export const depGraphView = (
  graph: BacklogGraph,
  over: Partial<DepGraphView> & { readonly texts?: Readonly<Record<string, string>> } = {},
): DepGraphView => {
  const { texts = {}, ...rest } = over;
  const ids = (pick: (n: BacklogGraphNode) => boolean): ReadonlySet<string> =>
    new Set(graph.nodes.filter(pick).map((n) => n.id));
  const down = adjacency(graph.edges.map((e) => [e.from, e.to] as const));
  const up = adjacency(graph.edges.map((e) => [e.to, e.from] as const));
  const word = (n: BacklogGraphNode): string =>
    n.closed ? "done" : n.state === "in-flight" ? "in flight" : (n.state ?? "other");
  return {
    live: {
      running: ids((n) => n.state === "running" || n.state === "in-flight"),
      blocked: ids((n) => n.state === "blocked"),
      held: ids((n) => n.heldBy !== undefined),
    },
    summary: [],
    searching: false,
    hits: EMPTY,
    bands: [],
    nodeW: DEP_GRAPH_NODE_W,
    statusText: new Map(graph.nodes.map((n) => [n.id, texts[n.id] ?? word(n)] as const)),
    lineages: new Map(
      graph.nodes.map((n) => [n.id, new Set([...reach(n.id, up), ...reach(n.id, down)])] as const),
    ),
    ...rest,
  };
};

/**
 * Live cards: 00 done; 01 blocked ("red base"); 04 running; 02, 03, 05 (in flight) and 07 held behind 01;
 * 06 waits on 04. 05 is running-class AND held: its out-edge flows.
 */
export const LIVE_GRAPH: BacklogGraph = {
  nodes: [
    node("g-00", 0, { label: "00", closed: true, state: undefined, status: "done", open: false }),
    node("g-01", 1, {
      label: "01",
      state: "blocked",
      status: "blocked",
      reason: "red base",
    }),
    node("g-04", 1, { label: "04", state: "running", status: "running" }),
    node("g-02", 2, { label: "02", heldBy: "01" }),
    node("g-03", 2, { label: "03", heldBy: "01" }),
    node("g-06", 2, { label: "06" }),
    node("g-05", 3, { label: "05", state: "in-flight", status: "in-flight", heldBy: "01" }),
    node("g-07", 4, { label: "07", heldBy: "01" }),
  ],
  edges: [
    edge("g-00", "g-01", { met: true }),
    edge("g-01", "g-02"),
    edge("g-01", "g-03"),
    edge("g-00", "g-04", { met: true }),
    edge("g-02", "g-05"),
    edge("g-04", "g-06"),
    edge("g-05", "g-07"),
  ],
  maxWave: 4,
  criticalPath: [],
};

export const LIVE_LAYOUT: GraphLayout = depGraphLayout(LIVE_GRAPH);

export const LIVE_VIEW: DepGraphView = depGraphView(LIVE_GRAPH, {
  summary: ["◌ 2 running", "✕ 1 blocked", "⛔ 4 held behind a block"],
  texts: { "g-04": "running · 12m", "g-05": "in flight · 3m" },
});
