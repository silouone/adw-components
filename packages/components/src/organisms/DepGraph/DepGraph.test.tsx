// `<DepGraph/>`: cards, columns, critical path, hover lineage, click, focus, live state, CSS and the
// golden layout over literal inputs. The search, multi-project, laned, collapsed and entire-view
// groups of the factory test are not yet ported (see the build report).

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
import { DepGraph, type DepGraphProps } from "./DepGraph";

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

describe("<DepGraph/> — CSS", () => {
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
