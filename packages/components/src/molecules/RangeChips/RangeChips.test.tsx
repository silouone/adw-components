// <RangeChips/>: a pure function of its props — no clock read, no signal. The one thing it
// reports is a chip click, through `onPick`.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BARS_ALL,
  BARS_BUSY_TODAY,
  BARS_THREE_DAY,
  LABEL_ALL,
  LABEL_EMPTY_ALL,
  LABEL_EMPTY_WINDOW,
  LABEL_THREE_DAY,
  WINDOWS,
} from "../../../fixtures/RangeChips";
import { RangeChips, type RangeChipsProps } from "./RangeChips";

afterEach(() => {
  cleanup();
});

const view = (over: Partial<RangeChipsProps> = {}) =>
  render(
    <RangeChips
      windows={WINDOWS}
      days="1d"
      bars={[]}
      label={LABEL_EMPTY_WINDOW}
      onPick={() => {}}
      {...over}
    />,
  ).container;

describe("<RangeChips/> — days=3d: the 3D chip alone is on, days 0-2 lit, label", () => {
  test("chip .on state, histogram lit/dim buckets, and the label", () => {
    const container = view({ days: "3d", bars: BARS_THREE_DAY, label: LABEL_THREE_DAY });

    expect(container.querySelectorAll(".chip")).toHaveLength(7);
    const onChips = container.querySelectorAll(".chip.on");
    expect(onChips).toHaveLength(1);
    expect(onChips[0]?.getAttribute("data-days")).toBe("3d");

    const bars = container.querySelectorAll(".range-bar");
    expect(bars).toHaveLength(5); // day-index 0..4
    const litFlags = Array.from(bars).map((b) => b.className.includes("lit"));
    expect(litFlags).toEqual([true, true, true, false, false]);

    expect(bars[0]?.getAttribute("title")).toBe("0d ago: 1 runs");
    expect(bars[3]?.getAttribute("title")).toBe("3d ago: 0 runs");
    expect(bars[4]?.getAttribute("title")).toBe("4d ago: 1 runs");

    expect(container.querySelector(".range-label")?.textContent).toBe(LABEL_THREE_DAY);
  });
});

describe("<RangeChips/> — days=all: ALL chip alone is on, every bar lit, label", () => {
  test("every bucket lit, the label is the caller's", () => {
    const container = view({ days: "all", bars: BARS_ALL, label: LABEL_ALL });

    const onChips = container.querySelectorAll(".chip.on");
    expect(onChips).toHaveLength(1);
    expect(onChips[0]?.getAttribute("data-days")).toBe("all");

    const bars = container.querySelectorAll(".range-bar");
    expect(bars).toHaveLength(5);
    expect(Array.from(bars).every((b) => b.className.includes("lit"))).toBe(true);

    expect(container.querySelector(".range-label")?.textContent).toBe("all 4 runs");
  });
});

describe("<RangeChips/> — chip label text (not just data-days)", () => {
  test("the seven chips read 2H/5H/10H/1D/3D/7D/ALL, in that order", () => {
    const labels = Array.from(view().querySelectorAll(".chip i")).map((el) => el.textContent);
    expect(labels).toEqual(["2H", "5H", "10H", "1D", "3D", "7D", "ALL"]);
  });
});

describe("<RangeChips/> — clicking a chip reports the pick", () => {
  test("clicking 7D calls onPick('7d', true): a click is always a pinned pick", () => {
    const onPick = mock((_days: string, _pinned: boolean) => {});
    const chip = view({ onPick }).querySelector('.chip[data-days="7d"]') as HTMLElement;
    fireEvent.click(chip);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("7d", true);
  });
});

describe("<RangeChips/> — zero runs (a brand-new board, or a window with nothing in it)", () => {
  test("no crash, zero bars, the caller's label — numeric window", () => {
    const container = view({ days: "3d", bars: [], label: LABEL_EMPTY_WINDOW });
    expect(container.querySelectorAll(".range-bar")).toHaveLength(0);
    expect(container.querySelector(".range-label")?.textContent).toBe(LABEL_EMPTY_WINDOW);
  });

  test("no crash, zero bars, the caller's label — all", () => {
    const container = view({ days: "all", bars: [], label: LABEL_EMPTY_ALL });
    expect(container.querySelectorAll(".range-bar")).toHaveLength(0);
    expect(container.querySelector(".range-label")?.textContent).toBe("all 0 runs");
  });
});

describe("<RangeChips/> — exactly one chip is .on, for every days value", () => {
  test.each(WINDOWS.map((w) => w.days))("days=%s", (value) => {
    expect(view({ days: value }).querySelectorAll(".chip.on")).toHaveLength(1);
  });
});

describe("<RangeChips/> — relative bar heights", () => {
  test("a taller bucket renders taller than a shorter one, from the view's own heights", () => {
    const bars = view({ days: "7d", bars: BARS_BUSY_TODAY }).querySelectorAll(".range-bar");
    expect(bars).toHaveLength(2);
    expect(bars[0]?.getAttribute("title")).toBe("0d ago: 3 runs");
    expect(bars[1]?.getAttribute("title")).toBe("1d ago: 1 runs");

    const heightOf = (el: Element) => {
      // happy-dom normalizes the inline style string (space after the colon, trailing
      // semicolon) — match tolerant of that.
      const match = el.getAttribute("style")?.match(/height:\s*([\d.]+)%/);
      return match?.[1] === undefined ? undefined : Number(match[1]);
    };
    const h0 = heightOf(bars[0] as Element);
    const h1 = heightOf(bars[1] as Element);
    expect(h0).toBe(100);
    expect(h1).toBeDefined();
    expect(h1 as number).toBeLessThan(h0 as number);
    expect(h1 as number).toBeCloseTo((1 / 3) * 100, 5);
  });
});

describe("<RangeChips/> — the owner marker", () => {
  test("the window chips carry fp-chip beside chip", () => {
    const chips = [...view({ days: "3d" }).querySelectorAll(".chip")];
    expect(chips).toHaveLength(7);
    expect(chips.every((c) => c.classList.contains("fp-chip"))).toBe(true);
  });
});
