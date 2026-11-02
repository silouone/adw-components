// `<DepGraph/>`: cards, columns, critical path, hover lineage, click, focus, live state, CSS and the
// golden layout over literal inputs, then the entire view, multi-project marks, swimlanes, collapsed
// squares, search lighting and the small ad-hoc graphs. Matching a query is derivation and stays in the
// factory: here `view.searching` and `view.hits` arrive as literals.

import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  CQC_GRAPH,
  CQC_LAYOUT,
  CQC_LAYOUT_HIDING_DONE,
  CQC_VIEW,
  LIVE_GRAPH,
  LIVE_LAYOUT,
  LIVE_VIEW,
  depGraphEdge,
  depGraphLayout,
  depGraphNode,
  depGraphOf,
  depGraphView,
} from "../../../fixtures/DepGraph";
import { SECTION_GLYPH } from "../../glyphs";
import {
  type BacklogGraph,
  DepGraph,
  type DepGraphMulti,
  type DepGraphProps,
  type DepGraphView,
  type GraphLayout,
} from "./DepGraph";

afterEach(cleanup);

const css = readFileSync(new URL("./DepGraph.css", import.meta.url), "utf8");

const mount = (over: Partial<DepGraphProps> = {}) => {
  const picked: string[] = [];
  const out = render(
    <DepGraph
      graph={CQC_GRAPH}
      layout={CQC_LAYOUT}
      view={CQC_VIEW}
      onSelect={(id) => picked.push(id)}
      {...over}
    />,
  );
  return { ...out, picked };
};

const cards = (c: Element) => Array.from(c.querySelectorAll<HTMLElement>(".dg-node"));
const paths = (c: Element) => Array.from(c.querySelectorAll<SVGPathElement>("path.dg-edge"));
const endOf = (p: SVGElement, side: 0 | 1): string =>
  (side === 0 ? p.dataset.from : p.dataset.to) ?? "";
const cardOf = (c: Element, id: string) => {
  const el = c.querySelector<HTMLElement>(`.dg-node[data-id="${id}"]`);
  if (el === null) throw new Error(`no card ${id}`);
  return el;
};
const edgeOf = (c: Element, from: string, to: string) => {
  const el = c.querySelector<SVGPathElement>(`path.dg-edge[data-from="${from}"][data-to="${to}"]`);
  if (el === null) throw new Error(`no edge ${from}>${to}`);
  return el;
};
const dots = (c: Element) => Array.from(c.querySelectorAll<SVGCircleElement>("circle.dg-dot"));
const pathOf = (dot: Element) => dot.querySelector("animateMotion")?.getAttribute("path");
const stOf = (c: Element, id: string) => cardOf(c, id).querySelector(".dg-st")?.textContent;
const mountGraph = (
  graph: Parameters<typeof depGraphView>[0],
  viewOver: Parameters<typeof depGraphView>[1] = {},
  layout = depGraphLayout(graph),
) =>
  render(
    <DepGraph
      graph={graph}
      layout={layout}
      view={depGraphView(graph, viewOver)}
      onSelect={() => {}}
    />,
  );
const mountLive = () =>
  render(<DepGraph graph={LIVE_GRAPH} layout={LIVE_LAYOUT} view={LIVE_VIEW} onSelect={() => {}} />);
const dgClasses = (...roots: readonly Element[]): readonly string[] => [
  ...new Set(
    roots
      .flatMap((root) => Array.from(root.querySelectorAll("[class]")))
      .flatMap((el) => Array.from(el.classList))
      .filter((c) => c.startsWith("dg")),
  ),
];
const hasRule = (c: string): boolean =>
  new RegExp(`\\.${c.replace(/-/g, "\\-")}(?![\\w-])`).test(css);

describe("<DepGraph/> — cards and columns", () => {
  test("one card per node", () => {
    const { container } = mount();
    expect(cards(container)).toHaveLength(CQC_GRAPH.nodes.length);
    expect(paths(container)).toHaveLength(CQC_GRAPH.edges.length);
  });

  test("hidden wave-0 cards are absent when laid out with the done wave hidden", () => {
    const { container } = mount({ layout: CQC_LAYOUT_HIDING_DONE });
    expect(cards(container)).toHaveLength(CQC_GRAPH.nodes.length - 1);
    expect(container.querySelector('[data-id="cqc-be-00"]')).toBeNull();
  });

  test("column headers read fires now / after wave n-1 / done-outside", () => {
    const { container } = mount();
    const heads = Array.from(container.querySelectorAll(".dg-colh")).map((h) => h.textContent);
    expect(heads).toContain("wave 1 · fires now");
    expect(heads).toContain("wave 3 · after wave 2");
    expect(heads).toContain("done / outside");
  });

  test("the card shows glyph, label, P1 (priority 1 only), status and title", () => {
    const { container } = mount();
    const p1 = cardOf(container, "cqc-be-01");
    expect(p1.textContent).toContain(SECTION_GLYPH.blocked);
    expect(p1.textContent).toContain("01");
    expect(p1.textContent).toContain("P1");
    expect(p1.textContent).toContain("blocked");
    expect(p1.textContent).toContain("title of cqc-be-01");
    expect(p1.classList.contains("s-blocked")).toBe(true);
    const p2 = cardOf(container, "cqc-be-02");
    expect(p2.textContent).not.toContain("P1");
    expect(p2.textContent).toContain(SECTION_GLYPH.waiting);
    expect(p2.classList.contains("s-waiting")).toBe(true);
  });

  test("a layout node that is not in the graph fails fast with its id", () => {
    const without = { ...CQC_GRAPH, nodes: CQC_GRAPH.nodes.filter((n) => n.id !== "cqc-be-03") };
    expect(() => mount({ graph: without })).toThrow("DepGraph: layout node cqc-be-03 not in graph");
  });

  test("a layout edge that is not in the graph fails fast with both ids", () => {
    const without = { ...CQC_GRAPH, edges: CQC_GRAPH.edges.filter((e) => e.from !== "cqc-be-06") };
    expect(() => mount({ graph: without })).toThrow(
      "DepGraph: layout edge cqc-be-06>cqc-be-10 not in graph",
    );
  });
});

describe("<DepGraph/> — critical path", () => {
  test("dg-crit sits on the critical cards and critical edges only", () => {
    const { container } = mount();
    const critCards = cards(container)
      .filter((c) => c.classList.contains("dg-crit"))
      .map((c) => c.getAttribute("data-id"))
      .sort();
    expect(critCards).toEqual(CQC_GRAPH.criticalPath.slice().sort());
    const critEdges = paths(container)
      .filter((p) => p.classList.contains("dg-crit"))
      .map((p) => `${endOf(p, 0)}>${endOf(p, 1)}`)
      .sort();
    expect(critEdges).toEqual(
      CQC_GRAPH.edges
        .filter((e) => e.critical)
        .map((e) => `${e.from}>${e.to}`)
        .sort(),
    );
    expect(critEdges.length).toBeGreaterThan(0);
  });
});

describe("<DepGraph/> — hover and click", () => {
  const lineageOf04 = new Set(["04", "02", "03", "01", "00", "10"].map((n) => `cqc-be-${n}`));

  test("hovering a card dims everything outside its lineage, edges included", () => {
    const { container } = mount();
    expect(container.querySelectorAll(".dg-dim")).toHaveLength(0);
    fireEvent.mouseEnter(cardOf(container, "cqc-be-04"));
    for (const n of CQC_GRAPH.nodes) {
      expect(cardOf(container, n.id).classList.contains("dg-dim")).toBe(!lineageOf04.has(n.id));
    }
    for (const p of paths(container)) {
      const inLineage = lineageOf04.has(endOf(p, 0)) && lineageOf04.has(endOf(p, 1));
      expect(p.classList.contains("dg-dim")).toBe(!inLineage);
      expect(p.classList.contains("dg-on")).toBe(inLineage);
    }
    fireEvent.mouseLeave(cardOf(container, "cqc-be-04"));
    expect(container.querySelectorAll(".dg-dim, .dg-on")).toHaveLength(0);
  });

  test("moving straight from one card to another re-lights the second's lineage", () => {
    const { container } = mount();
    fireEvent.mouseEnter(cardOf(container, "cqc-be-04"));
    fireEvent.mouseEnter(cardOf(container, "cqc-be-08"));
    for (const id of ["cqc-be-08", "cqc-be-03", "cqc-be-01", "cqc-be-00"]) {
      expect(cardOf(container, id).classList.contains("dg-dim")).toBe(false);
    }
    for (const id of ["cqc-be-04", "cqc-be-02", "cqc-be-10", "cqc-be-09"]) {
      expect(cardOf(container, id).classList.contains("dg-dim")).toBe(true);
    }
  });

  test("hovering does not select; each click selects that card, in order", () => {
    const { container, picked } = mount();
    fireEvent.mouseEnter(cardOf(container, "cqc-be-04"));
    expect(picked).toEqual([]);
    fireEvent.click(cardOf(container, "cqc-be-04"));
    fireEvent.click(cardOf(container, "cqc-be-02"));
    fireEvent.click(cardOf(container, "cqc-be-02"));
    expect(picked).toEqual(["cqc-be-04", "cqc-be-02", "cqc-be-02"]);
  });
});

describe("<DepGraph/> — layout and markup", () => {
  test("each edge draws the layout's own path", () => {
    const { container } = mount();
    const drawn = paths(container)
      .map((p) => `${endOf(p, 0)}>${endOf(p, 1)}=${p.getAttribute("d")}`)
      .sort();
    expect(drawn).toEqual(CQC_LAYOUT.edges.map((e) => `${e.from}>${e.to}=${e.d}`).sort());
  });

  test("cards sit where the layout puts them", () => {
    const { container } = mount();
    for (const n of CQC_LAYOUT.nodes) {
      const style = cardOf(container, n.id).style;
      expect(style.left).toBe(`${n.x}px`);
      expect(style.top).toBe(`${n.y}px`);
      expect(style.width).toBe(`${n.w}px`);
      expect(style.height).toBe(`${n.h}px`);
    }
  });

  test("a met edge is dg-met, an unmet one dg-unmet, never both", () => {
    const { container } = mount();
    const pathOf = (from: string, to: string) => {
      const p = container.querySelector(`path.dg-edge[data-from="${from}"][data-to="${to}"]`);
      if (p === null) throw new Error(`no edge ${from}>${to}`);
      return p;
    };
    const met = pathOf("cqc-be-00", "cqc-be-01");
    expect(met.classList.contains("dg-met")).toBe(true);
    expect(met.classList.contains("dg-unmet")).toBe(false);
    const unmet = pathOf("cqc-be-01", "cqc-be-02");
    expect(unmet.classList.contains("dg-unmet")).toBe(true);
    expect(unmet.classList.contains("dg-met")).toBe(false);
  });

  test("a card is a real button, and the edge layer is hidden from assistive tech", () => {
    const { container } = mount();
    for (const c of cards(container)) {
      expect(c.tagName).toBe("BUTTON");
      expect(c.getAttribute("type")).toBe("button");
    }
    expect(container.querySelector("svg.dg-svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("the summary reads the view's parts and sits before the graph frame", () => {
    const { container } = mount();
    expect(container.querySelector(".dg-sum")?.textContent).toBe(
      "✕ 1 blocked · ⛔ 9 held behind a block",
    );
    const order = Array.from(container.children);
    expect(order.indexOf(container.querySelector(".dg-sum") as Element)).toBeLessThan(
      order.indexOf(container.querySelector(".dg") as Element),
    );
  });

  test("every held card shows `⛔ via <label>` and dg-held; the blocker and closed cards do not", () => {
    const { container } = mount();
    for (const n of ["02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
      const el = cardOf(container, `cqc-be-${n}`);
      expect(el.classList.contains("dg-held")).toBe(true);
      expect(el.querySelector(".dg-top .dg-via")?.textContent).toBe("⛔ via 01");
    }
    for (const n of ["00", "01"]) {
      expect(cardOf(container, `cqc-be-${n}`).classList.contains("dg-held")).toBe(false);
    }
  });
});

describe("<DepGraph/> — focus", () => {
  const focused = (c: Element) =>
    Array.from(c.querySelectorAll(".dg-node.dg-focus")).map((e) => e.getAttribute("data-id"));

  test("exactly the focused card carries dg-focus", () => {
    expect(focused(mount({ focus: "cqc-be-03" }).container)).toEqual(["cqc-be-03"]);
  });

  test("no focus, no dg-focus", () => {
    expect(focused(mount().container)).toEqual([]);
  });

  test("a focus that is not a card marks nothing", () => {
    expect(focused(mount({ focus: "ghost" }).container)).toEqual([]);
  });
});

describe("<DepGraph/> — live state", () => {
  test("a running card reads `running · 12m`, an in-flight one `in flight · 3m`", () => {
    const { container } = mountLive();
    expect(stOf(container, "g-04")).toBe("running · 12m");
    expect(stOf(container, "g-05")).toBe("in flight · 3m");
  });

  test("a status text without an elapsed part renders as the bare word", () => {
    const g = depGraphOf([depGraphNode("x", 1, { state: "running", status: "running" })], [], 1);
    expect(stOf(mountGraph(g).container, "x")).toBe("running");
    cleanup();
    expect(stOf(mountGraph(g, { texts: { x: "running" } }).container, "x")).toBe("running");
  });

  test("running, in-flight and blocked cards carry a .dg-fx first child; others do not", () => {
    const { container } = mountLive();
    for (const id of ["g-04", "g-05", "g-01"]) {
      const fx = cardOf(container, id).firstElementChild;
      expect(fx?.classList.contains("dg-fx")).toBe(true);
      expect(fx?.tagName).toBe("I");
      expect(fx?.getAttribute("aria-hidden")).toBe("true");
      expect(fx?.textContent).toBe("");
    }
    for (const id of ["g-00", "g-02", "g-06"]) {
      expect(cardOf(container, id).querySelector(".dg-fx")).toBeNull();
    }
  });

  test("a blocked card reads `blocked` and its title carries the reason", () => {
    const { container } = mountLive();
    expect(stOf(container, "g-01")).toBe("blocked");
    expect(cardOf(container, "g-01").getAttribute("title")).toBe(
      "g-01 — title of g-01\n\nblocked: red base",
    );
    expect(cardOf(container, "g-02").getAttribute("title")).toBe("g-02 — title of g-02");
  });

  test("a blocked card with no reason has no `blocked:` line", () => {
    const g = depGraphOf([depGraphNode("x", 1, { state: "blocked", status: "blocked" })], [], 1);
    expect(cardOf(mountGraph(g).container, "x").getAttribute("title")).toBe("x — title of x");
  });

  test("the via badge sits in .dg-top before the status", () => {
    const { container } = mount();
    const top = cardOf(container, "cqc-be-02").querySelector(".dg-top");
    const kids = Array.from(top?.children ?? []).map((k) => k.className);
    const via = kids.indexOf("dg-via");
    expect(via).toBeGreaterThan(-1);
    expect(kids.indexOf("dg-st")).toBe(via + 1);
  });

  test("edge classes: flow out of running, stalled out of blocked or held, plain otherwise", () => {
    const { container } = mountLive();
    const cl = (f: string, t: string) => edgeOf(container, f, t).classList;
    expect(cl("g-04", "g-06").contains("dg-flow")).toBe(true);
    expect(cl("g-04", "g-06").contains("dg-stalled")).toBe(false);
    expect(cl("g-01", "g-02").contains("dg-stalled")).toBe(true);
    expect(cl("g-01", "g-02").contains("dg-flow")).toBe(false);
    expect(cl("g-02", "g-05").contains("dg-stalled")).toBe(true);
    expect(cl("g-00", "g-04").contains("dg-flow")).toBe(false);
    expect(cl("g-00", "g-04").contains("dg-stalled")).toBe(false);
  });

  test("a running node that is also held: its out-edge flows, it does not stall", () => {
    const { container } = mountLive();
    expect(cardOf(container, "g-05").classList.contains("dg-held")).toBe(true);
    const c = edgeOf(container, "g-05", "g-07").classList;
    expect(c.contains("dg-flow")).toBe(true);
    expect(c.contains("dg-stalled")).toBe(false);
  });

  test("two dots per running out-edge, along the edge's own path, half a cycle apart", () => {
    const { container } = mountLive();
    expect(dots(container)).toHaveLength(4);
    for (const [from, to] of [
      ["g-04", "g-06"],
      ["g-05", "g-07"],
    ] as const) {
      const d = LIVE_LAYOUT.edges.find((e) => e.from === from && e.to === to)?.d;
      const mine = dots(container).filter((c) => pathOf(c) === d);
      expect(mine).toHaveLength(2);
      expect(mine.map((c) => c.querySelector("animateMotion")?.getAttribute("begin"))).toEqual([
        "0s",
        "0.9s",
      ]);
      for (const c of mine) {
        const m = c.querySelector("animateMotion");
        expect(m?.getAttribute("dur")).toBe("1.8s");
        expect(m?.getAttribute("repeatCount")).toBe("indefinite");
      }
    }
  });

  test("no dots for stalled or plain edges, or when nothing runs", () => {
    expect(dots(mount().container)).toHaveLength(0);
  });

  test("a dot takes its edge's lit / dimmed state on hover, never both, none at rest", () => {
    const { container } = mountLive();
    for (const d of dots(container)) {
      expect(d.classList.contains("dg-on")).toBe(false);
      expect(d.classList.contains("dg-dim")).toBe(false);
    }
    fireEvent.mouseEnter(cardOf(container, "g-06"));
    const lit = dots(container).filter((d) => d.classList.contains("dg-on"));
    const dim = dots(container).filter((d) => d.classList.contains("dg-dim"));
    expect(lit).toHaveLength(2);
    expect(dim).toHaveLength(2);
    for (const d of dots(container)) {
      expect(d.classList.contains("dg-on") && d.classList.contains("dg-dim")).toBe(false);
    }
    const litD = edgeOf(container, "g-04", "g-06").getAttribute("d");
    expect(lit.map(pathOf)).toEqual([litD, litD]);
    fireEvent.mouseLeave(cardOf(container, "g-06"));
    expect(container.querySelectorAll("circle.dg-on, circle.dg-dim")).toHaveLength(0);
  });

  test("the summary reads `◌ 2 running · ✕ 1 blocked · ⛔ 4 held behind a block`", () => {
    const { container } = mountLive();
    expect(container.querySelector(".dg-sum")?.textContent).toBe(
      "◌ 2 running · ✕ 1 blocked · ⛔ 4 held behind a block",
    );
    expect(container.querySelectorAll(".dg-via")).toHaveLength(4);
  });

  test("no summary parts, no summary element at all", () => {
    const { container } = mountGraph(LIVE_GRAPH, { summary: [] });
    expect(container.querySelector(".dg-sum")).toBeNull();
  });

  test("the summary sits before, not inside, the graph frame", () => {
    const { container } = mountLive();
    const sum = container.querySelector(".dg-sum");
    const frame = container.querySelector(".dg");
    expect(sum?.parentElement).not.toBe(frame);
    expect(frame?.querySelector(".dg-sum")).toBeNull();
    const order = Array.from(container.children);
    expect(order.indexOf(sum as Element)).toBeGreaterThanOrEqual(0);
    expect(order.indexOf(sum as Element)).toBeLessThan(order.indexOf(frame as Element));
  });
});

describe("<DepGraph/> — live state hardening", () => {
  const running = (id: string, wave: number, o: Parameters<typeof depGraphNode>[2] = {}) =>
    depGraphNode(id, wave, { state: "running", status: "running", ...o });

  test("a running node with no out-edge has its overlay but no dots and no flow edge", () => {
    const { container } = mountGraph(depGraphOf([running("a", 1)], [], 1));
    expect(cardOf(container, "a").querySelector(".dg-fx")).not.toBeNull();
    expect(dots(container)).toHaveLength(0);
    expect(container.querySelector(".dg-flow")).toBeNull();
  });

  test("each out-edge of a running node gets its own pair of dots", () => {
    const g = depGraphOf(
      [running("a", 1), depGraphNode("b", 2), depGraphNode("c", 2), depGraphNode("d", 2)],
      [depGraphEdge("a", "b"), depGraphEdge("a", "c"), depGraphEdge("a", "d")],
    );
    const layout = depGraphLayout(g);
    const { container } = mountGraph(g, {}, layout);
    expect(dots(container)).toHaveLength(6);
    for (const le of layout.edges) {
      expect(dots(container).filter((c) => pathOf(c) === le.d)).toHaveLength(2);
    }
    expect(container.querySelectorAll("path.dg-edge.dg-flow")).toHaveLength(3);
  });

  test("the dots sit inside the edge svg, after every path, and never inside a card", () => {
    const g = depGraphOf([running("a", 1), depGraphNode("b", 2)], [depGraphEdge("a", "b")]);
    const { container } = mountGraph(g);
    const svg = container.querySelector("svg.dg-svg");
    const kids = Array.from(svg?.children ?? []).map((k) => k.tagName);
    expect(kids.lastIndexOf("path")).toBeLessThan(kids.indexOf("circle"));
    for (const d of dots(container)) {
      expect(d.parentNode).toBe(svg);
      expect(d.closest(".dg-node")).toBeNull();
      expect(d.getAttribute("r")).toBe("3");
    }
  });

  test("hovering the running card itself lights its out-edge dots and dims the rest", () => {
    const g = depGraphOf(
      [running("a", 1), depGraphNode("b", 2), running("x", 1), depGraphNode("y", 2)],
      [depGraphEdge("a", "b"), depGraphEdge("x", "y")],
    );
    const layout = depGraphLayout(g);
    const { container } = mountGraph(g, {}, layout);
    fireEvent.mouseEnter(cardOf(container, "a"));
    const dA = layout.edges.find((e) => e.from === "a")?.d;
    expect(dots(container)).toHaveLength(4);
    for (const d of dots(container)) {
      expect(d.classList.contains("dg-on")).toBe(pathOf(d) === dA);
      expect(d.classList.contains("dg-dim")).toBe(pathOf(d) !== dA);
    }
  });

  test("hovering a card outside every flow lineage dims all dots", () => {
    const g = depGraphOf(
      [running("a", 1), depGraphNode("b", 2), depGraphNode("z", 1)],
      [depGraphEdge("a", "b")],
    );
    const { container } = mountGraph(g);
    fireEvent.mouseEnter(cardOf(container, "z"));
    expect(dots(container)).toHaveLength(2);
    expect(dots(container).every((d) => d.classList.contains("dg-dim"))).toBe(true);
    expect(container.querySelector("circle.dg-on")).toBeNull();
  });

  test("each dot's lit / dimmed state equals that of the edge it rides", () => {
    const g = depGraphOf(
      [running("m-1", 1), depGraphNode("m-2", 2), depGraphNode("m-3", 2)],
      [depGraphEdge("m-1", "m-2"), depGraphEdge("m-1", "m-3")],
    );
    const { container } = mountGraph(g);
    fireEvent.mouseEnter(cardOf(container, "m-2"));
    expect(dots(container)).toHaveLength(4);
    for (const d of dots(container)) {
      const edgeEl = paths(container).find((p) => p.getAttribute("d") === pathOf(d));
      expect(edgeEl).toBeDefined();
      expect(d.classList.contains("dg-on")).toBe(edgeEl?.classList.contains("dg-on") === true);
      expect(d.classList.contains("dg-dim")).toBe(edgeEl?.classList.contains("dg-dim") === true);
    }
  });

  test("a blocked card that is itself held shows overlay, badge and a stalled out-edge", () => {
    const g = depGraphOf(
      [
        depGraphNode("h-1", 1, { state: "blocked", status: "blocked", label: "01" }),
        depGraphNode("h-2", 2, {
          state: "blocked",
          status: "blocked",
          heldBy: "01",
          reason: "second",
        }),
        depGraphNode("h-3", 3),
      ],
      [depGraphEdge("h-1", "h-2"), depGraphEdge("h-2", "h-3")],
      3,
    );
    const { container } = mountGraph(g);
    const c = cardOf(container, "h-2");
    expect(c.firstElementChild?.classList.contains("dg-fx")).toBe(true);
    expect(c.querySelector(".dg-via")?.textContent).toBe("⛔ via 01");
    expect(c.querySelector(".dg-st")?.textContent).toBe("blocked");
    const out = edgeOf(container, "h-2", "h-3");
    expect(out.classList.contains("dg-stalled")).toBe(true);
    expect(out.classList.contains("dg-flow")).toBe(false);
  });

  test("a drift warning and the via badge coexist in .dg-top, in order", () => {
    const g = depGraphOf(
      [
        depGraphNode("s", 1, { state: "blocked", status: "blocked" }),
        depGraphNode("t", 2, { openDeps: 1, heldBy: "s" }),
      ],
      [depGraphEdge("s", "t")],
    );
    const { container } = mountGraph(g);
    const kids = Array.from(cardOf(container, "t").querySelector(".dg-top")?.children ?? []).map(
      (k) => k.className,
    );
    expect(kids.indexOf("dg-drift")).toBeGreaterThan(-1);
    expect(kids.indexOf("dg-drift")).toBeLessThan(kids.indexOf("dg-via"));
    expect(kids.indexOf("dg-via")).toBeLessThan(kids.indexOf("dg-st"));
  });

  test("a re-render with a changed status text advances the elapsed text", () => {
    const g = depGraphOf([running("a", 1)], [], 1);
    const layout = depGraphLayout(g);
    const viewWith = (text: string) => depGraphView(g, { texts: { a: text } });
    const out = render(
      <DepGraph graph={g} layout={layout} view={viewWith("running · 12m")} onSelect={() => {}} />,
    );
    expect(stOf(out.container, "a")).toBe("running · 12m");
    out.rerender(
      <DepGraph graph={g} layout={layout} view={viewWith("running · 1h 2m")} onSelect={() => {}} />,
    );
    expect(stOf(out.container, "a")).toBe("running · 1h 2m");
  });

  test("a running card's title carries no `blocked:` line", () => {
    const { container } = mountGraph(depGraphOf([running("a", 1)], [], 1));
    expect(cardOf(container, "a").getAttribute("title")).toBe("a — title of a");
  });

  test("a multi-line reason with markup is carried verbatim, as text, not markup", () => {
    const reason = "line one\nline <b>two</b> & three";
    const g = depGraphOf(
      [depGraphNode("x", 1, { state: "blocked", status: "blocked", reason })],
      [],
      1,
    );
    const { container } = mountGraph(g);
    expect(cardOf(container, "x").getAttribute("title")).toBe(
      `x — title of x\n\nblocked: ${reason}`,
    );
    expect(cardOf(container, "x").querySelector("b")).toBeNull();
  });

  test("an empty reason adds no dangling `blocked:` line", () => {
    const g = depGraphOf(
      [depGraphNode("x", 1, { state: "blocked", status: "blocked", reason: "" })],
      [],
      1,
    );
    const { container } = mountGraph(g);
    expect(cardOf(container, "x").getAttribute("title")).toBe("x — title of x");
  });

  test("a running-and-held card is drawn in both parts of the summary", () => {
    const g = depGraphOf(
      [
        depGraphNode("s", 1, { state: "blocked", status: "blocked", label: "01" }),
        running("r", 2, { heldBy: "01" }),
      ],
      [depGraphEdge("s", "r")],
    );
    const { container } = mountGraph(g, {
      summary: ["◌ 1 running", "✕ 1 blocked", "⛔ 1 held behind a block"],
    });
    expect(container.querySelector(".dg-sum")?.textContent).toBe(
      "◌ 1 running · ✕ 1 blocked · ⛔ 1 held behind a block",
    );
    const r = cardOf(container, "r");
    expect(r.querySelector(".dg-fx")).not.toBeNull();
    expect(r.classList.contains("dg-held")).toBe(true);
    expect(r.querySelector(".dg-via")?.textContent).toBe("⛔ via 01");
  });

  test("the summary is the same whether or not done cards are shown", () => {
    const text = mount().container.querySelector(".dg-sum")?.textContent;
    expect(text).toBeTruthy();
    cleanup();
    const b = mount({ layout: CQC_LAYOUT_HIDING_DONE });
    expect(b.container.querySelector(".dg-sum")?.textContent).toBe(text);
  });

  test("an empty graph renders no summary, no dots and no card", () => {
    const { container } = mountGraph(depGraphOf([], [], 0), { summary: [] });
    expect(container.querySelector(".dg-sum")).toBeNull();
    expect(dots(container)).toHaveLength(0);
    expect(cards(container)).toHaveLength(0);
  });

  test("a layout edge missing from the graph still fails fast with live nodes present", () => {
    const g = depGraphOf([running("a", 1), depGraphNode("b", 2)], [depGraphEdge("a", "b")]);
    const thin = depGraphOf([...g.nodes], []);
    expect(() => mountGraph(thin, {}, depGraphLayout(g))).toThrow(/a>b/);
  });
});

describe("<DepGraph/> — live state CSS", () => {
  const rule = (sel: RegExp) => new RegExp(`${sel.source}\\s*\\{([^}]*)\\}`);

  test("the overlay is its own click-through layer inside the card", () => {
    const m = /(?:^|\n)\.dg-fx\s*\{([^}]*)\}/.exec(css);
    expect(m?.[1]).toMatch(/position:\s*absolute/);
    expect(m?.[1]).toMatch(/pointer-events:\s*none/);
  });

  test("running cards glow and sweep at ~2.4s; the glyph spins", () => {
    expect(css).toMatch(/\.dg-node\.s-running[^{]*\{[^}]*box-shadow/);
    expect(css).toMatch(/\.dg-fx[^{]*\{[^}]*animation:[^;}]*2\.4s/);
    expect(css).toMatch(/\.dg-node\.s-running[^{]*\.dg-g[^{]*\{[^}]*animation/);
    expect(css).toMatch(/@keyframes dg-sweep/);
    expect(css).toMatch(/@keyframes dg-spin/);
  });

  test("blocked cards hatch with background-image (the base stays opaque) and pulse", () => {
    expect(css).toMatch(
      /\.dg-node\.s-blocked[^{]*\{[^}]*background-image:\s*repeating-linear-gradient/,
    );
    expect(css).toMatch(/@keyframes dg-alarm/);
    expect(css).toMatch(/\.dg-node\.s-blocked[^{]*\{[^}]*animation:[^;}]*dg-alarm/);
  });

  test("flow edges are animated live-blue dashes; stalled edges are still, red and dotted", () => {
    const flow = rule(/\.dg-edge\.dg-flow/).exec(css)?.[1] ?? "";
    expect(flow).toMatch(/stroke:\s*var\(--live\)/);
    expect(flow).toMatch(/stroke-dasharray/);
    expect(flow).toMatch(/animation:[^;]*dg-flow/);
    expect(css).toMatch(/@keyframes dg-flow/);
    const stalled = rule(/\.dg-edge\.dg-stalled/).exec(css)?.[1] ?? "";
    expect(stalled).toMatch(/stroke:\s*var\(--bad\)/);
    expect(stalled).toMatch(/stroke-dasharray:\s*2\s+5/);
    expect(stalled).not.toMatch(/animation/);
  });

  test("a dot is live-blue and dims with its edge", () => {
    expect(rule(/\.dg-dot/).exec(css)?.[1]).toMatch(/fill:\s*var\(--live\)/);
    expect(rule(/\.dg-dot\.dg-dim/).exec(css)?.[1]).toMatch(/opacity/);
  });

  test("a dimmed running or blocked card drops its glow", () => {
    expect(css).toMatch(/\.dg-node\.dg-dim\.s-running[^{]*\{[^}]*box-shadow:\s*none/);
  });

  test("reduced motion stops every animation and hides the dots; static states stay outside it", () => {
    const match = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css);
    expect(match).not.toBeNull();
    const block = match?.[1] ?? "";
    const before = css.slice(0, match?.index ?? 0);
    expect(block).toMatch(/\.dg-fx/);
    expect(block).toMatch(/\.dg-g/);
    expect(block).toMatch(/\.dg-edge\.dg-flow/);
    expect(block).toMatch(/animation:\s*none/);
    expect(block).toMatch(/\.dg-dot\s*\{[^}]*display:\s*none/);
    expect(block).not.toMatch(/box-shadow/);
    expect(block).not.toMatch(/background-image/);
    expect(block).not.toMatch(/\.dg-via/);
    expect(before).toMatch(/\.dg-via\s*\{/);
    expect(before).toMatch(/\.dg-node\.s-running[^{]*\{[^}]*box-shadow/);
    expect(before).toMatch(/background-image:\s*repeating-linear-gradient/);
  });

  test("the graph paints only through tokens and colour-mix", () => {
    expect(css).toMatch(/color-mix\(in srgb,\s*var\(--live\)/);
    expect(css).toMatch(/color-mix\(in srgb,\s*var\(--bad\)/);
    expect(css).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(css).not.toMatch(/\b(?:rgba?|hsla?)\(/);
  });

  test("every dg-* class of a live graph has a rule", () => {
    const { container } = mountLive();
    fireEvent.mouseEnter(cardOf(container, "g-06"));
    const dg = dgClasses(container);
    for (const c of ["dg-fx", "dg-flow", "dg-stalled", "dg-dot", "dg-via", "dg-held", "dg-sum"]) {
      expect(dg).toContain(c);
    }
    expect(dg.filter((c) => !hasRule(c))).toEqual([]);
  });
});

const variants = depGraphOf(
  [
    depGraphNode("out", 0, {
      outside: true,
      kind: "outside",
      state: undefined,
      open: false,
      status: "done",
    }),
    depGraphNode("done", 0, { closed: true, state: undefined, status: "done" }),
    depGraphNode("rej", 0, { closed: true, state: undefined, status: "rejected" }),
    depGraphNode("man", 1, { kind: "manual", state: undefined, status: "manual" }),
    depGraphNode("drift", 1, { openDeps: 1, priority: 1 }),
    depGraphNode("plain", 2, { priority: 3 }),
  ],
  [depGraphEdge("out", "drift"), depGraphEdge("drift", "plain")],
);

describe("<DepGraph/> — CSS", () => {
  const dimRules = () =>
    [...css.matchAll(/\.dg-node\.dg-dim\s*\{([^}]*)\}/g)].map((m) => m[1] ?? "");

  test("a dimmed card fades its content, never its own opaque background", () => {
    expect(css).toMatch(/\.dg-node\.dg-dim\s*>\s*\*\s*\{[^}]*opacity/);
    expect(dimRules().filter((b) => /opacity/.test(b))).toEqual([]);
  });

  test("a dimmed card also drops its critical outline", () => {
    expect(dimRules().some((b) => /box-shadow:\s*none/.test(b))).toBe(true);
  });

  test("no card rule paints a see-through background", () => {
    const rules = [...css.matchAll(/(\.dg-node[^{,]*)\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const m of rules) {
      const selector = (m[1] ?? "").trim();
      const bg = /background:\s*([^;}]*)/.exec(m[2] ?? "")?.[1] ?? "";
      if (bg !== "") {
        const fill =
          selector === ".dg-node.dg-sq"
            ? /→ var\(--proj, var\(--faint\)\)$/
            : /→ var\(--panel2?\)$/;
        expect(`${selector} → ${bg}`).toMatch(fill);
      }
    }
  });

  test("the critical path is drawn in the model colour, on cards and edges", () => {
    expect(css).toMatch(/\.dg-edge\.dg-crit\s*\{[^}]*stroke:\s*var\(--model\)/);
    expect(css).toMatch(/\.dg-node\.dg-crit\s*\{[^}]*var\(--model\)/);
  });

  test("manual and outside cards are dashed; a dimmed edge fades to .4", () => {
    expect(css).toMatch(/\.dg-node\.dg-manual\s*\{[^}]*dashed/);
    expect(css).toMatch(/\.dg-node\.dg-outside\s*\{[^}]*dashed/);
    expect(css).toMatch(/\.dg-edge\.dg-dim\s*\{[^}]*opacity:\s*0?\.4\b/);
    expect(css).toMatch(/\.dg-node\.dg-dim\s*>\s*\*\s*\{[^}]*opacity:\s*0?\.22\b/);
  });

  test("the graph's colours are tokens: the ink-prose title and no literal colour", () => {
    expect(css).toContain("color: var(--ink-prose)");
    expect(css).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(css).not.toMatch(/\b(?:rgba?|hsla?)\(/);
  });

  test("every dg-* class the component renders has a rule", () => {
    const mixed = mountGraph(variants);
    fireEvent.mouseEnter(cardOf(mixed.container, "drift"));
    const cqc = mount();
    const dg = dgClasses(mixed.container, cqc.container);
    for (const c of ["dg", "dg-node", "dg-edge", "dg-crit", "dg-dim"]) {
      expect(dg).toContain(c);
    }
    expect(dg.filter((c) => !hasRule(c))).toEqual([]);
  });
});

describe("<DepGraph/> — golden layout", () => {
  test("renders the golden cqc layout passed as a prop", () => {
    const { container } = render(
      <DepGraph graph={CQC_GRAPH} layout={CQC_LAYOUT} view={CQC_VIEW} onSelect={() => {}} />,
    );
    expect(cards(container).map((c) => c.getAttribute("data-id"))).toEqual(
      CQC_LAYOUT.nodes.map((n) => n.id),
    );
    for (const n of CQC_LAYOUT.nodes) {
      const style = cardOf(container, n.id).style;
      expect({ id: n.id, left: style.left, top: style.top }).toEqual({
        id: n.id,
        left: `${n.x}px`,
        top: `${n.y}px`,
      });
    }
  });
});

describe("<DepGraph/> — live state edge cases", () => {
  const running = (id: string, wave: number, o: Parameters<typeof depGraphNode>[2] = {}) =>
    depGraphNode(id, wave, { state: "running", status: "running", ...o });
  const blocked = (id: string, wave: number, o: Parameters<typeof depGraphNode>[2] = {}) =>
    depGraphNode(id, wave, { state: "blocked", status: "blocked", ...o });

  test("summary={false} drops the summary line even when the view has parts", () => {
    const { container } = render(
      <DepGraph
        graph={LIVE_GRAPH}
        layout={LIVE_LAYOUT}
        view={LIVE_VIEW}
        onSelect={() => {}}
        summary={false}
      />,
    );
    expect(container.querySelector(".dg-sum")).toBeNull();
    expect(cards(container)).toHaveLength(LIVE_GRAPH.nodes.length);
  });

  test("a card with no status text renders an empty .dg-st", () => {
    const g = depGraphOf([running("a", 1)], [], 1);
    const { container } = mountGraph(g, { statusText: new Map() });
    expect(stOf(container, "a")).toBe("");
  });

  test("a node both running and blocked flows, never stalls, and carries one overlay", () => {
    const g = depGraphOf([blocked("a", 1), depGraphNode("b", 2)], [depGraphEdge("a", "b")]);
    const live = { running: new Set(["a"]), blocked: new Set(["a"]), held: new Set<string>() };
    const { container } = mountGraph(g, { live });
    const e = edgeOf(container, "a", "b");
    expect(e.classList.contains("dg-flow")).toBe(true);
    expect(e.classList.contains("dg-stalled")).toBe(false);
    expect(cardOf(container, "a").querySelectorAll(".dg-fx")).toHaveLength(1);
    expect(dots(container)).toHaveLength(2);
  });

  test("a held card that neither runs nor is blocked has a badge but no overlay, and stalls its out-edge", () => {
    const g = depGraphOf(
      [
        blocked("a", 1, { label: "01" }),
        depGraphNode("b", 2, { heldBy: "01" }),
        depGraphNode("c", 3),
      ],
      [depGraphEdge("a", "b"), depGraphEdge("b", "c")],
      3,
    );
    const { container } = mountGraph(g);
    const b = cardOf(container, "b");
    expect(b.querySelector(".dg-fx")).toBeNull();
    expect(b.querySelector(".dg-via")?.textContent).toBe("⛔ via 01");
    expect(edgeOf(container, "b", "c").classList.contains("dg-stalled")).toBe(true);
    expect(dots(container)).toHaveLength(0);
  });

  test("a view with no live ids paints no overlay, flow, stall or dot", () => {
    const g = depGraphOf([running("a", 1), depGraphNode("b", 2)], [depGraphEdge("a", "b")]);
    const none = new Set<string>();
    const { container } = mountGraph(g, { live: { running: none, blocked: none, held: none } });
    expect(container.querySelector(".dg-fx")).toBeNull();
    expect(container.querySelector(".dg-flow, .dg-stalled")).toBeNull();
    expect(dots(container)).toHaveLength(0);
  });

  test("hovering a card the view has no lineage for dims nothing", () => {
    const g = depGraphOf([running("a", 1), depGraphNode("b", 2)], [depGraphEdge("a", "b")]);
    const { container } = mountGraph(g, { lineages: new Map() });
    fireEvent.mouseEnter(cardOf(container, "a"));
    expect(container.querySelector(".dg-dim, .dg-on")).toBeNull();
  });

  test("a dot loses its lit and dimmed marks again when the pointer leaves", () => {
    const g = depGraphOf(
      [running("a", 1), depGraphNode("b", 2), depGraphNode("z", 2)],
      [depGraphEdge("a", "b")],
    );
    const { container } = mountGraph(g);
    fireEvent.mouseEnter(cardOf(container, "z"));
    expect(dots(container).every((d) => d.classList.contains("dg-dim"))).toBe(true);
    fireEvent.mouseLeave(cardOf(container, "z"));
    expect(dots(container).some((d) => d.classList.contains("dg-dim"))).toBe(false);
    expect(dots(container).some((d) => d.classList.contains("dg-on"))).toBe(false);
  });

  test("a rejected running card keeps the ✕ glyph and still has its overlay", () => {
    const g = depGraphOf([running("a", 1, { status: "rejected" })], [], 1);
    const { container } = mountGraph(g);
    const c = cardOf(container, "a");
    expect(c.querySelector(".dg-g")?.textContent).toBe("✕");
    expect(c.firstElementChild?.classList.contains("dg-fx")).toBe(true);
  });

  test("a whitespace-only reason is carried as the blocked: line, not dropped", () => {
    const g = depGraphOf([blocked("a", 1, { reason: " " })], [], 1);
    const { container } = mountGraph(g);
    expect(cardOf(container, "a").getAttribute("title")).toBe("a — title of a\n\nblocked:  ");
  });

  test("a single summary part renders without a separator", () => {
    const g = depGraphOf([running("a", 1)], [], 1);
    const { container } = mountGraph(g, { summary: ["◌ 1 running"] });
    expect(container.querySelector(".dg-sum")?.textContent).toBe("◌ 1 running");
  });
});

const closedNode = (id: string, wave: number) =>
  depGraphNode(id, wave, { closed: true, state: undefined, status: "done", open: false });
const mountEntire = (graph: BacklogGraph) =>
  render(
    <DepGraph
      graph={graph}
      layout={depGraphLayout(graph)}
      view={depGraphView(graph)}
      onSelect={() => {}}
      entire
    />,
  );
const headsOf = (c: Element) =>
  Array.from(c.querySelectorAll(".dg-colh")).map((h) => h.textContent);

describe("<DepGraph/> — entire graph", () => {
  const ENTIRE = depGraphOf(
    [
      closedNode("e-00", 1),
      closedNode("e-01", 2),
      depGraphNode("e-02", 3),
      depGraphNode("e-03", 4),
    ],
    [
      depGraphEdge("e-00", "e-01", { met: true }),
      depGraphEdge("e-01", "e-02", { met: true }),
      depGraphEdge("e-02", "e-03"),
    ],
    4,
  );

  test("only the entire view carries dg-entire, the default view does not", () => {
    expect(
      mountEntire(ENTIRE).container.querySelector(".dg")?.classList.contains("dg-entire"),
    ).toBe(true);
    cleanup();
    expect(mount().container.querySelector(".dg")?.classList.contains("dg-entire")).toBe(false);
  });

  test("the entire view draws done→done edges and closed cards legibly enough to share", () => {
    expect(css).toMatch(
      /\.dg-entire\s+\.dg-edge\.dg-met:not\(\.dg-on\):not\(\.dg-crit\)\s*\{[^}]*stroke:\s*var\(--dim\)/,
    );
    expect(css).toMatch(/\.dg-entire\s+\.dg-node\.s-closed\s*>\s*\*\s*\{[^}]*opacity:\s*0?\.9\b/);
  });

  test("headers are exactly wave 1..n, with no sub-line", () => {
    const { container } = mountEntire(ENTIRE);
    expect(headsOf(container)).toEqual(
      Array.from({ length: ENTIRE.maxWave }, (_, i) => `wave ${i + 1}`),
    );
  });

  test("closed cards are present and muted, and every edge is drawn", () => {
    const { container } = mountEntire(ENTIRE);
    expect(cardOf(container, "e-00").classList.contains("s-closed")).toBe(true);
    expect(cards(container)).toHaveLength(ENTIRE.nodes.length);
    expect(paths(container)).toHaveLength(ENTIRE.edges.length);
  });

  test("an outside dep renders in wave 1 with no done / outside column", () => {
    const g = depGraphOf(
      [
        depGraphNode("elsewhere-9", 1, {
          outside: true,
          kind: "outside",
          state: undefined,
          open: false,
          status: "done",
        }),
        depGraphNode("t-01", 2),
      ],
      [depGraphEdge("elsewhere-9", "t-01")],
    );
    const { container } = mountEntire(g);
    expect(headsOf(container)).toEqual(["wave 1", "wave 2"]);
    expect(cards(container)).toHaveLength(2);
    expect(container.textContent).not.toContain("done / outside");
    expect(container.textContent).not.toContain("fires now");
  });

  test("the default view of the same rows still has a done / outside column", () => {
    const g = depGraphOf(
      [
        depGraphNode("elsewhere-9", 0, {
          outside: true,
          kind: "outside",
          state: undefined,
          open: false,
          status: "done",
        }),
        depGraphNode("t-01", 1),
      ],
      [depGraphEdge("elsewhere-9", "t-01")],
    );
    expect(mountGraph(g).container.textContent).toContain("done / outside");
  });
});

const twoProjects = depGraphOf(
  [
    depGraphNode("a-01", 1, { project: "alpha" }),
    depGraphNode("b-01", 2, { project: "beta" }),
    depGraphNode("b-02", 3, { project: "beta" }),
  ],
  [depGraphEdge("a-01", "b-01", { cross: true }), depGraphEdge("b-01", "b-02")],
  3,
);
const projectColors: ReadonlyMap<string, string> = new Map([
  ["alpha", "proj-0"],
  ["beta", "proj-1"],
]);
const twoMulti: DepGraphMulti = { projects: 2, colors: projectColors };
const mountMulti = (over: Partial<DepGraphProps> = {}) =>
  render(
    <DepGraph
      graph={twoProjects}
      layout={depGraphLayout(twoProjects)}
      view={depGraphView(twoProjects, { summary: ["2 projects", "1 cross-project"] })}
      onSelect={() => {}}
      multi={twoMulti}
      {...over}
    />,
  );

describe("<DepGraph/> — multi-project marks", () => {
  test("cards carry a stripe in the project colour and the project name", () => {
    const { container } = mountMulti();
    const stripe = (id: string) => cardOf(container, id).firstElementChild as HTMLElement;
    expect(stripe("a-01").className).toBe("dg-stripe proj-0");
    expect(stripe("b-01").className).toBe("dg-stripe proj-1");
    expect(stripe("a-01").style.background).toBe("");
    expect(stOf(container, "a-01")?.startsWith("alpha · ")).toBe(true);
    expect(stOf(container, "b-02")?.startsWith("beta · ")).toBe(true);
  });

  test("cross edges carry dg-cross and others do not", () => {
    const { container } = mountMulti();
    expect(edgeOf(container, "a-01", "b-01").classList.contains("dg-cross")).toBe(true);
    expect(edgeOf(container, "b-01", "b-02").classList.contains("dg-cross")).toBe(false);
  });

  test("the summary reads the project and cross-project counts", () => {
    const { container } = mountMulti();
    expect(container.querySelector(".dg-sum")?.textContent).toBe("2 projects · 1 cross-project");
  });

  test("summary={false} renders no summary line, the default renders it", () => {
    expect(mountMulti({ summary: false }).container.querySelector(".dg-sum")).toBeNull();
    cleanup();
    expect(mountMulti().container.querySelector(".dg-sum")).not.toBeNull();
  });

  test("without multi the markup carries no marks", () => {
    const { container } = mountGraph(twoProjects);
    expect(container.querySelector(".dg-stripe")).toBeNull();
    expect(container.querySelector(".dg-cross")).toBeNull();
    expect(container.querySelector(".dg-sum")).toBeNull();
    expect(stOf(container, "a-01")).not.toContain("·");
  });

  test("css draws cross edges in --live at 55 % (a color-mix) and keeps the lineage rules", () => {
    expect(/\.dg-edge\.dg-cross\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /color-mix\(in srgb, var\(--live\) 55%, transparent\)/,
    );
    expect(/\.dg-stripe\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(/width:\s*3px/);
    expect(css.indexOf(".dg-edge.dg-cross")).toBeLessThan(css.indexOf(".dg-edge.dg-on"));
  });
});

const lanedLayout: GraphLayout = {
  ...depGraphLayout(twoProjects),
  lanes: [
    { project: "alpha", y: 0, h: 70 },
    { project: "beta", y: 70, h: 140 },
  ],
};
const lanedView = depGraphView(twoProjects, { bands: ["dg-band even", "dg-band odd"] });

describe("<DepGraph/> — swimlane bands", () => {
  test("one .dg-lane per band, alternating shades, before the svg", () => {
    const { container } = render(
      <DepGraph
        graph={twoProjects}
        layout={lanedLayout}
        view={lanedView}
        onSelect={() => {}}
        multi={twoMulti}
      />,
    );
    const lanes = Array.from(container.querySelectorAll<HTMLElement>(".dg-lane"));
    const svg = container.querySelector(".dg-svg");
    expect(lanes).toHaveLength(2);
    expect(svg).not.toBeNull();
    lanes.forEach((lane, i) => {
      const band = lanedLayout.lanes?.[i];
      expect(lane.style.top).toBe(`${band?.y}px`);
      expect(lane.style.height).toBe(`${band?.h}px`);
      expect(lane.style.width).toBe(`${lanedLayout.width}px`);
      expect(lane.dataset.lane).toBe(band?.project ?? "");
      expect(lane.className).toBe(`dg-lane ${i === 0 ? "dg-band even" : "dg-band odd"}`);
      expect(lane.style.background).toBe("");
      expect(lane.compareDocumentPosition(svg as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });

  test("without lanes there is no .dg-lane", () => {
    const { container } = mountMulti();
    expect(container.querySelector(".dg-lane")).toBeNull();
  });
});

const collapse = (layout: GraphLayout, ids: readonly string[]): GraphLayout => ({
  ...layout,
  nodes: layout.nodes.map((n) =>
    ids.includes(n.id) ? { ...n, w: 12, h: 12, collapsed: true as const } : n,
  ),
});
const mountSquares = (
  graph: BacklogGraph,
  collapsed: readonly string[],
  over: Partial<DepGraphProps> = {},
) =>
  render(
    <DepGraph
      graph={graph}
      layout={collapse(depGraphLayout(graph), collapsed)}
      view={depGraphView(graph)}
      onSelect={() => {}}
      multi={twoMulti}
      {...over}
    />,
  );
const dimmed = (c: Element) =>
  cards(c)
    .filter((n) => n.classList.contains("dg-dim"))
    .map((n) => n.dataset.id ?? "")
    .sort();

describe("<DepGraph/> — collapsed squares", () => {
  const A = depGraphOf(
    [
      depGraphNode("a-01", 1, { project: "alpha" }),
      depGraphNode("a-02", 2, { project: "alpha" }),
      depGraphNode("b-01", 2, { project: "beta", reason: "waiting on review" }),
      depGraphNode("b-02", 3, { project: "beta" }),
    ],
    [
      depGraphEdge("a-01", "a-02"),
      depGraphEdge("a-01", "b-01", { cross: true }),
      depGraphEdge("b-01", "b-02"),
    ],
    3,
  );
  const squaresA = ["a-01", "a-02"];

  test("renders a .dg-sq button with the project colour and its section class", () => {
    const { container } = mountSquares(A, squaresA);
    const sq = cardOf(container, "a-01");
    expect(sq.classList.contains("dg-sq")).toBe(true);
    expect(sq.children).toHaveLength(0);
    expect(sq.textContent).toBe("");
    expect(sq.style.width).toBe("12px");
    expect(sq.style.height).toBe("12px");
    expect(sq.classList.contains("proj-0")).toBe(true);
    expect(sq.style.background).toBe("");
    expect(sq.classList.contains("s-waiting")).toBe(true);
    const card = cardOf(container, "b-01");
    expect(card.classList.contains("dg-sq")).toBe(false);
    expect(card.style.width).toBe("212px");
  });

  test("a collapsed square with no project colour carries no proj class and no inline background", () => {
    const { container } = mountSquares(A, squaresA, { multi: { projects: 2, colors: new Map() } });
    const sq = cardOf(container, "a-01");
    expect(Array.from(sq.classList).some((c) => c.startsWith("proj-"))).toBe(false);
    expect(sq.style.background).toBe("");
  });

  test("the tooltip carries project · kind · status and the title", () => {
    const { container } = mountSquares(A, squaresA);
    const [first, second] = (cardOf(container, "a-01").getAttribute("title") ?? "").split("\n");
    expect(first).toMatch(/^alpha · ticket · \S/);
    expect(second).toBe("a-01 — title of a-01");
  });

  test("clicking a square calls onSelect with its id", () => {
    const picked: string[] = [];
    const { container } = mountSquares(A, squaresA, { onSelect: (id) => picked.push(id) });
    fireEvent.click(cardOf(container, "a-01"));
    expect(picked).toEqual(["a-01"]);
  });

  test("hovering a square lights its lineage and dims the rest", () => {
    const { container } = mountSquares(A, squaresA);
    fireEvent.mouseEnter(cardOf(container, "a-02"));
    expect(dimmed(container)).toEqual(["b-01", "b-02"]);
    expect(
      paths(container)
        .filter((p) => p.classList.contains("dg-on"))
        .map((p) => `${endOf(p, 0)}>${endOf(p, 1)}`),
    ).toEqual(["a-01>a-02"]);
    fireEvent.mouseLeave(cardOf(container, "a-02"));
    expect(container.querySelectorAll(".dg-dim, .dg-on")).toHaveLength(0);
  });

  const B = depGraphOf(
    [
      depGraphNode("a", 1, { project: "alpha", critical: true }),
      depGraphNode("b", 2, {
        project: "alpha",
        state: "blocked",
        status: "blocked",
        reason: "needs a key",
      }),
      depGraphNode("c", 2, { project: "alpha", kind: "epic" }),
      depGraphNode("d", 3, { project: "beta" }),
    ],
    [depGraphEdge("a", "b", { critical: true }), depGraphEdge("b", "d")],
    3,
  );
  const squaresB = ["a", "b", "c"];

  test("a square keeps dg-crit, dg-focus and its status class", () => {
    const { container } = mountSquares(B, squaresB, { focus: "a" });
    const a = cardOf(container, "a");
    expect(a.classList.contains("dg-sq")).toBe(true);
    expect(a.classList.contains("dg-crit")).toBe(true);
    expect(a.classList.contains("dg-focus")).toBe(true);
    expect(a.classList.contains("s-waiting")).toBe(true);
    expect(cardOf(container, "b").classList.contains("s-blocked")).toBe(true);
    expect(cardOf(container, "c").classList.contains("dg-focus")).toBe(false);
  });

  test("the tooltip of a blocked square ends with the reason", () => {
    const { container } = mountSquares(B, squaresB);
    expect(cardOf(container, "b").getAttribute("title")).toContain(
      "b — title of b\n\nblocked: needs a key",
    );
  });

  test("the tooltip type segment follows the node's kind", () => {
    const { container } = mountSquares(B, squaresB);
    expect(cardOf(container, "c").getAttribute("title")).toMatch(/^alpha · epic · /);
    expect(cardOf(container, "a").getAttribute("title")).toMatch(/^alpha · ticket · /);
  });

  test("a square with no colour entry has no project class, so it falls back to --faint", () => {
    const { container } = mountSquares(B, squaresB, {
      multi: { projects: 2, colors: new Map([["beta", "proj-1"]]) },
    });
    const sq = cardOf(container, "a");
    expect(Array.from(sq.classList).some((c) => c.startsWith("proj-"))).toBe(false);
    expect(sq.style.background).toBe("");
    expect(css).toMatch(/\.dg-node\.dg-sq\s*\{[^}]*var\(--proj,\s*var\(--faint\)\)/);
  });

  test("every square is a button and selects its own id", () => {
    const picked: string[] = [];
    const { container } = mountSquares(B, squaresB, { onSelect: (id) => picked.push(id) });
    for (const id of squaresB) {
      const sq = cardOf(container, id);
      expect(sq.tagName).toBe("BUTTON");
      expect(sq.getAttribute("type")).toBe("button");
      fireEvent.click(sq);
    }
    expect(picked).toEqual(["a", "b", "c"]);
  });

  test("lineage crosses between a card and squares", () => {
    const { container } = mountSquares(B, squaresB);
    fireEvent.mouseEnter(cardOf(container, "d"));
    expect(dimmed(container)).toEqual(["c"]);
    fireEvent.mouseLeave(cardOf(container, "d"));
    fireEvent.mouseEnter(cardOf(container, "a"));
    expect(dimmed(container)).toEqual(["c"]);
    expect(cardOf(container, "d").classList.contains("dg-dim")).toBe(false);
  });

  test("a critical edge into a square keeps both marks while hovered", () => {
    const { container } = mountSquares(B, squaresB);
    fireEvent.mouseEnter(cardOf(container, "b"));
    const e = edgeOf(container, "a", "b");
    expect(e.classList.contains("dg-on")).toBe(true);
    expect(e.classList.contains("dg-crit")).toBe(true);
  });

  test("without multi a collapsed layout still renders squares", () => {
    const { container } = mountSquares(B, squaresB, { multi: undefined });
    expect(container.querySelectorAll(".dg-node.dg-sq")).toHaveLength(3);
    expect(cardOf(container, "a").getAttribute("title")).toContain(" · ticket · ");
  });
});

const searched = (
  graph: BacklogGraph,
  hitIds: readonly string[],
  over: Partial<DepGraphView> = {},
) => depGraphView(graph, { searching: true, hits: new Set(hitIds), ...over });
const idsWith = (c: Element, klass: string): readonly string[] =>
  Array.from(c.querySelectorAll<HTMLElement>(`.dg-node.${klass}`))
    .map((n) => n.dataset.id ?? "")
    .sort();
const edgesWith = (c: Element, klass: string): readonly string[] =>
  Array.from(c.querySelectorAll<SVGPathElement>(`path.dg-edge.${klass}`))
    .map((p) => `${endOf(p, 0)}>${endOf(p, 1)}`)
    .sort();
const dimDots = (c: Element) => dots(c).filter((d) => d.classList.contains("dg-dim"));
const mountView = (
  graph: BacklogGraph,
  view: DepGraphView,
  over: Partial<DepGraphProps> = {},
  layout: GraphLayout = depGraphLayout(graph),
) => render(<DepGraph graph={graph} layout={layout} view={view} onSelect={() => {}} {...over} />);

const SEARCH = depGraphOf(
  [
    depGraphNode("adw-product-40", 1),
    depGraphNode("adw-product-41", 1, { critical: true }),
    depGraphNode("adw-other-1", 1),
    depGraphNode("adw-product-42", 2),
    depGraphNode("adw-other-2", 2),
  ],
  [
    depGraphEdge("adw-product-40", "adw-product-42"),
    depGraphEdge("adw-product-41", "adw-product-42"),
    depGraphEdge("adw-other-1", "adw-other-2"),
    depGraphEdge("adw-product-41", "adw-other-2"),
  ],
);
const PRODUCT = ["adw-product-40", "adw-product-41", "adw-product-42"];
const OTHER = ["adw-other-1", "adw-other-2"];

describe("<DepGraph/> — search lighting", () => {
  test("hits get dg-hit, every other node dg-dim; edges dim unless both ends hit", () => {
    const { container } = mountView(SEARCH, searched(SEARCH, PRODUCT));
    expect(idsWith(container, "dg-hit")).toEqual(PRODUCT);
    expect(idsWith(container, "dg-dim")).toEqual(OTHER);
    expect(edgesWith(container, "dg-dim")).toEqual([
      "adw-other-1>adw-other-2",
      "adw-product-41>adw-other-2",
    ]);
    expect(container.querySelectorAll(".dg-edge.dg-hit")).toHaveLength(0);
  });

  test("a view that is not searching lights and dims nothing", () => {
    const { container } = mountView(SEARCH, depGraphView(SEARCH));
    expect(container.querySelectorAll(".dg-hit, .dg-dim")).toHaveLength(0);
  });

  test("collapsed squares light and dim the same way", () => {
    const g = depGraphOf(
      SEARCH.nodes.map((n) => ({ ...n, project: "alpha" })),
      SEARCH.edges,
    );
    const layout = collapse(
      depGraphLayout(g),
      g.nodes.map((n) => n.id),
    );
    const { container } = mountView(g, searched(g, PRODUCT), { multi: twoMulti }, layout);
    expect(container.querySelectorAll(".dg-node.dg-sq")).toHaveLength(5);
    expect(idsWith(container, "dg-hit")).toEqual(PRODUCT);
    expect(idsWith(container, "dg-dim")).toEqual(OTHER);
  });

  test("hover lineage wins while hovered; the search lighting returns on leave", () => {
    const view = searched(SEARCH, PRODUCT);
    const { container } = mountView(SEARCH, view);
    fireEvent.mouseEnter(cardOf(container, "adw-other-1"));
    const lineage = view.lineages.get("adw-other-1") ?? new Set<string>();
    expect(container.querySelectorAll(".dg-hit")).toHaveLength(0);
    expect(idsWith(container, "dg-dim")).toEqual(
      SEARCH.nodes
        .map((n) => n.id)
        .filter((id) => !lineage.has(id))
        .sort(),
    );
    expect(idsWith(container, "dg-dim")).toEqual(PRODUCT);
    fireEvent.mouseLeave(cardOf(container, "adw-other-1"));
    expect(idsWith(container, "dg-hit")).toEqual(PRODUCT);
    expect(idsWith(container, "dg-dim")).toEqual(OTHER);
  });

  test("dg-hit coexists with dg-focus and dg-crit on one node", () => {
    const { container } = mountView(SEARCH, searched(SEARCH, ["adw-product-41"]), {
      focus: "adw-product-41",
    });
    const c = cardOf(container, "adw-product-41");
    for (const k of ["dg-hit", "dg-focus", "dg-crit"]) expect(c.classList.contains(k)).toBe(true);
  });

  test("the hit style is its own: not the critical orange nor the focus blue", () => {
    const body = /\.dg-node\.dg-hit\s*\{([^}]*)\}/.exec(css)?.[1];
    expect(body).toBeDefined();
    expect(body).not.toContain("var(--model)");
    expect(body).not.toContain("var(--live)");
  });

  const G = depGraphOf(
    [
      depGraphNode("run-1", 1, { state: "running", status: "running" }),
      depGraphNode("run-2", 2),
      depGraphNode("x-1", 2, { project: "sabado" }),
    ],
    [depGraphEdge("run-1", "run-2"), depGraphEdge("run-1", "x-1")],
  );

  test("a query matching nothing dims every node, edge and flow dot, and lights none", () => {
    const { container } = mountView(G, searched(G, []));
    expect(idsWith(container, "dg-dim")).toEqual(["run-1", "run-2", "x-1"]);
    expect(idsWith(container, "dg-hit")).toEqual([]);
    expect(container.querySelectorAll("path.dg-edge.dg-dim")).toHaveLength(2);
    expect(dots(container)).toHaveLength(4);
    expect(dimDots(container)).toHaveLength(4);
  });

  test("flow dots dim unless both ends of their edge are hits", () => {
    const { container } = mountView(G, searched(G, ["run-1", "run-2"]));
    expect(dots(container)).toHaveLength(4);
    expect(dimDots(container)).toHaveLength(2);
  });

  test("a re-render with a new view re-lights the graph, and clearing restores it", () => {
    const layout = depGraphLayout(G);
    const el = (view: DepGraphView) => (
      <DepGraph graph={G} layout={layout} view={view} onSelect={() => {}} />
    );
    const out = render(el(depGraphView(G)));
    out.rerender(el(searched(G, ["x-1"])));
    expect(idsWith(out.container, "dg-hit")).toEqual(["x-1"]);
    expect(idsWith(out.container, "dg-dim")).toEqual(["run-1", "run-2"]);
    out.rerender(el(depGraphView(G)));
    expect(out.container.querySelectorAll(".dg-hit, .dg-dim")).toHaveLength(0);
  });

  test("hovering a hit while searching shows its lineage, not the search lighting", () => {
    const { container } = mountView(G, searched(G, ["run-2"]));
    fireEvent.mouseEnter(cardOf(container, "run-2"));
    expect(container.querySelectorAll(".dg-hit")).toHaveLength(0);
    expect(idsWith(container, "dg-dim")).toEqual(["x-1"]);
    fireEvent.mouseLeave(cardOf(container, "run-2"));
    expect(idsWith(container, "dg-hit")).toEqual(["run-2"]);
  });

  test("a node is lit iff its id is in view.hits, whatever its project or kind", () => {
    const byProject = mountView(G, searched(G, ["x-1"]));
    expect(idsWith(byProject.container, "dg-hit")).toEqual(["x-1"]);
    cleanup();
    const g = depGraphOf(
      [
        depGraphNode("elsewhere-9", 1, {
          outside: true,
          kind: "outside",
          state: undefined,
          open: false,
          status: "done",
        }),
        depGraphNode("t-01", 2),
      ],
      [depGraphEdge("elsewhere-9", "t-01")],
    );
    const { container } = mountView(g, searched(g, ["elsewhere-9"]));
    expect(idsWith(container, "dg-hit")).toEqual(["elsewhere-9"]);
    expect(idsWith(container, "dg-dim")).toEqual(["t-01"]);
    for (const c of cards(container)) expect(c.textContent).not.toContain("undefined");
  });
});

describe("<DepGraph/> — small graphs", () => {
  test("an empty graph renders an empty frame without throwing", () => {
    const { container } = mountGraph(depGraphOf([], [], 0));
    expect(container.querySelector(".dg")).not.toBeNull();
    expect(cards(container)).toHaveLength(0);
    expect(paths(container)).toHaveLength(0);
    expect(container.querySelectorAll(".dg-colh")).toHaveLength(0);
  });

  test("a card with no edges dims every other card when hovered", () => {
    const g = depGraphOf(
      [depGraphNode("a", 1), depGraphNode("b", 1), depGraphNode("c", 2)],
      [depGraphEdge("a", "c")],
    );
    const { container } = mountGraph(g);
    fireEvent.mouseEnter(cardOf(container, "b"));
    expect(cardOf(container, "b").classList.contains("dg-dim")).toBe(false);
    expect(dimmed(container)).toEqual(["a", "c"]);
    expect(paths(container).every((p) => p.classList.contains("dg-dim"))).toBe(true);
  });

  test("a long title stays whole in the DOM; the ellipsis is the CSS's job", () => {
    const title = "very ".repeat(60).trim();
    const { container } = mountGraph(depGraphOf([depGraphNode("t", 1, { title })], [], 1));
    expect(cardOf(container, "t").querySelector(".dg-title")?.textContent).toBe(title);
    expect(css).toMatch(/\.dg-title\s*\{[^}]*text-overflow:\s*ellipsis/);
  });

  test("the drift badge counts every open dep", () => {
    const { container } = mountGraph(depGraphOf([depGraphNode("t", 1, { openDeps: 3 })], [], 1));
    expect(cardOf(container, "t").textContent).toContain("⚠ 3 dep open");
  });

  test("manual and outside cards carry their dashed classes; closed is s-closed; rejected is ✕", () => {
    const { container } = mountGraph(variants);
    expect(idsWith(container, "dg-manual")).toEqual(["man"]);
    expect(idsWith(container, "dg-outside")).toEqual(["out"]);
    const done = cardOf(container, "done");
    expect(done.classList.contains("s-closed")).toBe(true);
    expect(done.querySelector(".dg-g")?.textContent).toBe(SECTION_GLYPH.closed);
    expect(cardOf(container, "rej").querySelector(".dg-g")?.textContent).toBe("✕");
  });

  test("the drift badge reads ⚠ n dep open, only when openDeps > 0", () => {
    const { container } = mountGraph(variants);
    expect(cardOf(container, "drift").textContent).toContain("⚠ 1 dep open");
    expect(cardOf(container, "plain").textContent).not.toContain("⚠");
  });

  test("a card with no state that is not closed is s-other with the other glyph", () => {
    const { container } = mountGraph(variants);
    const man = cardOf(container, "man");
    expect(man.classList.contains("s-other")).toBe(true);
    expect(man.querySelector(".dg-g")?.textContent).toBe(SECTION_GLYPH.other);
  });

  test("hovering lights exactly the lineage's edges, and nothing is lit at rest", () => {
    const { container } = mount();
    expect(container.querySelectorAll(".dg-on")).toHaveLength(0);
    fireEvent.mouseEnter(cardOf(container, "cqc-be-04"));
    const lineage = CQC_VIEW.lineages.get("cqc-be-04") ?? new Set<string>();
    for (const p of paths(container)) {
      const inside = lineage.has(endOf(p, 0)) && lineage.has(endOf(p, 1));
      expect(p.classList.contains("dg-on")).toBe(inside);
      expect(p.classList.contains("dg-dim")).toBe(!inside);
    }
    fireEvent.mouseLeave(cardOf(container, "cqc-be-04"));
    expect(container.querySelectorAll(".dg-on")).toHaveLength(0);
  });

  test("a critical card outside the hovered lineage is dimmed but stays critical", () => {
    const g = depGraphOf(
      [depGraphNode("a", 1, { critical: true }), depGraphNode("b", 1, { critical: true })],
      [],
      1,
    );
    const { container } = mountGraph(g);
    fireEvent.mouseEnter(cardOf(container, "a"));
    const b = cardOf(container, "b");
    expect(b.classList.contains("dg-dim")).toBe(true);
    expect(b.classList.contains("dg-crit")).toBe(true);
  });
});

describe("<DepGraph/> — class coverage of the entire, multi, laned, squares and search groups", () => {
  test("every dg-* class they render has a rule", () => {
    const multi = mountMulti();
    const laned = render(
      <DepGraph
        graph={twoProjects}
        layout={lanedLayout}
        view={lanedView}
        onSelect={() => {}}
        multi={twoMulti}
      />,
    );
    const squares = mountView(
      twoProjects,
      depGraphView(twoProjects),
      { multi: twoMulti },
      collapse(depGraphLayout(twoProjects), ["a-01"]),
    );
    const hit = mountView(SEARCH, searched(SEARCH, PRODUCT));
    const dg = dgClasses(multi.container, laned.container, squares.container, hit.container);
    for (const c of ["dg-stripe", "dg-cross", "dg-lane", "dg-band", "dg-sq", "dg-hit", "dg-sum"]) {
      expect(dg).toContain(c);
    }
    expect(dg.filter((c) => !hasRule(c))).toEqual([]);
  });
});

describe("<DepGraph/> — hardening: degenerate inputs", () => {
  const G = depGraphOf(
    [
      depGraphNode("run-1", 1, { state: "running", status: "running" }),
      depGraphNode("run-2", 2),
      depGraphNode("x-1", 2, { project: "sabado" }),
    ],
    [depGraphEdge("run-1", "run-2"), depGraphEdge("run-1", "x-1")],
  );

  test("the entire view never reads done / outside, even for a wave 0 column", () => {
    const g = depGraphOf(
      [closedNode("z-0", 0), depGraphNode("z-1", 1)],
      [depGraphEdge("z-0", "z-1")],
      1,
    );
    const { container } = mountEntire(g);
    expect(headsOf(container)).toEqual(["wave 0", "wave 1"]);
    expect(container.textContent).not.toContain("done / outside");
    expect(container.textContent).not.toContain("fires now");
  });

  test("with multi, a project with no colour entry has no stripe but keeps its name in .dg-st", () => {
    const { container } = mountMulti({
      multi: { projects: 2, colors: new Map([["beta", "proj-1"]]) },
    });
    expect(cardOf(container, "a-01").querySelector(".dg-stripe")).toBeNull();
    expect(stOf(container, "a-01")?.startsWith("alpha · ")).toBe(true);
    expect(cardOf(container, "b-01").querySelector(".dg-stripe")).not.toBeNull();
  });

  test("with multi, a node with no project has no stripe and no project prefix", () => {
    const g = depGraphOf([depGraphNode("n-1", 1), depGraphNode("a-01", 1, { project: "alpha" })]);
    const { container } = mountView(g, depGraphView(g), { multi: twoMulti });
    expect(cardOf(container, "n-1").querySelector(".dg-stripe")).toBeNull();
    expect(stOf(container, "n-1")).not.toContain("·");
    expect(cardOf(container, "a-01").querySelector(".dg-stripe")).not.toBeNull();
  });

  test("an empty lanes array draws no lane", () => {
    const { container } = mountView(
      twoProjects,
      lanedView,
      { multi: twoMulti },
      { ...lanedLayout, lanes: [] },
    );
    expect(container.querySelector(".dg-lane")).toBeNull();
  });

  test("a square whose reason is empty has no blocked suffix in its tooltip", () => {
    const g = depGraphOf([
      depGraphNode("s-1", 1, { project: "alpha", state: "blocked", status: "blocked", reason: "" }),
    ]);
    const { container } = mountView(
      g,
      depGraphView(g),
      { multi: twoMulti },
      collapse(depGraphLayout(g), ["s-1"]),
    );
    const title = cardOf(container, "s-1").getAttribute("title") ?? "";
    expect(title).not.toContain("blocked:");
    expect(title.split("\n")).toHaveLength(2);
  });

  test("a running square keeps its section class and draws no card furniture", () => {
    const { container } = mountView(G, depGraphView(G), {}, collapse(depGraphLayout(G), ["run-1"]));
    const sq = cardOf(container, "run-1");
    expect(sq.classList.contains("s-running")).toBe(true);
    expect(sq.querySelector(".dg-fx, .dg-top, .dg-title")).toBeNull();
  });

  test("hovering a lit square drops its dg-hit, and leaving restores it", () => {
    const g = depGraphOf(
      [depGraphNode("p-1", 1, { project: "alpha" }), depGraphNode("p-2", 2, { project: "alpha" })],
      [depGraphEdge("p-1", "p-2")],
    );
    const { container } = mountView(
      g,
      searched(g, ["p-1"]),
      { multi: twoMulti },
      collapse(depGraphLayout(g), ["p-1", "p-2"]),
    );
    expect(idsWith(container, "dg-hit")).toEqual(["p-1"]);
    fireEvent.mouseEnter(cardOf(container, "p-1"));
    expect(container.querySelectorAll(".dg-hit")).toHaveLength(0);
    fireEvent.mouseLeave(cardOf(container, "p-1"));
    expect(idsWith(container, "dg-hit")).toEqual(["p-1"]);
  });

  test("hits naming ids that are not in the graph light and dim nothing extra", () => {
    const { container } = mountView(G, searched(G, ["ghost", "run-1"]));
    expect(idsWith(container, "dg-hit")).toEqual(["run-1"]);
    expect(idsWith(container, "dg-dim")).toEqual(["run-2", "x-1"]);
  });

  test("when every node is a hit nothing is dimmed, not a node, an edge nor a dot", () => {
    const { container } = mountView(G, searched(G, ["run-1", "run-2", "x-1"]));
    expect(idsWith(container, "dg-hit")).toEqual(["run-1", "run-2", "x-1"]);
    expect(container.querySelectorAll(".dg-dim")).toHaveLength(0);
  });

  test("hovering an id with no lineage entry leaves the search lighting in place", () => {
    const { container } = mountView(G, searched(G, ["run-2"], { lineages: new Map() }));
    fireEvent.mouseEnter(cardOf(container, "run-1"));
    expect(idsWith(container, "dg-hit")).toEqual(["run-2"]);
    expect(idsWith(container, "dg-dim")).toEqual(["run-1", "x-1"]);
    expect(container.querySelectorAll(".dg-on")).toHaveLength(0);
  });

  test("flow dots follow the hovered lineage: lit on its edge, dimmed on the others", () => {
    const { container } = mountView(G, depGraphView(G));
    fireEvent.mouseEnter(cardOf(container, "run-2"));
    const all = dots(container);
    expect(all).toHaveLength(4);
    expect(all.filter((d) => d.classList.contains("dg-on"))).toHaveLength(2);
    expect(dimDots(container)).toHaveLength(2);
    fireEvent.mouseLeave(cardOf(container, "run-2"));
    expect(container.querySelectorAll("circle.dg-on, circle.dg-dim")).toHaveLength(0);
  });
});
