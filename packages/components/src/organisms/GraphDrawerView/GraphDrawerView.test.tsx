// `<GraphDrawerView/>` renders from a view model: the zoom, the pan flag and the refs arrive as
// props, and every press is a callback. Literal inputs from the fixtures; the four snapshots pin
// the drawer's markup for a plain, an entire, an empty and a focused selection.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { createRef } from "preact";
import {
  GRAPH_DRAWER,
  GRAPH_DRAWER_EMPTY,
  GRAPH_DRAWER_FEATURED,
  GRAPH_DRAWER_LABELS,
  GRAPH_DRAWER_LANED,
  GRAPH_DRAWER_RIGHT,
  GRAPH_DRAWER_SEARCHING,
} from "../../../fixtures/GraphDrawerView";
import { GraphDrawerView, type GraphDrawerViewProps } from "./GraphDrawerView";

afterEach(cleanup);

const mount = (over: Partial<GraphDrawerViewProps> = {}) => {
  const calls = {
    onSelect: mock((_id: string) => {}),
    onFeature: mock((_name: string) => {}),
    onToggleProject: mock((_name: string) => {}),
    onSoleProject: mock((_name: string) => {}),
    onToggleLane: mock((_project: string) => {}),
    onCollapseAll: mock(() => {}),
    onClose: mock(() => {}),
    onQuery: mock((_q: string) => {}),
    onFocus: mock((_id: string) => {}),
    onShowDone: mock(() => {}),
    onEntire: mock(() => {}),
    onLanes: mock(() => {}),
    onDock: mock((_dock: string) => {}),
    onPreset: mock((_preset: string) => {}),
    onZoomOut: mock(() => {}),
    onZoomReset: mock(() => {}),
    onZoomIn: mock(() => {}),
    onFit: mock(() => {}),
    onResizeStart: mock((_e: PointerEvent) => {}),
    onPanStart: mock((_e: PointerEvent) => {}),
    onFeatureOpen: mock(() => {}),
    onFeatureClose: mock(() => {}),
  };
  const refs = {
    canvasRef: createRef<HTMLDivElement>(),
    searchRef: createRef<HTMLInputElement>(),
    featureRef: createRef<HTMLSpanElement>(),
  };
  const out = render(
    <GraphDrawerView
      view={GRAPH_DRAWER}
      labels={GRAPH_DRAWER_LABELS}
      query=""
      focus={undefined}
      zoom={1}
      panning={false}
      featureOpen={false}
      {...refs}
      {...calls}
      {...over}
    />,
  );
  return { ...out, calls, refs };
};

const drawer = (c: Element) => c.querySelector("aside.bl-gd") as HTMLElement;
const html = (c: Element): string => drawer(c).outerHTML;
const act$ = (c: Element, act: string) => c.querySelector(`[data-act="${act}"]`) as HTMLElement;

describe("<GraphDrawerView/> — the shell", () => {
  test("a bottom dock spans the width left of the panel, at the given height", () => {
    const { container } = mount({ view: { ...GRAPH_DRAWER, panelPx: 100 } });
    expect(drawer(container).className).toBe("bl-gd dock-bottom");
    const s = drawer(container).style;
    expect([s.left, s.right, s.height]).toEqual(["0px", "100px", "346px"]);
  });

  test("a right dock spans the height, stopping short of the panel, at the given width", () => {
    const { container } = mount({ view: GRAPH_DRAWER_RIGHT });
    expect(drawer(container).className).toBe("bl-gd dock-right");
    const s = drawer(container).style;
    expect([s.top, s.bottom, s.right, s.width]).toEqual(["0px", "0px", "320px", "520px"]);
  });

  test("the head shows the title and the legend closes the drawer's body", () => {
    const { container } = mount();
    expect(container.querySelector(".bl-gd-title")?.textContent).toBe("⎇ graph");
    expect(container.querySelector(".bl-gd-legend")?.textContent).toContain("critical path");
  });

  test("a press on the handle reports through onResizeStart", () => {
    const { container, calls } = mount();
    fireEvent.pointerDown(container.querySelector(".bl-gd-drag") as HTMLElement);
    expect(calls.onResizeStart).toHaveBeenCalledTimes(1);
  });

  test("the close button reports through onClose", () => {
    const { container, calls } = mount();
    fireEvent.click(container.querySelector(".bl-gd-x") as HTMLElement);
    expect(calls.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("<GraphDrawerView/> — chips, docks and sizes", () => {
  const chip = (c: Element, name: string) =>
    c.querySelector(`[data-gproj="${name}"]`) as HTMLButtonElement;

  test("a chip is on when selected and dim and disabled when outside the feature", () => {
    const { container } = mount({ view: GRAPH_DRAWER_FEATURED });
    expect(chip(container, "cqc-be").className).toBe("bl-gd-chip on");
    expect(chip(container, "cqc-be").textContent).toBe("cqc-be 9");
    expect(chip(container, "courses").className).toBe("bl-gd-chip dim");
    expect(chip(container, "courses").disabled).toBe(true);
  });

  test("a click sets the project alone; a shift-click toggles it", () => {
    const { container, calls } = mount();
    fireEvent.click(chip(container, "courses"));
    expect(calls.onSoleProject).toHaveBeenCalledWith("courses");
    fireEvent.click(chip(container, "courses"), { shiftKey: true });
    expect(calls.onToggleProject).toHaveBeenCalledWith("courses");
    expect(calls.onSoleProject).toHaveBeenCalledTimes(1);
  });

  test("the docked side is marked on, and a click reports the other", () => {
    const { container, calls } = mount();
    const on = [...container.querySelectorAll("[data-dock].on")].map((b) =>
      b.getAttribute("data-dock"),
    );
    expect(on).toEqual(["bottom"]);
    expect(container.querySelector('[data-dock="right"]')?.textContent).toBe("◨ right");
    fireEvent.click(container.querySelector('[data-dock="right"]') as HTMLElement);
    expect(calls.onDock).toHaveBeenCalledWith("right");
  });

  test("the stored preset is marked on; a dragged size marks none; a click reports the preset", () => {
    const { container, calls } = mount();
    expect(container.querySelector("[data-size].on")?.getAttribute("data-size")).toBe("narrow");
    fireEvent.click(container.querySelector('[data-size="wide"]') as HTMLElement);
    expect(calls.onPreset).toHaveBeenCalledWith("wide");
    cleanup();
    const dragged = mount({ view: GRAPH_DRAWER_RIGHT });
    expect(dragged.container.querySelector("[data-size].on")).toBeNull();
  });
});

describe("<GraphDrawerView/> — the feature menu and the lanes", () => {
  test("the feature menu is in the head only when there is a feature tree", () => {
    expect(mount().container.querySelector("[data-gfeature]")).toBeNull();
    cleanup();
    const { container } = mount({ view: GRAPH_DRAWER_FEATURED });
    expect(container.querySelector("[data-gfeature]")).not.toBeNull();
  });

  test("the lanes toggle is for a multi-project selection only", () => {
    expect(mount().container.querySelector("[data-glanes]")).toBeNull();
    cleanup();
    const { container, calls } = mount({ view: GRAPH_DRAWER_LANED });
    const toggle = container.querySelector("[data-glanes]") as HTMLElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(calls.onLanes).toHaveBeenCalledTimes(1);
  });

  test("collapse all reads expand all when every lane is folded, and reports onCollapseAll", () => {
    const { container, calls } = mount({ view: GRAPH_DRAWER_LANED });
    const all = container.querySelector("[data-gcollapse]") as HTMLElement;
    expect(all.textContent).toBe("collapse all");
    fireEvent.click(all);
    expect(calls.onCollapseAll).toHaveBeenCalledTimes(1);
    cleanup();
    const folded = mount({ view: { ...GRAPH_DRAWER_LANED, allFolded: true } });
    expect(folded.container.querySelector("[data-gcollapse]")?.textContent).toBe("expand all");
  });

  test("a laned canvas draws the name column and the summary outside the zoom", () => {
    const { container } = mount({ view: GRAPH_DRAWER_LANED });
    expect(container.querySelector(".dg-lanenames")).not.toBeNull();
    expect(container.querySelector(".bl-gd-sum")?.textContent).toBe(
      "✕ 1 blocked · ⛔ 9 held behind a block",
    );
  });

  test("a plain canvas has no name column and no summary line", () => {
    const { container } = mount();
    expect(container.querySelector(".dg-lanenames")).toBeNull();
    expect(container.querySelector(".bl-gd-sum")).toBeNull();
  });
});

describe("<GraphDrawerView/> — the canvas", () => {
  test("the zoom shows as a percentage and scales the graph", () => {
    const { container } = mount({ zoom: 0.5 });
    expect(act$(container, "reset").textContent).toBe("50%");
    expect((container.querySelector(".bl-gc-scale") as HTMLElement).style.transform).toBe(
      "scale(0.5)",
    );
    expect((container.querySelector(".bl-gc-size") as HTMLElement).style.width).toBe("960px");
  });

  test("a laned canvas keeps its gutter on screen: the scale is shifted by the lost width", () => {
    const { container } = mount({ view: GRAPH_DRAWER_LANED, zoom: 0.5 });
    expect((container.querySelector(".bl-gc-scale") as HTMLElement).style.transform).toBe(
      "translate(84px, 0) scale(0.5)",
    );
  });

  test("the zoom buttons report out, reset, in and fit", () => {
    const { container, calls } = mount();
    fireEvent.click(act$(container, "out"));
    fireEvent.click(act$(container, "reset"));
    fireEvent.click(act$(container, "in"));
    fireEvent.click(act$(container, "fit"));
    expect(calls.onZoomOut).toHaveBeenCalledTimes(1);
    expect(calls.onZoomReset).toHaveBeenCalledTimes(1);
    expect(calls.onZoomIn).toHaveBeenCalledTimes(1);
    expect(calls.onFit).toHaveBeenCalledTimes(1);
    expect(act$(container, "fit").title).toBe("fit (f)");
  });

  test("done and entire report their flip; entire disables done", () => {
    const { container, calls } = mount();
    fireEvent.click(act$(container, "done"));
    fireEvent.click(act$(container, "entire"));
    expect(calls.onShowDone).toHaveBeenCalledTimes(1);
    expect(calls.onEntire).toHaveBeenCalledTimes(1);
    expect(act$(container, "done").getAttribute("aria-pressed")).toBe("true");
    expect(act$(container, "done").hasAttribute("disabled")).toBe(false);
    cleanup();
    const entire = mount({ view: { ...GRAPH_DRAWER, entire: true } });
    expect(act$(entire.container, "done").hasAttribute("disabled")).toBe(true);
    expect(act$(entire.container, "entire").getAttribute("aria-pressed")).toBe("true");
  });

  test("panning marks the canvas, and a press on it reports through onPanStart", () => {
    const idle = mount();
    expect(idle.container.querySelector(".bl-gc")?.className).toBe("bl-gc");
    fireEvent.pointerDown(idle.container.querySelector(".bl-gc") as HTMLElement);
    expect(idle.calls.onPanStart).toHaveBeenCalledTimes(1);
    cleanup();
    const panning = mount({ panning: true });
    expect(panning.container.querySelector(".bl-gc")?.className).toBe("bl-gc panning");
  });

  test("the refs reach the scroller and the search box", () => {
    const { container, refs } = mount();
    expect(refs.canvasRef.current).toBe(container.querySelector(".bl-gc"));
    expect(refs.searchRef.current).toBe(act$(container, "search") as HTMLInputElement);
  });

  test("a card click reports its id through onSelect", () => {
    const { container, calls } = mount();
    fireEvent.click(container.querySelector('.dg-node[data-id="cqc-be-04"]') as HTMLElement);
    expect(calls.onSelect).toHaveBeenCalledWith("cqc-be-04");
  });

  test("the focused card is marked", () => {
    const { container } = mount({ focus: "cqc-be-04" });
    expect(container.querySelector('.dg-node[data-id="cqc-be-04"]')?.className).toContain(
      "dg-focus",
    );
  });
});

describe("<GraphDrawerView/> — the search", () => {
  test("typing reports the query; the box shows the shared query", () => {
    const { container, calls } = mount({ query: "04" });
    const box = act$(container, "search") as HTMLInputElement;
    expect(box.value).toBe("04");
    fireEvent.input(box, { target: { value: "045" } });
    expect(calls.onQuery).toHaveBeenCalledWith("045");
  });

  test("Enter focuses the next hit and Shift+Enter the previous one", () => {
    const view = {
      ...GRAPH_DRAWER_SEARCHING,
      canvas: { ...GRAPH_DRAWER_SEARCHING.canvas, nextFwd: "cqc-be-04", nextBack: "cqc-be-02" },
    };
    const { container, calls } = mount({ view, query: "0" });
    fireEvent.keyDown(act$(container, "search"), { key: "Enter" });
    expect(calls.onFocus).toHaveBeenLastCalledWith("cqc-be-04");
    fireEvent.keyDown(act$(container, "search"), { key: "Enter", shiftKey: true });
    expect(calls.onFocus).toHaveBeenLastCalledWith("cqc-be-02");
  });

  test("Enter with no hit to go to reports nothing", () => {
    const { container, calls } = mount({ query: "zz" });
    fireEvent.keyDown(act$(container, "search"), { key: "Enter" });
    expect(calls.onFocus).not.toHaveBeenCalled();
  });

  test("the hit count shows only while searching", () => {
    expect(act$(mount().container, "hits")).toBeNull();
    cleanup();
    const { container } = mount({ view: GRAPH_DRAWER_SEARCHING, query: "04" });
    expect(act$(container, "hits").textContent).toBe("1 hit");
  });
});

describe("<GraphDrawerView/> — an empty selection", () => {
  test("a note replaces the bar and the canvas, and the head and legend stay", () => {
    const { container } = mount({ view: GRAPH_DRAWER_EMPTY });
    expect(container.querySelector(".bl-gd-empty")?.textContent).toBe(
      "no dependency graph for empty",
    );
    expect(container.querySelector(".bl-gc")).toBeNull();
    expect(container.querySelector(".bl-gd-bar")).toBeNull();
    expect(container.querySelector(".bl-gd-head")).not.toBeNull();
    expect(container.querySelector(".bl-gd-legend")).not.toBeNull();
  });
});

describe("<GraphDrawerView/> — snapshots", () => {
  test("one project", () => {
    const { container } = mount();
    expect(html(container)).toMatchSnapshot();
  });

  test("entire", () => {
    const { container } = mount({ view: { ...GRAPH_DRAWER, entire: true } });
    expect(html(container)).toMatchSnapshot();
  });

  test("empty", () => {
    const { container } = mount({ view: GRAPH_DRAWER_EMPTY });
    expect(html(container)).toMatchSnapshot();
  });

  test("a focus", () => {
    const { container } = mount({ focus: "cqc-be-04" });
    expect(html(container)).toMatchSnapshot();
  });
});
