// `<ViewTabs/>` tests: the run header's gantt · ledger · journey tablist renders the
// active tab and reports a pick. Pure: the active tab in, markup out, a callback on click.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { TABS, TABS_LABEL } from "../../../fixtures/ViewTabs";
import { type RunViewTab, ViewTabs } from "./ViewTabs";

afterEach(cleanup);

const tabs = (active: RunViewTab, onPick: (tab: RunViewTab) => void = () => {}) => (
  <ViewTabs active={active} tabs={TABS} label={TABS_LABEL} onPick={onPick} />
);
const tab = (c: Element, which: string) =>
  c.querySelector(`[data-view="${which}"]`) as HTMLButtonElement;

describe("<ViewTabs/>", () => {
  test("a labelled tablist of three tabs in key order, each with its key", () => {
    const { container } = render(tabs("gantt"));
    expect(container.querySelector("[role=tablist]")?.getAttribute("aria-label")).toBe(
      "timeline view",
    );
    const buttons = [...container.querySelectorAll("[role=tab]")];
    expect(buttons.map((b) => b.textContent)).toEqual(["gantt1", "ledger2", "journey3"]);
    expect(buttons.map((b) => b.getAttribute("data-view"))).toEqual(["gantt", "ledger", "journey"]);
  });

  test("the tooltip is the hint followed by the key", () => {
    const { container } = render(tabs("gantt"));
    expect(tab(container, "ledger").getAttribute("title")).toBe(
      "every step in order, readable without hovering (2)",
    );
  });

  test("the active tab is `on` and selected; the others are neither", () => {
    const { container } = render(tabs("ledger"));
    expect(tab(container, "ledger").classList.contains("on")).toBe(true);
    expect(tab(container, "ledger").getAttribute("aria-selected")).toBe("true");
    for (const other of ["gantt", "journey"]) {
      expect(tab(container, other).classList.contains("on")).toBe(false);
      expect(tab(container, other).getAttribute("aria-selected")).toBe("false");
    }
  });

  test("each tab draws its own icon, hidden from assistive tech", () => {
    const { container } = render(tabs("gantt"));
    const icons = [...container.querySelectorAll(".vt-ico")];
    expect(icons.map((i) => i.className)).toEqual([
      "vt-ico vt-gantt",
      "vt-ico vt-ledger",
      "vt-ico vt-journey",
    ]);
    expect(icons.every((i) => i.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  test("a click reports the picked tab", () => {
    const onPick = mock((_tab: RunViewTab) => {});
    const { container } = render(tabs("gantt", onPick));
    fireEvent.click(tab(container, "journey"));
    expect(onPick.mock.calls).toEqual([["journey"]]);
  });

  test("the active tab follows the view it is given", () => {
    const { container, rerender } = render(tabs("gantt"));
    rerender(tabs("journey"));
    expect(tab(container, "journey").getAttribute("aria-selected")).toBe("true");
    expect(tab(container, "gantt").getAttribute("aria-selected")).toBe("false");
  });
});
