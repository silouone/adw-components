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
