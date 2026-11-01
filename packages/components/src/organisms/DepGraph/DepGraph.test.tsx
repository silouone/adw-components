// `<DepGraph/>`: cards, columns, critical path, hover lineage, click and focus over literal inputs
// (the cqc graph, its golden layout and its view). The live-state, search, multi-project, laned,
// collapsed and entire-view groups of the factory test are not yet ported (see the build report).

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  CQC_GRAPH,
  CQC_LAYOUT,
  CQC_LAYOUT_HIDING_DONE,
  CQC_VIEW,
} from "../../../fixtures/DepGraph";
import { SECTION_GLYPH } from "../../glyphs";
import { DepGraph, type DepGraphProps } from "./DepGraph";

afterEach(cleanup);

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
