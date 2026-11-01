// `<BoardChips/>`: the board route's one-bar context. The KPI chip carries the counts, the slots
// chip tallies the rack, and the filters chip and the view toggle sit beside them. Literal view
// models; counting tickets and runs, narrowing them by the filters and bucketing the KPI window
// are the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BOARD_CHIPS,
  BOARD_CHIPS_AUTONOMY,
  BOARD_CHIPS_EMPTY,
  BOARD_CHIPS_FILTERS,
  BOARD_CHIPS_LABELS,
  BOARD_CHIPS_NARROWED,
  BOARD_CHIPS_ONE,
  BOARD_CHIPS_SEVERAL,
} from "../../../fixtures/BoardChips";
import { KPI_PANEL } from "../../../fixtures/KpiPanel";
import { BoardChips, type BoardChipsProps } from "./BoardChips";

afterEach(cleanup);

const draw = (over: Partial<BoardChipsProps> = {}) =>
  render(
    <BoardChips
      view={BOARD_CHIPS}
      labels={BOARD_CHIPS_LABELS}
      autonomy={undefined}
      filters={BOARD_CHIPS_FILTERS}
      boardView="cards"
      open={undefined}
      pinned={undefined}
      onDropdown={() => {}}
      onFilter={() => {}}
      onWindow={() => {}}
      onView={() => {}}
      onOpenRun={() => {}}
      {...over}
    />,
  ).container;

const kpi = (c: Element) => (c.querySelector('[data-chip="kpi"]') as HTMLElement).textContent;

describe("<BoardChips/> — the one bar's board context", () => {
  test("an empty board still reads: zero tickets, zero runs, zero everything", () => {
    const c = draw({ view: BOARD_CHIPS_EMPTY });
    expect(kpi(c)).toBe("0 tickets0 runs● 0 live0 green0 blocked");
    expect(c.querySelector("[data-dd=filters] .dd-chip b")?.textContent).toBe("filters all");
  });

  test("one ticket reads singular, several read plural", () => {
    expect(kpi(draw({ view: BOARD_CHIPS_ONE }))).toStartWith("1 ticket1 run");
    cleanup();
    expect(kpi(draw({ view: BOARD_CHIPS_SEVERAL }))).toStartWith("2 tickets2 runs");
  });

  test("live, green and blocked tallies are the view's", () => {
    expect(kpi(draw())).toBe("3 tickets3 runs● 1 live1 green1 blocked");
  });

  test("the slots chip reads `slots —` with no rack, and the bar carries one filters chip and one view toggle", () => {
    const c = draw({ view: BOARD_CHIPS_EMPTY });
    expect(c.querySelector('[data-dd="slots"] .dd-chip b')?.textContent).toBe("slots —");
    expect(c.querySelectorAll('[data-dd="filters"]')).toHaveLength(1);
    expect(c.querySelectorAll(".vt")).toHaveLength(1);
    expect(c.querySelector(".gh")).toBeNull();
    expect(c.querySelector(".zoom")).toBeNull();
  });

  test("the slots chip shows the tally of the rack in the view", () => {
    const c = draw();
    expect(c.querySelector('[data-dd="slots"] .dd-chip b')?.textContent).toBe(
      "slots 3/5 +9 queued",
    );
  });

  test("picking a lane in the filters panel reports the narrowed lanes, and the chip names the picks", () => {
    const calls: unknown[][] = [];
    const c = draw({
      view: BOARD_CHIPS_NARROWED,
      onFilter: (name, value) => calls.push([name, value]),
    });
    fireEvent.click(c.querySelector('[data-lane="bug"]') as Element);
    fireEvent.click(c.querySelector('[data-provider="claude"]') as Element);
    expect(calls).toEqual([
      ["lanes", ["bug"]],
      ["providers", ["claude"]],
    ]);
    expect(c.querySelector("[data-dd=filters] .dd-chip b")?.textContent).toBe("bug · codex");
  });
});

describe("<BoardChips/> — the KPI chip's dropdown", () => {
  test("the chip is a dropdown whose panel is the KpiPanel", () => {
    const dd = draw().querySelector('[data-dd="kpi"]');
    expect(dd).not.toBeNull();
    expect(dd?.querySelector('.dd-chip [data-chip="kpi"]')).not.toBeNull();
    expect(dd?.querySelector(".dd-panel [data-kpi-panel]")).not.toBeNull();
  });

  test("an empty panel renders dashes without crashing", () => {
    const c = draw({ view: BOARD_CHIPS_EMPTY });
    expect(c.querySelector('[data-cell="green"] .kp-v')?.textContent).toBe("—");
    expect(c.querySelector(".kp-table tbody")?.children).toHaveLength(0);
    expect(c.textContent).not.toContain("NaN");
  });

  test("a click asks the page to toggle the dropdown, and the page's `open` shows the panel", () => {
    const calls: unknown[][] = [];
    const c = draw({ onDropdown: (id, change) => calls.push([id, change]) });
    const panel = c.querySelector('[data-dd="kpi"] .dd-panel');
    expect(panel?.hasAttribute("hidden")).toBe(true);
    fireEvent.click(c.querySelector('[data-dd="kpi"] .dd-chip') as Element);
    expect(calls).toEqual([["kpi", "toggle"]]);
    cleanup();
    const opened = draw({ open: "kpi", pinned: "kpi" });
    expect(opened.querySelector('[data-dd="kpi"] .dd-panel')?.hasAttribute("hidden")).toBe(false);
    expect(opened.querySelector('[data-dd="slots"] .dd-panel')?.hasAttribute("hidden")).toBe(true);
  });

  test("the panel's foot names the window", () => {
    const c = draw({ view: { ...BOARD_CHIPS, kpis: { ...KPI_PANEL, foot: "window: all" } } });
    expect(c.querySelector(".kp-foot")?.textContent).toContain("window: all");
  });
});

describe("BoardChips — the shadow autonomy chip", () => {
  test("shows one chip per target in the autonomy, none without the field", () => {
    expect(draw().querySelector(".autonomy-chip")).toBeNull();
    cleanup();
    expect(
      draw({ autonomy: BOARD_CHIPS_AUTONOMY }).querySelector(".autonomy-chip")?.textContent,
    ).toBe("silou-hq shadow HOTL");
  });
});
