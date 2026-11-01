// `<FocusRail/>`: rail 2 — one icon per focus tab, a host for the focus panel.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { FOCUS_RAIL_LABELS, FOCUS_RAIL_TABS } from "../../../fixtures/FocusRail";
import { FocusRail, type FocusRailProps } from "./FocusRail";

afterEach(cleanup);

const draw = (over: Partial<FocusRailProps> = {}) => {
  const log: string[] = [];
  const props: FocusRailProps = {
    selected: "sabado-276-strip-tags",
    tab: "run",
    open: false,
    tabs: FOCUS_RAIL_TABS,
    labels: FOCUS_RAIL_LABELS,
    onFocusTab: (tab) => log.push(`tab:${tab}`),
    onFocusOpen: (open) => log.push(`open:${open}`),
    ...over,
  };
  const view = render(<FocusRail {...props} />);
  const tabEl = (id: string) =>
    view.container.querySelector(`[data-tab="${id}"]`) as HTMLButtonElement;
  return { ...view, log, tabEl, props };
};

describe("<FocusRail/> — the strip", () => {
  test("the seven tabs, glyphs only, labels in the tooltips", () => {
    const { container } = draw();
    const nav = container.querySelector("nav.rail.rail2.strip") as HTMLElement;
    expect(nav.getAttribute("data-rail")).toBe("focus");
    expect(nav.getAttribute("aria-label")).toBe("focus");
    const tiles = [...nav.querySelectorAll(".tile")];
    expect(tiles.map((t) => t.textContent)).toEqual(["◉", "∿", "⊟", "⚒", "$", "⇶", "⇥"]);
    expect(tiles.map((t) => t.getAttribute("title"))).toEqual([
      "run",
      "walk",
      "gates",
      "tools",
      "cost",
      "route",
      "result",
    ]);
  });

  test("without a selection every icon is disabled and dimmed", () => {
    const { container } = draw({ selected: null });
    const all = [...container.querySelectorAll("button")] as HTMLButtonElement[];
    expect(all).toHaveLength(8);
    for (const b of all) {
      expect(b.disabled).toBe(true);
      expect(b.classList.contains("dim")).toBe(true);
    }
  });

  test("a click on a disabled icon reports nothing", () => {
    const { tabEl, container, log } = draw({ selected: null });
    fireEvent.click(tabEl("cost"));
    fireEvent.click(container.querySelector(".toggle") as Element);
    expect(log).toEqual([]);
  });

  test("with a selection the icons are live, and $ records the cost tab and opens the panel", () => {
    const { tabEl, container, log } = draw();
    for (const b of container.querySelectorAll("button")) {
      expect((b as HTMLButtonElement).disabled).toBe(false);
      expect(b.classList.contains("dim")).toBe(false);
    }
    fireEvent.click(tabEl("cost"));
    expect(log).toEqual(["tab:cost", "open:true"]);
  });

  test("each of the seven tabs records itself and opens the panel", () => {
    const { tabEl, log } = draw();
    for (const t of FOCUS_RAIL_TABS) fireEvent.click(tabEl(t.id));
    expect(log).toEqual(FOCUS_RAIL_TABS.flatMap((t) => [`tab:${t.id}`, "open:true"]));
  });

  test("the strip tints exactly one tab, the active one", () => {
    const { container } = draw({ tab: "gates" });
    const on = [...container.querySelectorAll(".tile.on")];
    expect(on).toHaveLength(1);
    expect(on[0]?.getAttribute("data-tab")).toBe("gates");
  });

  test("the ◨ button opens the panel when there is a selection", () => {
    const { container, log } = draw();
    const toggle = container.querySelector(".toggle") as HTMLElement;
    expect(toggle.textContent).toBe("◨");
    expect(toggle.getAttribute("title")).toBe("open the focus panel");
    fireEvent.click(toggle);
    expect(log).toEqual(["open:true"]);
  });

  test("selected moving from null to a ticket un-dims every icon", () => {
    const { rerender, container, props } = draw({ selected: null });
    expect(container.querySelectorAll(".dim")).toHaveLength(8);
    rerender(<FocusRail {...props} selected="sabado-276-strip-tags" />);
    expect(container.querySelectorAll(".dim")).toHaveLength(0);
  });
});

describe("<FocusRail/> — open", () => {
  test("open renders a panel with only the ◨ close, which closes it", () => {
    const { container, log } = draw({ open: true });
    const aside = container.querySelector("aside.rail.rail2.panel") as HTMLElement;
    expect(aside.getAttribute("data-rail")).toBe("focus");
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(1);
    const close = aside.querySelector(".toggle") as HTMLElement;
    expect(close.getAttribute("title")).toBe("close");
    fireEvent.click(close);
    expect(log).toEqual(["open:false"]);
  });

  test("the open panel carries no tab icons", () => {
    expect(draw({ open: true }).container.querySelector("[data-tab]")).toBeNull();
  });

  test("open with a panel renders it inside the aside and no close of its own", () => {
    const { container } = draw({ open: true, panel: <p class="hosted">hosted</p> });
    expect(container.querySelector("aside .hosted")?.textContent).toBe("hosted");
    expect(container.querySelector(".toggle")).toBeNull();
  });

  test("the open rail carries rail-dense; the closed strip does not", () => {
    expect(
      draw({ open: true }).container.querySelector("aside")?.classList.contains("rail-dense"),
    ).toBe(true);
    cleanup();
    expect(draw().container.querySelector("nav")?.classList.contains("rail-dense")).toBe(false);
  });
});
