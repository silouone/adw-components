// `<LaneNames/>` tests: the sticky name column of a laned graph — a bar in the project
// colour, the name, and done/total + epic — and how it degrades as a band shrinks on screen.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  banded,
  COLORS,
  FOLDED_LAYOUT,
  LABELS,
  LAYOUT,
  NO_LANES,
  OUTSIDE,
  STATS,
  VIEW,
} from "../../../fixtures/LaneNames";
import { LaneNames, type LaneNamesProps, laneDetail } from "./LaneNames";

afterEach(cleanup);

const base: LaneNamesProps = {
  layout: LAYOUT,
  view: VIEW,
  stats: STATS,
  labels: LABELS,
  colors: COLORS,
  zoom: 1,
  collapsed: [],
  onToggle: () => {},
};

const mount = (over: Partial<LaneNamesProps> = {}): Element =>
  render(<LaneNames {...base} {...over} />).container;

const cell = (c: Element, project: string) => {
  const el = c.querySelector<HTMLElement>(`.dg-lanename[data-lane="${project}"]`);
  if (el === null) throw new Error(`no name cell ${project}`);
  return el;
};

const toggleOf = (c: Element, project: string) => {
  const btn = cell(c, project).querySelector<HTMLElement>(".dg-lanetoggle");
  if (btn === null) throw new Error(`no toggle ${project}`);
  return btn;
};

// the mode a band renders in: `b` = a name, `s` = a sub-line
const modeOf = (c: Element, project: string) => {
  const el = cell(c, project);
  return `${el.querySelector("b") === null ? "-" : "b"}${el.querySelector("span") === null ? "-" : "s"}`;
};

describe("<LaneNames/>", () => {
  const view = () =>
    render(
      <div class="bl-gc-size">
        <div class="bl-gc-scale" />
        <LaneNames {...base} />
      </div>,
    );

  test("a band reads ▾ project / 0/34 done · epic mooc-00", () => {
    const el = cell(view().container, "courses");
    expect(el.querySelector("b")?.textContent).toBe("▾ courses");
    expect(el.querySelector("span")?.textContent).toBe("0/34 done · epic mooc-00");
  });

  test("a project without an epic reads done/total only", () => {
    expect(cell(view().container, "api-content").querySelector("span")?.textContent).toBe(
      "2/3 done",
    );
  });

  test("a 3px bar in the project colour", () => {
    const bar = cell(view().container, "courses").querySelector<HTMLElement>(".dg-lanebar");
    expect(bar?.style.background).toBe("");
    expect(bar?.getAttribute("class")).toBe("dg-lanebar proj-0");
  });

  test("the outside band's bar has no project class and no inline background", () => {
    const bar = cell(view().container, OUTSIDE).querySelector<HTMLElement>(".dg-lanebar");
    expect(bar?.getAttribute("class")).toBe("dg-lanebar");
    expect(bar?.style.background).toBe("");
  });

  test("the outside band shows just its name", () => {
    const el = cell(view().container, OUTSIDE);
    expect(el.querySelector("b")?.textContent).toBe(OUTSIDE);
    expect(el.querySelector("span")).toBeNull();
  });

  test("the column is sticky left 0 and outside .bl-gc-scale", () => {
    const { container } = view();
    const wrap = container.querySelector<HTMLElement>(".bl-gc-names");
    expect(wrap?.style.position).toBe("sticky");
    expect(wrap?.style.left).toBe("0px");
    expect(container.querySelector(".bl-gc-scale .bl-gc-names")).toBeNull();
  });

  test("a cell sits at its band's top and height", () => {
    const { container } = view();
    for (const b of LAYOUT.lanes ?? []) {
      const el = cell(container, b.project);
      expect(el.style.top).toBe(`${b.y}px`);
      expect(el.style.height).toBe(`${b.h}px`);
    }
  });
});

describe("<LaneNames/> — hardening", () => {
  test("the column is not scaled: fixed width, height follows the zoom", () => {
    for (const zoom of [0.31, 0.5, 1]) {
      const inner = mount({ zoom }).querySelector<HTMLElement>(".dg-lanenames");
      expect(inner?.style.transform).toBe("");
      expect(inner?.style.width).toBe("168px");
      expect(inner?.style.height).toBe(`${LAYOUT.height * zoom}px`);
    }
  });

  test("cells alternate the two band shades", () => {
    const c = mount();
    const shades = (LAYOUT.lanes ?? []).map((b) => cell(c, b.project).classList.contains("even"));
    expect(shades).toEqual([true, false, true]);
  });

  test("a project without a colour or stats still renders its name", () => {
    const el = cell(mount({ stats: new Map(), colors: new Map() }), "courses");
    expect(el.querySelector("b")?.textContent).toBe("▾ courses");
    expect(el.querySelector("span")).toBeNull();
    expect(el.querySelector(".dg-lanebar")?.getAttribute("class")).toBe("dg-lanebar");
  });

  test("a layout with no lanes renders no cells", () => {
    expect(mount({ layout: NO_LANES }).querySelectorAll(".dg-lanename")).toHaveLength(0);
  });

  test("the wrapper ignores the pointer but the cells take it", () => {
    const c = mount();
    expect(c.querySelector<HTMLElement>(".bl-gc-names")?.style.pointerEvents).toBe("none");
    for (const el of c.querySelectorAll<HTMLElement>(".dg-lanename")) {
      expect(el.style.pointerEvents).toBe("auto");
    }
  });

  test("a zero-row project reads 0/0 done", () => {
    const c = mount({ stats: new Map([["courses", { done: 0, total: 0, epic: undefined }]]) });
    expect(c.querySelector('.dg-lanename[data-lane="courses"] span')?.textContent).toBe("0/0 done");
  });
});

describe("<LaneNames/> — collapse toggle", () => {
  test("collapsed reads ▸ project, expanded ▾ project", () => {
    const c = mount({ collapsed: ["courses"] });
    expect(cell(c, "courses").querySelector("b")?.textContent).toBe("▸ courses");
    expect(cell(c, "courses").classList.contains("dg-collapsed")).toBe(true);
    expect(cell(c, "courses").classList.contains("dg-lanename-folded")).toBe(true);
    expect(cell(c, "api-content").querySelector("b")?.textContent).toBe("▾ api-content");
    expect(cell(c, "api-content").classList.contains("dg-collapsed")).toBe(false);
  });

  test("clicking the name calls onToggle with the project", () => {
    const toggled: string[] = [];
    const c = mount({ onToggle: (p) => toggled.push(p) });
    expect(toggleOf(c, "api-content").getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggleOf(c, "api-content"));
    expect(toggled).toEqual(["api-content"]);
  });

  test("the outside band is not collapsible", () => {
    const el = cell(mount({ collapsed: [OUTSIDE] }), OUTSIDE);
    expect(el.querySelector("button")).toBeNull();
    expect(el.querySelector("b")?.textContent).toBe(OUTSIDE);
    expect(el.classList.contains("dg-collapsed")).toBe(false);
  });

  test("a collapsed band is aria-expanded=false and a click toggles it back", () => {
    const toggled: string[] = [];
    const c = mount({ collapsed: ["courses"], onToggle: (p) => toggled.push(p) });
    const btn = toggleOf(c, "courses");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("type")).toBe("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(toggled).toEqual(["courses", "courses"]);
  });

  test("each button reports its own project", () => {
    const toggled: string[] = [];
    const c = mount({ onToggle: (p) => toggled.push(p) });
    for (const p of ["api-content", "courses"]) fireEvent.click(toggleOf(c, p));
    expect(toggled).toEqual(["api-content", "courses"]);
  });

  test("unknown collapsed names change no cell", () => {
    const c = mount({ collapsed: ["ghost"] });
    expect(c.querySelectorAll(".dg-collapsed")).toHaveLength(0);
    expect(cell(c, "courses").querySelector("b")?.textContent).toBe("▾ courses");
  });

  test("a collapsed cell keeps its stats line and colour bar", () => {
    const el = cell(mount({ collapsed: ["courses"], layout: FOLDED_LAYOUT }), "courses");
    expect(el.querySelector("span")?.textContent).toBe("0/34 done · epic mooc-00");
    expect(el.querySelector<HTMLElement>(".dg-lanebar")).not.toBeNull();
  });

  test("the cell height follows the collapsed band", () => {
    const c = mount({ collapsed: ["courses"], layout: FOLDED_LAYOUT });
    const band = FOLDED_LAYOUT.lanes?.find((b) => b.project === "courses");
    expect(cell(c, "courses").style.height).toBe(`${band?.h}px`);
    const expanded = LAYOUT.lanes?.find((b) => b.project === "courses");
    expect(band?.h).toBeLessThan(expanded?.h ?? 0);
  });

  test("clicking the outside name does nothing", () => {
    const toggled: string[] = [];
    const c = mount({ collapsed: [OUTSIDE], onToggle: (p) => toggled.push(p) });
    fireEvent.click(cell(c, OUTSIDE).querySelector("b") as Element);
    expect(toggled).toEqual([]);
  });
});

describe("<LaneNames/> — readable at any zoom", () => {
  test("name 11px and sub-line 10px at zoom 0.31 and 1", () => {
    for (const zoom of [0.31, 1]) {
      const el = cell(mount({ zoom, layout: banded([400, 400, 400]) }), "courses");
      const name = el.querySelector<HTMLElement>("b");
      const sub = el.querySelector<HTMLElement>("span");
      if (name === null || sub === null) throw new Error("no text");
      expect(name.style.fontSize).toBe("11px");
      expect(sub.style.fontSize).toBe("10px");
      cleanup();
    }
  });

  test("a cell sits at its band's scaled top and height", () => {
    for (const zoom of [0.31, 1]) {
      const l = banded([400, 300, 200]);
      const c = mount({ zoom, layout: l });
      for (const b of l.lanes ?? []) {
        const el = cell(c, b.project);
        expect(el.style.top).toBe(`${b.y * zoom}px`);
        expect(el.style.height).toBe(`${b.h * zoom}px`);
      }
      expect(cell(c, "courses").querySelector("b")).not.toBeNull();
      cleanup();
    }
  });

  test("a short band drops the sub-line", () => {
    const el = cell(mount({ layout: banded([20, 20, 20]) }), "courses");
    expect(el.querySelector("b")?.textContent).toBe("▾ courses");
    expect(el.querySelector("span")).toBeNull();
    expect(el.querySelector(".dg-lanebar")).not.toBeNull();
  });

  test("a short band keeps its name inside the band", () => {
    const c = mount({ layout: banded([12, 20, 20]) });
    expect(cell(c, "courses").querySelector<HTMLElement>("b")?.style.lineHeight).toBe("12px");
    expect(cell(c, "api-content").querySelector<HTMLElement>("b")?.style.lineHeight).toBe("14px");
  });

  test("a tiny band renders only the bar with the text in title", () => {
    const c = mount({ layout: banded([8, 8, 8]) });
    const el = cell(c, "courses");
    expect(el.querySelector("b")).toBeNull();
    expect(el.querySelector("span")).toBeNull();
    expect(el.querySelector("button")).toBeNull();
    expect(el.querySelector(".dg-lanebar")).not.toBeNull();
    expect(el.getAttribute("title")).toBe("▾ courses\n0/34 done · epic mooc-00");
    expect(cell(c, OUTSIDE).getAttribute("title")).toBe(OUTSIDE);
  });

  test("a tiny band without stats titles just the name", () => {
    const c = mount({ layout: banded([8, 8, 8]), stats: new Map() });
    expect(cell(c, "courses").getAttribute("title")).toBe("▾ courses");
  });

  test("laneDetail: bar under 10, name under 30, full from 30", () => {
    expect(laneDetail(9.9)).toBe("bar");
    expect(laneDetail(10)).toBe("name");
    expect(laneDetail(29.9)).toBe("name");
    expect(laneDetail(30)).toBe("full");
  });

  test("a folded band at low zoom keeps its working toggle", () => {
    const toggled: string[] = [];
    const c = mount({
      zoom: 0.31,
      layout: banded([38 / 0.31, 400]),
      collapsed: ["courses"],
      onToggle: (p) => toggled.push(p),
    });
    const btn = cell(c, "courses").querySelector<HTMLElement>("button");
    if (btn === null) throw new Error("no toggle");
    fireEvent.click(btn);
    expect(toggled).toEqual(["courses"]);
  });
});

describe("<LaneNames/> — readable at any zoom, hardening", () => {
  const mountAt = (zoom: number, hs: readonly number[], over: Partial<LaneNamesProps> = {}) =>
    mount({ zoom, layout: banded(hs), ...over });

  test("laneDetail: zero and negative heights are bar-only", () => {
    expect(laneDetail(0)).toBe("bar");
    expect(laneDetail(-5)).toBe("bar");
    expect(laneDetail(Number.POSITIVE_INFINITY)).toBe("full");
  });

  test("a zero-height band renders only the bar", () => {
    const el = cell(mountAt(1, [0, 100]), "courses");
    expect(el.style.height).toBe("0px");
    expect(el.querySelector("b")).toBeNull();
    expect(el.querySelector(".dg-lanebar")).not.toBeNull();
  });

  test("the rendered mode flips exactly at the thresholds", () => {
    const at = (h: number) => {
      const mode = modeOf(mountAt(1, [h, 100]), "courses");
      cleanup();
      return mode;
    };
    expect(at(9.99)).toBe("--");
    expect(at(10)).toBe("b-");
    expect(at(29.99)).toBe("b-");
    expect(at(30)).toBe("bs");
  });

  test("the same band degrades as the zoom drops", () => {
    const at = (zoom: number) => {
      const mode = modeOf(mountAt(zoom, [100, 100]), "courses");
      cleanup();
      return mode;
    };
    expect(at(1)).toBe("bs");
    expect(at(0.2)).toBe("b-");
    expect(at(0.09)).toBe("--");
  });

  test("full and name modes carry no title", () => {
    const c = mountAt(1, [100, 20]);
    expect(cell(c, "courses").getAttribute("title")).toBeNull();
    expect(cell(c, "api-content").getAttribute("title")).toBeNull();
  });

  test("a folded tiny band titles with ▸", () => {
    const c = mountAt(1, [6, 100], { collapsed: ["courses"] });
    expect(cell(c, "courses").getAttribute("title")).toBe("▸ courses\n0/34 done · epic mooc-00");
  });

  test("a tiny band without an epic titles done/total only", () => {
    const c = mountAt(1, [100, 6]);
    expect(cell(c, "api-content").getAttribute("title")).toBe("▾ api-content\n2/3 done");
  });

  test("the outside band is a plain name in name mode, no button", () => {
    const el = cell(mountAt(1, [100, 100, 20]), OUTSIDE);
    expect(el.querySelector("b")?.textContent).toBe(OUTSIDE);
    expect(el.querySelector("button")).toBeNull();
    expect(el.querySelector("span")).toBeNull();
  });

  test("a tall band without stats has the name only", () => {
    const el = cell(mountAt(1, [400, 400], { stats: new Map() }), "courses");
    expect(el.querySelector("b")).not.toBeNull();
    expect(el.querySelector("span")).toBeNull();
  });

  test("padding plus line stay inside the band across heights", () => {
    for (let h = 10; h <= 80; h += 0.5) {
      const el = cell(mountAt(1, [h, 200]), "courses");
      const name = el.querySelector<HTMLElement>("b");
      const sub = el.querySelector("span");
      const line = Number.parseFloat(name?.style.lineHeight ?? "0");
      const subH = sub === null ? 0 : 14;
      // the default 8px padding applies when no inline padding is set
      const top = el.style.paddingTop === "" ? 8 : Number.parseFloat(el.style.paddingTop);
      const bottom = el.style.paddingBottom === "" ? 8 : Number.parseFloat(el.style.paddingBottom);
      expect(top + bottom + line + subH).toBeLessThanOrEqual(h + 1e-9);
      cleanup();
    }
  });

  test("cells stay clickable and the wrapper stays inert at a tiny zoom", () => {
    const c = mountAt(0.05, [400, 400, 400]);
    expect(c.querySelector<HTMLElement>(".bl-gc-names")?.style.pointerEvents).toBe("none");
    expect(cell(c, "courses").style.pointerEvents).toBe("auto");
  });
});
