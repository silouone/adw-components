// `<SlotsPanel/>` tests: the slots dropdown's body — each runner's header, bays with
// their gauge, and the queue in the pool's own order. Pure: a view in, markup out, and
// a callback when a row asks to open its run.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BAYLESS_RUNNER,
  FOOT_TEXT,
  FREE_BAY_NEXT,
  HOLDER_BARE_ID,
  HOLDER_BAD,
  HOLDER_OK,
  HOLDER_WARN,
  INTERLEAVED_RUNNER,
  LOCAL_RUNNER,
  NO_POOL,
  ONE_RUNNER,
  OUT_OF_ORDER_RUNNER,
  SLOTS_LABELS,
  SSH_RUNNER,
  TWO_RUNNERS,
  WAITER_NO_PROJECT,
  WAITER_ONE,
} from "../../../fixtures/SlotsPanel";
import type { SlotRunnerView, SlotsPanelView } from "./SlotsPanel";
import { SlotsPanel } from "./SlotsPanel";

afterEach(cleanup);

const viewOf = (...runners: readonly SlotRunnerView[]): SlotsPanelView => ({
  runners,
  footText: FOOT_TEXT,
});
const panel = (view: SlotsPanelView, onOpenRun: (ticketId: string) => void = () => {}) => (
  <SlotsPanel view={view} labels={SLOTS_LABELS} onOpenRun={onOpenRun} />
);
const gaugeOf = (c: ParentNode) => c.querySelector(".sl-gauge") as HTMLElement;

describe("<SlotsPanel/> — bays and gauges", () => {
  test("a holder's gauge carries its text, tone class, timeout title and fill", () => {
    const { container } = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_OK] })));
    const g = gaugeOf(container);
    expect(g.className).toBe("sl-gauge ok");
    expect(g.getAttribute("title")).toBe("of 30 min");
    expect(g.querySelector(".sl-gtxt")?.textContent).toBe("10m 0s");
    const fill = g.querySelector(".sl-fill") as HTMLElement;
    expect(Number.parseFloat(fill.style.width)).toBeCloseTo(33.33, 1);
  });

  test("the tone is the view's: warn and bad, the bad one full", () => {
    const warn = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_WARN] })));
    expect(gaugeOf(warn.container).className).toBe("sl-gauge warn");
    expect(
      Number.parseFloat(
        (gaugeOf(warn.container).querySelector(".sl-fill") as HTMLElement).style.width,
      ),
    ).toBeCloseTo(83.33, 1);
    cleanup();
    const bad = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_BAD] })));
    const g = gaugeOf(bad.container);
    expect(g.classList.contains("bad")).toBe(true);
    expect((g.querySelector(".sl-fill") as HTMLElement).style.width).toBe("100%");
  });

  test("a free bay shows its text; a free bay names the next waiter when the view says so", () => {
    const withQueue = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [FREE_BAY_NEXT] })));
    expect(withQueue.container.querySelector(".sl-free")?.textContent).toBe(
      "free · next adw-bug-1",
    );
    expect(withQueue.container.querySelector(".sl-bay-row [data-ticket]")).toBeNull();
    cleanup();
    const empty = render(
      panel(viewOf({ ...BAYLESS_RUNNER, bays: [{ index: 1, freeText: "free" }] })),
    );
    expect(empty.container.querySelector(".sl-free")?.textContent).toBe("free");
  });

  test("a holder row carries the full id, shows the head, gate and SLOT n", () => {
    const { container } = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_OK] })));
    const row = container.querySelector(".sl-bay-row") as HTMLElement;
    expect(row.getAttribute("data-ticket")).toBe("adw-board-13-the-slots-dropdown-da71ba");
    expect(row.querySelector("b")?.textContent).toBe("adw-board-13");
    expect(row.querySelector(".sl-gate")?.textContent).toBe("test");
    expect(row.querySelector(".sl-eb")?.textContent).toBe("SLOT 2");
  });

  test("bays keep the view order, holders and free rows interleaved", () => {
    const { container } = render(panel(viewOf(INTERLEAVED_RUNNER)));
    const eb = [...container.querySelectorAll(".sl-bay-row .sl-eb")].map((e) => e.textContent);
    expect(eb).toEqual(["SLOT 0", "SLOT 1", "SLOT 2"]);
    expect(container.querySelectorAll(".sl-bay-row[data-ticket]").length).toBe(1);
  });

  test("a bare run id as the head is shown whole", () => {
    const { container } = render(panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_BARE_ID] })));
    const row = container.querySelector(".sl-bay-row") as HTMLElement;
    expect(row.getAttribute("data-ticket")).toBe("run-abc");
    expect(row.querySelector("b")?.textContent).toBe("run-abc");
  });
});

describe("<SlotsPanel/> — header, queue and footer", () => {
  test("queue rows keep the array order even when positions are out of order", () => {
    const { container } = render(panel(viewOf(OUT_OF_ORDER_RUNNER)));
    const pos = [...container.querySelectorAll(".sl-q-row .sl-pos")].map((e) => e.textContent);
    expect(pos).toEqual(["2", "1"]);
  });

  test("a queue row reads position, head, place, since and waited", () => {
    const { container } = render(panel(viewOf({ ...BAYLESS_RUNNER, queue: [WAITER_ONE] })));
    const row = container.querySelector(".sl-q-row") as HTMLElement;
    expect(row.getAttribute("data-ticket")).toBe("adw-bug-1-some-title-abcdef");
    expect(row.querySelector("b")?.textContent).toBe("adw-bug-1");
    expect(row.querySelector(".sl-pl")?.textContent).toBe("adw-factory · bug");
    expect(row.textContent).toContain("since 11:25");
    expect(row.querySelector(".sl-wait")?.textContent).toBe("34m 55s");
  });

  test("a place without a project renders the lane alone", () => {
    const { container } = render(panel(viewOf({ ...BAYLESS_RUNNER, queue: [WAITER_NO_PROJECT] })));
    expect(container.querySelector(".sl-pl")?.textContent).toBe("bug");
  });

  test("the header reads held/total · queued, with the note", () => {
    const { container } = render(panel(viewOf(LOCAL_RUNNER)));
    const h = container.querySelector(".sl-h") as HTMLElement;
    expect(h.textContent).toContain("1/3 held · 9 queued");
    expect(h.querySelector("b")?.textContent).toBe("local");
    expect(h.querySelector(".sl-note")?.textContent).toBe("this Mac");
  });

  test("two runners render two sections", () => {
    const { container } = render(panel(TWO_RUNNERS));
    expect(
      [...container.querySelectorAll(".sl-runner")].map((e) => e.getAttribute("data-runner")),
    ).toEqual(["local", "m1max"]);
  });

  test("a runner with no bays still renders its header", () => {
    const { container } = render(panel(viewOf(BAYLESS_RUNNER)));
    expect(container.querySelector(".sl-runner .sl-h")).not.toBeNull();
  });

  test("each runner's queue renders inside its own section", () => {
    const { container } = render(panel(TWO_RUNNERS));
    const ids = [...container.querySelectorAll(".sl-runner")].map((s) =>
      [...s.querySelectorAll(".sl-q-row")].map((r) => r.getAttribute("data-ticket")),
    );
    expect(ids).toEqual([
      ["adw-bug-1-some-title-abcdef", "adw-bug-2-some-title-abcdef"],
      ["adw-feat-7-other-abc"],
    ]);
  });

  test("the header glyph follows the runner kind", () => {
    const { container } = render(panel(TWO_RUNNERS));
    const glyphs = [...container.querySelectorAll(".sl-h > span:first-child")].map(
      (e) => e.textContent,
    );
    expect(glyphs).toEqual(["▣", "⇄"]);
  });

  test("the footer is the view's policy line", () => {
    const { container } = render(panel(ONE_RUNNER));
    expect(container.querySelector(".sl-foot")?.textContent).toBe(
      "a free slot goes to the most urgent waiter, not the first poller · gate exec timeout 30 min",
    );
  });

  test("no runner → one dim line and the footer, without a row", () => {
    const { container } = render(panel(NO_POOL));
    expect(container.querySelector(".sl-free")?.textContent).toBe("no slot pool configured");
    expect(container.querySelectorAll(".sl-runner").length).toBe(0);
    expect(container.querySelector(".sl-foot")).not.toBeNull();
    expect(container.querySelector("[data-ticket]")).toBeNull();
  });
});

describe("<SlotsPanel/> — a row opens its run", () => {
  test("a holder row reports its ticket id", () => {
    const onOpenRun = mock((_ticketId: string) => {});
    const { container } = render(
      panel(viewOf({ ...BAYLESS_RUNNER, bays: [HOLDER_OK] }), onOpenRun),
    );
    fireEvent.click(container.querySelector(".sl-bay-row") as Element);
    expect(onOpenRun.mock.calls).toEqual([["adw-board-13-the-slots-dropdown-da71ba"]]);
  });

  test("a queue row reports its ticket id likewise", () => {
    const onOpenRun = mock((_ticketId: string) => {});
    const { container } = render(
      panel(viewOf({ ...SSH_RUNNER, bays: [], queue: [WAITER_ONE] }), onOpenRun),
    );
    fireEvent.click(container.querySelector(".sl-q-row") as Element);
    expect(onOpenRun.mock.calls).toEqual([["adw-bug-1-some-title-abcdef"]]);
  });

  test("a free bay has nobody to open: a click reports nothing", () => {
    const onOpenRun = mock((_ticketId: string) => {});
    const { container } = render(
      panel(viewOf({ ...BAYLESS_RUNNER, bays: [{ index: 0, freeText: "free" }] }), onOpenRun),
    );
    fireEvent.click(container.querySelector(".sl-bay-row") as Element);
    expect(onOpenRun).not.toHaveBeenCalled();
  });
});
