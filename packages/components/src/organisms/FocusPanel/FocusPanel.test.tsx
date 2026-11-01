// `<FocusPanel/>`: the panel — tab row, header, action bar and the active tab, whose body the
// registry (`./focusTabs`) renders. Literal view models; building the view from a ticket card,
// the status line from its outcome and the tab views from the run are the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import type { FocusTab } from "../../glyphs";
import {
  FOCUS_BODIES,
  FOCUS_BODY_CLASS,
  FOCUS_PANEL,
  FOCUS_PANEL_BARE,
  FOCUS_PANEL_BLOCKED,
  FOCUS_PANEL_GREEN,
  FOCUS_PANEL_LABELS,
  FULL_ID,
  focusPanelOn,
} from "../../../fixtures/FocusPanel";
import { COST_TAB } from "../../../fixtures/CostTab";
import { RESULT_TAB_MERGED } from "../../../fixtures/ResultTab";
import { FocusPanel, type FocusPanelProps } from "./FocusPanel";
import { FOCUS_TAB_RENDERERS, focusBodyOf } from "./focusTabs";

afterEach(cleanup);

const panel = (over: Partial<FocusPanelProps> = {}) =>
  render(
    <FocusPanel
      view={FOCUS_PANEL}
      labels={FOCUS_PANEL_LABELS}
      token="tok"
      onFocusTab={() => {}}
      onFocusOpen={() => {}}
      onAction={async () => undefined}
      onCopy={() => {}}
      onStage={() => {}}
      {...over}
    >
      {focusBodyOf(FOCUS_BODIES[(over.view ?? FOCUS_PANEL).tab])}
    </FocusPanel>,
  ).container;

const tabBtn = (c: Element, k: string) => c.querySelector(`[data-tab="${k}"]`) as HTMLButtonElement;

describe("<FocusPanel/> — tab row", () => {
  test("seven tabs, icon over label, the close last", () => {
    const c = panel();
    const row = c.querySelector(".fp-tabs") as Element;
    const tabs = [...row.querySelectorAll("[data-tab]")];
    expect(tabs.map((t) => t.getAttribute("data-tab"))).toEqual([
      "run",
      "walk",
      "gates",
      "tools",
      "cost",
      "route",
      "result",
    ]);
    expect(tabs[0]?.textContent).toBe("◉Run");
    expect(tabs[4]?.textContent).toBe("$Cost");
    expect(tabs[0]?.getAttribute("title")?.length).toBeGreaterThan(0);
    expect(row.lastElementChild?.textContent).toBe("◨");
    expect(row.lastElementChild?.getAttribute("title")).toBe("close");
  });

  test("the active tab is marked and carries the lane hue", () => {
    const c = panel({ view: focusPanelOn("cost") });
    expect(tabBtn(c, "cost").classList.contains("on")).toBe(true);
    expect(tabBtn(c, "cost").getAttribute("aria-selected")).toBe("true");
    expect(tabBtn(c, "run").classList.contains("on")).toBe(false);
    expect(tabBtn(c, "cost").getAttribute("style")).toContain("--hue");
  });

  test("a click on a tab reports its key", () => {
    const seen: FocusTab[] = [];
    const c = panel({ onFocusTab: (t) => seen.push(t) });
    fireEvent.click(tabBtn(c, "cost"));
    expect(seen).toEqual(["cost"]);
  });

  test("◨ reports the panel closed", () => {
    const seen: boolean[] = [];
    const c = panel({ onFocusOpen: (o) => seen.push(o) });
    fireEvent.click(c.querySelector(".fp-tabs > button:last-child") as Element);
    expect(seen).toEqual([false]);
  });
});

describe("<FocusPanel/> — header", () => {
  test("eyebrow: project · lane · provider, started-ago with the clock as tooltip", () => {
    const eyebrow = panel().querySelector(".fp-eyebrow") as Element;
    expect(eyebrow.textContent).toContain("sabado · feat · ✳ claude");
    expect(eyebrow.textContent).toContain("20m ago");
    expect(eyebrow.querySelector(".fp-ago")?.getAttribute("title")).toMatch(/^\d\d:\d\d$/);
  });

  test("short id, faint suffix and a ⧉ that copies the full id", () => {
    const c = panel();
    expect(c.querySelector(".fp-short")?.textContent).toBe("sabado-276");
    expect(c.querySelector(".fp-suffix")?.textContent).toBe("0a1b2c");
    expect(c.querySelector(".tc-copy")?.getAttribute("title")).toBe(`copy ${FULL_ID}`);
    expect(c.querySelector(".fp-head")?.getAttribute("style")).toContain("--hue");
  });

  test("the ⧉ hands the full id to onCopy", () => {
    const seen: string[] = [];
    const c = panel({ onCopy: (t) => seen.push(t) });
    fireEvent.click(c.querySelector(".fp-idline .tc-copy") as Element);
    expect(seen).toEqual([FULL_ID]);
  });

  test("the head's copy control is shown", () => {
    expect(panel().querySelector(".tc-copy.tc-copy-shown")).not.toBeNull();
  });

  test("the title is the words without the suffix, full text in the tooltip", () => {
    const t = panel().querySelector(".fp-title") as Element;
    expect(t.textContent).toBe("strip tags");
    expect(t.getAttribute("title")).toBe("strip tags");
  });

  test("no suffix and no title, none of their elements", () => {
    const c = panel({ view: FOCUS_PANEL_BARE });
    expect(c.querySelector(".fp-suffix")).toBeNull();
    expect(c.querySelector(".fp-title")).toBeNull();
  });

  test("the status line: live, blocked, green", () => {
    expect(panel().querySelector(".fp-status")?.textContent).toContain("●");
    cleanup();
    expect(panel({ view: FOCUS_PANEL_BLOCKED }).querySelector(".fp-status")?.textContent).toContain(
      "✕",
    );
    cleanup();
    const green = panel({ view: FOCUS_PANEL_GREEN }).querySelector(".fp-status");
    expect(green?.textContent).toContain("✓success — PR opened");
    expect(green?.className).toBe("fp-status ok");
  });

  test("the action bar sits in the header", () => {
    expect(panel().querySelector(".fp-head .actions")).not.toBeNull();
  });

  test("no inline sans-serif anywhere in the panel", () => {
    for (const el of panel().querySelectorAll("*")) {
      expect(el.getAttribute("style") ?? "").not.toContain("font-family");
    }
  });

  test("rail density marks every restyled element", () => {
    const c = panel({ density: "rail" });
    for (const sel of [
      ".fp-tabs",
      ".fp-tab",
      ".fp-head",
      ".fp-eyebrow",
      ".fp-short",
      ".fp-title",
    ]) {
      expect(c.querySelector(sel)?.classList.contains("fp-rail"), sel).toBe(true);
    }
  });
});

describe("<FocusPanel/> — tab content", () => {
  test("the cost body flows through to the Cost tab: the ticket total comes from its view", () => {
    const c = panel({ view: focusPanelOn("cost") });
    expect(c.querySelector(".ct-total")?.textContent).toBe(`ticket total${COST_TAB.ticket.total}`);
  });

  test("the result body flows through to the Result tab", () => {
    const c = panel({ view: focusPanelOn("result") });
    const pr = RESULT_TAB_MERGED.pullRequest;
    expect(c.querySelector(".pr-num")?.textContent).toBe(
      `#${pr.kind === "chips" ? pr.pr.number : ""}`,
    );
  });

  test("opens on the Run tab", () => {
    expect(panel().querySelector(".runtab")).not.toBeNull();
  });

  test("every tab renders its own module through the registry", () => {
    for (const k of Object.keys(FOCUS_BODIES) as FocusTab[]) {
      const c = panel({ view: focusPanelOn(k) });
      expect(c.querySelector(FOCUS_BODY_CLASS[k]), k).not.toBeNull();
      expect(c.querySelector(".ph")).toBeNull();
      cleanup();
    }
  });

  test("the registry has a renderer for each of the seven tabs, all at rail density", () => {
    expect(Object.keys(FOCUS_TAB_RENDERERS)).toEqual([
      "run",
      "walk",
      "gates",
      "tools",
      "cost",
      "route",
      "result",
    ]);
    const c = render(<>{focusBodyOf(FOCUS_BODIES.run)}</>).container;
    expect(c.querySelector(".runtab.rt-rail")).not.toBeNull();
  });
});
