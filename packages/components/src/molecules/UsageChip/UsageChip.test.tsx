// `<UsageChip/>` tests: the always-visible fused usage chip in its three states, its
// gauge rows, and the click that asks the host to toggle the panel. Pure: a view in,
// markup out.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  EMPTY_GAUGE,
  FULL_GAUGE,
  LOADING,
  MARKUP_COUNTDOWN,
  ONE_GAUGE,
  SESSION,
  SESSION_NO_RESET,
  TWO_GAUGES,
  UNAVAILABLE,
  USAGE_LABEL,
  WARN_GAUGES,
  WEEK_WARN,
} from "../../../fixtures/UsageChip";
import { UsageChip, type UsageChipView } from "./UsageChip";

afterEach(cleanup);

const chip = (view: UsageChipView, open = false, onToggle: () => void = () => {}) => (
  <UsageChip view={view} open={open} label={USAGE_LABEL} onToggle={onToggle} />
);
const gauges = (...g: readonly (typeof SESSION)[]): UsageChipView => ({
  kind: "gauges",
  gauges: g,
});

describe("<UsageChip/> — degraded reading", () => {
  test("an unavailable read still renders a chip — never omitted", () => {
    const { container } = render(chip(UNAVAILABLE));
    const btn = container.querySelector(".up-fused");
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain("usage");
    expect(btn?.textContent).toContain("—");
  });
});

describe("<UsageChip/> — no reading yet", () => {
  test("loading → a placeholder chip that still toggles the panel", () => {
    const onToggle = mock(() => {});
    const { container } = render(chip(LOADING, false, onToggle));
    const btn = container.querySelector(".up-fused") as HTMLElement;
    expect(btn.className).toContain("up-loading");
    expect(btn.className).toContain("up-fused-loading");
    expect(btn.textContent).toContain("usage");
    expect(btn.textContent).toContain("…");
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("<UsageChip/> — tone", () => {
  test("each row carries its tone class", () => {
    const { container } = render(chip(WARN_GAUGES));
    expect([...container.querySelectorAll(".up-fr")].map((r) => r.className)).toEqual([
      "up-fr bad",
      "up-fr warn",
    ]);
  });
});

describe("<UsageChip/> — partial reading", () => {
  test("only the week gauge (no session) still renders, just that row", () => {
    const { container } = render(chip(ONE_GAUGE));
    expect(container.querySelectorAll(".up-fr")).toHaveLength(1);
    expect(container.textContent).toContain("week");
    expect(container.textContent).toContain("30%");
  });

  test("two gauges render two rows and a caret, in order", () => {
    const { container } = render(chip(TWO_GAUGES));
    expect([...container.querySelectorAll(".up-fr i")].map((i) => i.textContent)).toEqual([
      "session",
      "week",
    ]);
    expect(container.querySelector(".up-car")?.textContent).toBe("▾");
  });
});

describe("<UsageChip/> — click reports the toggle, open marks the chip", () => {
  test("a click calls onToggle; open adds up-on", () => {
    const onToggle = mock(() => {});
    const { container, rerender } = render(chip(gauges(SESSION), false, onToggle));
    expect(container.querySelector(".up-fused")?.className).not.toContain("up-on");
    fireEvent.click(container.querySelector(".up-fused") as HTMLElement);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(chip(gauges(SESSION), true, onToggle));
    expect(container.querySelector(".up-fused")?.className).toContain("up-on");
    expect(container.querySelector(".up-fused")?.className).toContain("up-fused-on");
  });
});

describe("<UsageChip/> — reset countdown", () => {
  test("a gauge with a reset shows its countdown", () => {
    const { container } = render(chip(gauges(SESSION)));
    expect(container.querySelector(".up-cd")?.textContent).toBe("4h 12m");
  });

  test("a gauge with no reset shows an empty countdown", () => {
    const { container } = render(chip(gauges(SESSION_NO_RESET)));
    expect(container.querySelector(".up-cd")?.textContent).toBe("");
  });
});

describe("<UsageChip/> — untrusted text renders as literal text, not markup", () => {
  test("a countdown with HTML-special characters renders literally, no injected markup", () => {
    const { container } = render(chip(gauges(MARKUP_COUNTDOWN)));
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector(".up-cd")?.textContent).toBe("A&B<script>");
  });
});

describe("<UsageChip/> — pct at its own boundaries (0 and 100)", () => {
  test("0% renders a real 0%-width mini-bar, not a blank one", () => {
    const { container } = render(chip(gauges(EMPTY_GAUGE)));
    const row = container.querySelector(".up-fr") as HTMLElement;
    expect(row.className).toBe("up-fr ok");
    expect(row.textContent).toContain("0%");
    expect((row.querySelector(".up-mini > span") as HTMLElement).style.width).toBe("0%");
  });

  test("100% renders a full-width mini-bar", () => {
    const { container } = render(chip(gauges(FULL_GAUGE)));
    const row = container.querySelector(".up-fr") as HTMLElement;
    expect(row.className).toBe("up-fr bad");
    expect(row.textContent).toContain("100%");
    expect((row.querySelector(".up-mini > span") as HTMLElement).style.width).toBe("100%");
  });

  test("the bar's width is the view's percent", () => {
    const { container } = render(chip(gauges(WEEK_WARN)));
    expect((container.querySelector(".up-mini > span") as HTMLElement).style.width).toBe("72%");
  });
});
