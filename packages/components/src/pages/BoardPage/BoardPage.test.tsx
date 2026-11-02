// `<BoardPage/>` renders from a committed view: no signal is imported or seeded here; gestures are
// asserted as recorded callbacks. Literal view models from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BOARD_PAGE_CHIPS,
  BOARD_PAGE_WAVE as WAVE,
  recordingActions,
  WAVE_BLOCKED,
  WAVE_SECTIONS,
  WAVE_SELECTED,
} from "../../../fixtures/BoardPage";
import { BoardPage, BoardPageChips, type BoardPageView } from "./BoardPage";

afterEach(cleanup);

const page = (view: BoardPageView = WAVE) => {
  const { actions, calls } = recordingActions();
  const out = render(
    <BoardPage view={view} actions={actions} runSlot={<div class="run-slot" />} />,
  );
  return { ...out, calls };
};

describe("<BoardPage/> — rendered from a fixture, no signal seeded", () => {
  test("renders one section per project with its cards", () => {
    const { container } = page();
    expect(container.querySelectorAll(".grp")).toHaveLength(WAVE_SECTIONS.length);
    expect(container.querySelector(`[data-ticket="${WAVE_SELECTED}"]`)).not.toBeNull();
  });

  test("the blocked card carries its blocked state", () => {
    const { container } = page();
    expect(
      container.querySelector(`[data-ticket="${WAVE_BLOCKED}"][data-health="blocked"]`),
    ).not.toBeNull();
  });

  test("rails: the network tree when hostOpen, the runner rail otherwise", () => {
    const open = page();
    expect(open.container.querySelector('aside.net[data-rail="host"]')).not.toBeNull();
    open.unmount();
    const closed = page({ ...WAVE, shell: { ...WAVE.shell, hostOpen: false } });
    expect(closed.container.querySelector('nav[data-rail="host"]')).not.toBeNull();
  });

  test("the focus panel's head and active tab body render for the selected card", () => {
    const { container } = page();
    const aside = container.querySelector('aside.panel[data-rail="focus"]');
    expect(aside?.querySelector(".fp-tabs")).not.toBeNull();
    expect(aside?.querySelector(".runtab")).not.toBeNull();
    expect(aside?.textContent).toContain("4th in line");
  });

  test("stale → .shell-frame-stale and the notice", () => {
    const stale = { ...WAVE, shell: { ...WAVE.shell, stale: true, staleNotice: "stream dropped" } };
    const { container } = page(stale);
    expect(container.querySelector(".shell-frame-notice")?.textContent).toBe("stream dropped");
    expect(container.querySelector(".shell-frame.shell-frame-stale")).not.toBeNull();
  });

  test("a card click calls onSelect(ticketId)", () => {
    const { container, calls } = page();
    fireEvent.click(container.querySelector(`[data-ticket="${WAVE_BLOCKED}"]`) as Element);
    expect(calls).toContainEqual(["onSelect", WAVE_BLOCKED]);
  });
});

describe("<BoardPageChips/> — the header chips from the same view", () => {
  const chips = () => {
    const { actions, calls } = recordingActions();
    const out = render(<BoardPageChips view={BOARD_PAGE_CHIPS} actions={actions} />);
    return { ...out, calls };
  };

  test("renders the KPI, slots and filters chips and the view toggle", () => {
    const { container } = chips();
    expect(container.querySelector("[data-chip=kpi]")).not.toBeNull();
    expect(container.querySelector("[data-dd=slots]")).not.toBeNull();
    expect(container.querySelector("[data-dd=filters]")).not.toBeNull();
    expect(container.querySelector("[data-view]")).not.toBeNull();
  });

  test("a filter chip click calls onFilter(name, value)", () => {
    const { container, calls } = chips();
    fireEvent.click(container.querySelector('[data-lane="bug"]') as Element);
    expect(calls).toContainEqual(["onFilter", "lanes", ["bug"]]);
  });

  test("a window chip click calls onWindow(days, true)", () => {
    const { container, calls } = chips();
    fireEvent.click(container.querySelector(".range .chip:not(.on)") as Element);
    const call = calls.find((c) => c[0] === "onWindow");
    expect(call?.[2]).toBe(true);
  });
});
