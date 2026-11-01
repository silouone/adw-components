// `<LedgerRow/>` tests: one board row per ticket, eleven fixed columns so the strips align
// down the page. A view in, markup out; the selection is a callback.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BASE_RED_ROW,
  BLOCKED_ROW,
  COSTED_ROW,
  GREEN_ROW,
  LATEST_PR_BARE_ROW,
  LATEST_PR_ROW,
  LEDGER_ROW_LABELS,
  NO_PROVIDER_ROW,
  PAUSED_ROW,
  PR_ROW,
  REMOTE_ROW,
  RUNNING_RETRY_ROW,
  RUN_HREF,
  SLOT_HOLDER_ROW,
  TICKET_ID,
  TWO_ATTEMPTS_ROW,
  WAITING_ROW,
} from "../../../fixtures/LedgerRow";
import { LedgerRow, type LedgerRowProps, type LedgerRowView } from "./LedgerRow";

afterEach(cleanup);

const draw = (view: LedgerRowView, extra: Partial<LedgerRowProps> = {}): Element =>
  render(<LedgerRow view={view} labels={LEDGER_ROW_LABELS} {...extra} />).container;

const renderRow = (view: LedgerRowView): HTMLElement =>
  draw(view).querySelector(".lr") as HTMLElement;

const COLUMNS = [
  "lr-beacon",
  "lr-idt",
  "lr-lane",
  "lr-now",
  "tc-strip",
  "lr-where",
  "lr-time",
  "lr-cost",
  "lr-tok",
  "lr-end",
  "lr-att",
];

const text = (row: HTMLElement, cls: string) => row.querySelector(`.${cls}`)?.textContent;

describe("<LedgerRow/> — eleven columns, in order", () => {
  test.each([
    ["a slot holder", SLOT_HOLDER_ROW, "slot 1", "running test (slot 1, 3m)"],
    [
      "a waiter",
      WAITING_ROW,
      "queue 3",
      /^waiting for a slot \(3rd in line, since \d\d:\d\d, behind run-a, run-b, run-c\)$/,
    ],
    ["a locally gated run", GREEN_ROW, "this mac", "success"],
    ["a run gated on m1max", REMOTE_ROW, "m1max", "success"],
  ])("%s", (_name, view, where, now) => {
    const row = renderRow(view);
    expect(row.getAttribute("data-ticket")).toBe(view.card.ticketId);
    expect(row.children.length).toBe(11);
    COLUMNS.forEach((cls, i) => {
      expect(row.children[i]?.classList.contains(cls)).toBe(true);
    });
    expect(text(row, "lr-where")).toBe(where);
    if (typeof now === "string") expect(text(row, "lr-now")).toBe(now);
    else expect(text(row, "lr-now")).toMatch(now);
  });

  test("the now line is the full text, ellipsis is CSS only", () => {
    const line = renderRow(WAITING_ROW).querySelector(".lr-now") as HTMLElement;
    expect(line.textContent).not.toContain("…");
    expect(line.getAttribute("title")).toBe(line.textContent ?? "");
  });

  test("the id links to the run, and the title sits under it", () => {
    const id = renderRow(GREEN_ROW).querySelector(".lr-id") as HTMLAnchorElement;
    expect(id.getAttribute("href")).toBe(RUN_HREF);
    expect(id.getAttribute("title")).toBe(TICKET_ID);
    expect(renderRow(GREEN_ROW).querySelector(".lr-title")?.textContent).not.toBe("");
  });

  test("lane tag and provider glyph share the third column", () => {
    const lane = renderRow(GREEN_ROW).querySelector(".lr-lane");
    expect(lane?.querySelector(".tc-tag")?.textContent).toBe("feat");
    expect(lane?.querySelector(".prov.claude")).not.toBeNull();
    expect(lane?.querySelector(".prov.claude")?.getAttribute("title")).toBe("built by claude");
  });

  test("time, cost and tokens read from the view", () => {
    const row = renderRow(GREEN_ROW);
    expect(text(row, "lr-time")).toBe("12.3s");
    expect(text(row, "lr-cost")).toBe("~$1.50");
    expect(text(row, "lr-tok")).toBe("2.24M");
  });

  test("a dash in the view reads as a dash", () => {
    const bare = renderRow({ ...GREEN_ROW, costText: "—", tokText: "—" });
    expect(text(bare, "lr-cost")).toBe("—");
    expect(text(bare, "lr-tok")).toBe("—");
  });

  test("more than one attempt draws the attempt dots, oldest first", () => {
    const row = renderRow(TWO_ATTEMPTS_ROW);
    const dots = row.querySelectorAll(".lr-att .dot");
    expect(dots.length).toBe(2);
    expect(dots[0]?.className).toContain("blocked");
    expect(row.querySelector(".lr-att")?.getAttribute("title")).toBe("2 attempts, oldest first");
    // the dots have a cell of their own, so they never crowd the PR chips
    expect(row.querySelector(".lr-end .dot")).toBeNull();
  });

  test("a single attempt draws no dots, but the attempts cell still holds its column", () => {
    const row = renderRow(GREEN_ROW);
    expect(row.querySelectorAll(".dot").length).toBe(0);
    expect(row.querySelector(".lr-att")).not.toBeNull();
    expect(row.querySelector(".lr-att")?.hasAttribute("title")).toBe(false);
  });

  // the ledger's pr cell clips long labels: the row asks for the chips' compact labels, the
  // tooltip keeps the full wording
  test("the PR chips render compact in the ledger", () => {
    const val = draw(PR_ROW).querySelector(".lr-end .pr-val") as HTMLElement;
    expect(val.querySelector("b")?.textContent).toBe("changes");
    expect(val.getAttribute("title")).toBe("a reviewer requested changes");
  });

  test("the lane hue rides the root, health or live picks the class", () => {
    expect(renderRow(GREEN_ROW).classList.contains("green")).toBe(true);
    expect(renderRow(SLOT_HOLDER_ROW).classList.contains("live")).toBe(true);
    expect(renderRow(SLOT_HOLDER_ROW).getAttribute("style")).toContain("--hue");
  });
});

describe("<LedgerRow/> — states the four fixtures do not reach", () => {
  test("a paused run wears `paused`, not `live`, and still has eleven columns", () => {
    const row = renderRow(PAUSED_ROW);
    expect(row.classList.contains("paused")).toBe(true);
    expect(row.classList.contains("live")).toBe(false);
    expect(row.children.length).toBe(11);
    expect(text(row, "lr-beacon")).toBe("⏸");
    expect(text(row, "lr-now")).toBe("paused at assemble-test · 3m");
  });

  test("a blocked run says its cause in the now line and wears `blocked`", () => {
    const row = renderRow(BLOCKED_ROW);
    expect(row.classList.contains("blocked")).toBe(true);
    expect(row.getAttribute("data-health")).toBe("blocked");
    expect(text(row, "lr-now")).toBe("gate test failed");
    expect(row.children.length).toBe(11);
  });

  test("a view with no provider draws no glyph but keeps the lane tag", () => {
    const row = renderRow(NO_PROVIDER_ROW);
    expect(row.querySelector(".lr-lane .tc-tag")?.textContent).toBe("feat");
    expect(row.querySelectorAll(".lr-lane .prov").length).toBe(0);
  });

  test("a run's own PR link renders with its state when no chips cover it", () => {
    const link = renderRow(LATEST_PR_ROW).querySelector(".lr-end .pr-num") as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe("#42 merged");
    expect(link.getAttribute("href")).toBe("https://example.test/pr/42");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("the PR cell carries lr-pr", () => {
    expect(renderRow(LATEST_PR_BARE_ROW).querySelector(".lr-end .tc-pr.lr-pr")).not.toBeNull();
  });

  test("a PR link without a state prints just the number", () => {
    expect(
      renderRow(LATEST_PR_BARE_ROW).querySelector(".lr-end .pr-num")?.textContent?.trim(),
    ).toBe("#7");
  });

  test("no PR on the run and no chips: the last column is empty", () => {
    expect(renderRow(GREEN_ROW).querySelector(".lr-end")?.children.length).toBe(0);
  });

  test("the cost title rides the cost cell as a title only, never as extra markup", () => {
    const withTitle = renderRow(COSTED_ROW).querySelector(".lr-cost") as HTMLElement;
    expect(withTitle.getAttribute("title")).toContain("~$2.50");
    expect(withTitle.children.length).toBe(0);
    expect(withTitle.textContent).toBe("~$1.50");
    const without = renderRow(GREEN_ROW).querySelector(".lr-cost") as HTMLElement;
    expect(without.hasAttribute("title")).toBe(false);
  });

  test("a live run's attempt dot is the live glyph, an earlier blocked one is not", () => {
    const dots = renderRow(RUNNING_RETRY_ROW).querySelectorAll(".lr-att .dot");
    expect(dots.length).toBe(2);
    expect(dots[0]?.className).toContain("blocked");
    expect(dots[1]?.className).toContain("live");
    expect(dots[1]?.textContent).toBe("◌");
    expect(dots[1]?.getAttribute("href")).toBe(RUN_HREF);
  });
});

describe("<LedgerRow/> — the stage's click target", () => {
  test("a click on the row calls onSelect with the ticket id", () => {
    const picked: string[] = [];
    const c = draw(GREEN_ROW, { onSelect: (id) => picked.push(id) });
    fireEvent.click(c.querySelector(".lr-where") as Element);
    expect(picked).toEqual([TICKET_ID]);
  });

  test("a click on the id link does not select", () => {
    const picked: string[] = [];
    const c = draw(GREEN_ROW, { onSelect: (id) => picked.push(id) });
    fireEvent.click(c.querySelector(".lr-id") as Element);
    expect(picked).toEqual([]);
  });

  test("selected adds .sel and data-selected", () => {
    const row = draw(GREEN_ROW, { selected: true }).querySelector(".lr") as HTMLElement;
    expect(row.classList.contains("sel")).toBe(true);
    expect(row.getAttribute("data-selected")).toBe("true");
  });

  test("without a handler a click throws nothing", () => {
    const c = draw(GREEN_ROW);
    expect(() => fireEvent.click(c.querySelector(".lr") as Element)).not.toThrow();
  });
});

describe("<LedgerRow/> — the base red chip", () => {
  test("a view with baseRed renders the chip in lr-end with the title", () => {
    const chip = draw(BASE_RED_ROW).querySelector(".lr-end .base-red-chip");
    expect(chip?.textContent).toBe("base red");
    expect(chip?.getAttribute("title")).toBe(
      "base abcdef1 was red: test (12 tests), lint (2 tests)",
    );
  });

  test("a view without baseRed renders no .base-red-chip", () => {
    expect(draw(GREEN_ROW).querySelector(".base-red-chip")).toBeNull();
  });

  test("the chip appears once, as the first child of lr-end", () => {
    const container = draw(BASE_RED_ROW);
    expect(container.querySelectorAll(".base-red-chip").length).toBe(1);
    expect(container.querySelector(".lr-end")?.firstElementChild?.className).toBe("base-red-chip");
  });
});

describe("<LedgerRow/> — the owner marker", () => {
  test("each attempt dot carries lr-dot", () => {
    const dots = [...renderRow(TWO_ATTEMPTS_ROW).querySelectorAll(".lr-att .dot")];
    expect(dots).toHaveLength(2);
    expect(dots.every((d) => d.classList.contains("lr-dot"))).toBe(true);
  });
});
