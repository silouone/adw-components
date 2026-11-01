// `<SlotsChip/>` tests: the top-bar slots chip — mini bays, the held/total label, the
// queue count and the every-bay-held warn border. Pure: a view in, markup out; the
// dropdown gestures and a row's click are callbacks.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  CHIP_FULL,
  CHIP_INTERLEAVED,
  CHIP_LABELS,
  CHIP_NONE,
  CHIP_NO_QUEUE,
  CHIP_ONE_WAITING,
  CHIP_PARTIAL,
} from "../../../fixtures/SlotsChip";
import type { DropdownChange } from "../Dropdown/Dropdown";
import { SlotsChip, type SlotsChipProps } from "./SlotsChip";

afterEach(cleanup);

const chip = (view: SlotsChipProps["view"], over: Partial<SlotsChipProps> = {}) => (
  <SlotsChip
    view={view}
    labels={CHIP_LABELS}
    open={false}
    pinned={false}
    onOpenChange={() => {}}
    onOpenRun={() => {}}
    {...over}
  />
);
const label = (c: ParentNode) => c.querySelector(".dd-chip b")?.textContent ?? "";
const warn = (c: ParentNode) =>
  c.querySelector("[data-dd=slots]")?.classList.contains("slots-warn") ?? false;

describe("<SlotsChip/>", () => {
  test("3/5 held and nine waiting reads slots 3/5 +9 queued, warn off", () => {
    const { container } = render(chip(CHIP_PARTIAL));
    expect(label(container)).toBe("slots 3/5 +9 queued");
    expect(container.querySelectorAll(".sl-bay.held").length).toBe(3);
    expect(container.querySelectorAll(".sl-bay.free").length).toBe(2);
    expect(warn(container)).toBe(false);
  });

  test("every bay held carries the warn class", () => {
    const { container } = render(chip(CHIP_FULL));
    expect(warn(container)).toBe(true);
  });

  test("no queue → no queued suffix", () => {
    const { container } = render(chip(CHIP_NO_QUEUE));
    expect(label(container)).toBe("slots 2/5");
    expect(container.querySelector(".dd-chip b em")).toBeNull();
  });

  test("no pool reads slots — with no bays and no warn", () => {
    const { container } = render(chip(CHIP_NONE));
    expect(label(container)).toBe("slots —");
    expect(container.querySelector(".sl-bays")).toBeNull();
    expect(warn(container)).toBe(false);
  });

  test("the warn class follows the view across renders", () => {
    const { container, rerender } = render(chip(CHIP_PARTIAL));
    expect(warn(container)).toBe(false);
    rerender(chip(CHIP_FULL));
    expect(warn(container)).toBe(true);
    rerender(chip(CHIP_PARTIAL));
    expect(warn(container)).toBe(false);
  });

  test("mini bays render one per bay, in the view's order, held or free", () => {
    const { container } = render(chip(CHIP_INTERLEAVED));
    const kinds = [...container.querySelectorAll(".sl-bays .sl-bay")].map((b) =>
      b.classList.contains("held") ? "held" : "free",
    );
    expect(kinds).toEqual(["held", "free", "free", "held"]);
    expect(container.querySelector(".sl-bays")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("the queued suffix is an em with a leading space", () => {
    const { container } = render(chip(CHIP_ONE_WAITING));
    expect(container.querySelector(".dd-chip b em")?.textContent).toBe(" +1 queued");
    expect(label(container)).toBe("slots 1/1 +1 queued");
    expect(warn(container)).toBe(true);
  });
});

describe("<SlotsChip/> — the dropdown", () => {
  test("the panel is mounted while closed and shows the rack's holder", () => {
    const { container } = render(chip(CHIP_FULL));
    const panel = container.querySelector("[data-dd=slots] .dd-panel") as HTMLElement;
    expect(panel.hidden).toBe(true);
    expect(panel.querySelector(".sl-bay-row[data-ticket]")).not.toBeNull();
  });

  test("open shows the panel; pinned marks the dropdown", () => {
    const { container } = render(chip(CHIP_FULL, { open: true, pinned: true }));
    const dd = container.querySelector("[data-dd=slots]") as HTMLElement;
    expect((dd.querySelector(".dd-panel") as HTMLElement).hidden).toBe(false);
    expect(dd.classList.contains("dd-on")).toBe(true);
  });

  test("hover and click report the gestures", () => {
    const changes: DropdownChange[] = [];
    const { container } = render(chip(CHIP_PARTIAL, { onOpenChange: (c) => changes.push(c) }));
    const dd = container.querySelector("[data-dd=slots]") as HTMLElement;
    fireEvent.mouseEnter(dd);
    fireEvent.mouseLeave(dd);
    fireEvent.click(dd.querySelector(".dd-chip") as HTMLElement);
    expect(changes).toEqual(["enter", "leave", "toggle"]);
  });

  test("a row in the panel reports its run", () => {
    const onOpenRun = mock((_ticketId: string) => {});
    const { container } = render(chip(CHIP_FULL, { onOpenRun }));
    fireEvent.click(container.querySelector(".sl-bay-row[data-ticket]") as Element);
    expect(onOpenRun.mock.calls).toEqual([["adw-board-13-the-slots-dropdown-da71ba"]]);
  });
});

describe("<SlotsChip/> — chip warn marker", () => {
  const chipClass = (c: ParentNode) => c.querySelector("[data-dd=slots] > .dd-chip")?.className;

  test("a full rack's chip carries dd-chip-warn", () => {
    const { container } = render(chip(CHIP_FULL));
    expect(chipClass(container)).toBe("dd-chip dd-chip-warn");
  });

  test("a free rack's does not", () => {
    const { container } = render(chip(CHIP_PARTIAL));
    expect(chipClass(container)).toBe("dd-chip");
  });
});
