// `<ViewToggle/>` tests: the `▦ / ☰` switch mirrors the host's `view` through `.on` and
// `aria-pressed`, and reports every pick.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { TOGGLE_LABELS } from "../../../fixtures/ViewToggle";
import { type BoardView, ViewToggle } from "./ViewToggle";

afterEach(cleanup);

const toggle = (view: BoardView, onView: (kind: BoardView) => void = () => {}) => (
  <ViewToggle view={view} labels={TOGGLE_LABELS} onView={onView} />
);
const button = (c: Element, which: string) =>
  c.querySelector(`[data-view="${which}"]`) as HTMLButtonElement;

describe("<ViewToggle/>", () => {
  test("two plain buttons, ▦ then ☰, in a labelled group", () => {
    const { container } = render(toggle("cards"));
    expect(container.querySelector(".vt")?.getAttribute("aria-label")).toBe("Board view");
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["▦", "☰"]);
    expect(buttons.map((b) => b.getAttribute("type"))).toEqual(["button", "button"]);
    expect(buttons.map((b) => b.getAttribute("title"))).toEqual(["Cards", "Ledger"]);
  });

  test("the current view is `on` and pressed; the other is neither", () => {
    const { container } = render(toggle("cards"));
    expect(button(container, "cards").classList.contains("on")).toBe(true);
    expect(button(container, "cards").getAttribute("aria-pressed")).toBe("true");
    expect(button(container, "ledger").classList.contains("on")).toBe(false);
    expect(button(container, "ledger").getAttribute("aria-pressed")).toBe("false");
  });

  test("clicking reports the pick and the buttons follow the view they are given", () => {
    const onView = mock((_kind: BoardView) => {});
    const { container, rerender } = render(toggle("cards", onView));
    fireEvent.click(button(container, "ledger"));
    expect(onView.mock.calls).toEqual([["ledger"]]);
    rerender(toggle("ledger", onView));
    expect(button(container, "ledger").classList.contains("on")).toBe(true);
    expect(button(container, "cards").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button(container, "cards"));
    expect(onView.mock.calls).toEqual([["ledger"], ["cards"]]);
  });

  test("a ledger view mounts with ☰ pressed", () => {
    const { container } = render(toggle("ledger"));
    expect(button(container, "ledger").getAttribute("aria-pressed")).toBe("true");
  });

  test("either button reports, even the active view", () => {
    const onView = mock((_kind: BoardView) => {});
    const { container } = render(toggle("cards", onView));
    fireEvent.click(button(container, "cards"));
    fireEvent.click(button(container, "ledger"));
    expect(onView.mock.calls).toEqual([["cards"], ["ledger"]]);
  });
});
