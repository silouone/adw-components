// `<ReviewDesk/>` renders from props: nothing is read from the world; every write is a callback
// the owner supplies. Literal view models from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { deskView, EMPTY_DESK, hueOf, REVIEW_DESK_LABELS } from "../../../fixtures/ReviewDesk";
import { type DeskView, ReviewDesk } from "./ReviewDesk";

afterEach(cleanup);

function recorder() {
  const calls: { desk: number; filter: string[]; select: string[] } = {
    desk: 0,
    filter: [],
    select: [],
  };
  return {
    calls,
    onDesk: () => {
      calls.desk += 1;
    },
    onPrFilter: (b: string) => calls.filter.push(b),
    onSelect: (id: string) => calls.select.push(id),
  };
}

const mount = (over: { open?: boolean; prFilter?: readonly string[]; v?: DeskView } = {}) => {
  const r = recorder();
  const out = render(
    <ReviewDesk
      view={over.v ?? deskView()}
      labels={REVIEW_DESK_LABELS}
      hueOf={hueOf}
      open={over.open ?? false}
      prFilter={over.prFilter ?? []}
      onDesk={r.onDesk}
      onPrFilter={r.onPrFilter}
      onSelect={r.onSelect}
    />,
  );
  return { ...out, calls: r.calls };
};

describe("<ReviewDesk/> from props", () => {
  test("closed by default: the summary carries the counts and no columns render", () => {
    const { container } = mount();
    expect(container.querySelector(".bl-desk-cols")).toBeNull();
    const n = [...container.querySelectorAll(".bl-desk-n")].map((e) => e.textContent);
    expect(n).toContain("2 open PR");
  });

  test("open={true} renders one .bl-desk-col per column", () => {
    const { container } = mount({ open: true });
    expect(container.querySelectorAll(".bl-desk-col").length).toBe(2);
    expect(container.querySelector(".bl-desk-hd .grp-n.bl-desk-count")).not.toBeNull();
  });

  test("a bucket in prFilter marks its column .on", () => {
    const { container } = mount({ open: true, prFilter: ["merge"] });
    expect(container.querySelector('[data-bucket="merge"]')?.className).toContain(" on");
    expect(container.querySelector('[data-bucket="review"]')?.className).not.toContain(" on");
  });

  test("clicking the summary calls onDesk once and does not toggle itself", () => {
    const { container, calls } = mount();
    fireEvent.click(container.querySelector("summary") as HTMLElement);
    expect(calls.desk).toBe(1);
    expect(container.querySelector(".bl-desk-cols")).toBeNull();
  });

  test("a column header calls onPrFilter with its bucket", () => {
    const { container, calls } = mount({ open: true });
    fireEvent.click(container.querySelector(".bl-desk-hd") as HTMLElement);
    expect(calls.filter).toEqual(["review"]);
  });

  test('"+n more" calls onPrFilter with its bucket', () => {
    const { container, calls } = mount({ open: true, v: deskView(7) });
    fireEvent.click(container.querySelector(".bl-desk-more") as HTMLElement);
    expect(calls.filter).toEqual(["review"]);
  });

  test("a card calls onSelect with the row id", () => {
    const { container, calls } = mount({ open: true });
    fireEvent.click(container.querySelector(".bl-desk-card") as HTMLElement);
    expect(calls.select).toEqual(["proj-1"]);
  });

  test('an empty column list shows "no open PR in this selection"', () => {
    const { container } = mount({ open: true, v: EMPTY_DESK });
    expect(container.textContent).toContain("no open PR in this selection");
  });

  test('exactly six cards show no "+n more" link', () => {
    const { container } = mount({ open: true, v: deskView(6) });
    expect(container.querySelectorAll(".bl-desk-card").length).toBe(6);
    expect(container.querySelector(".bl-desk-more")).toBeNull();
  });

  test('seven cards render six and a "+1 more" link', () => {
    const { container } = mount({ open: true, v: deskView(7) });
    expect(container.querySelectorAll(".bl-desk-card").length).toBe(6);
    expect(container.querySelector(".bl-desk-more")?.textContent).toContain("+1 more");
  });

  test("no oldest age omits the oldest note", () => {
    const { container } = mount({ v: { ...deskView(), oldest: undefined } });
    expect(container.textContent).not.toContain("oldest");
  });

  test("an open desk marks the details open and still delegates the summary click", () => {
    const { container, calls } = mount({ open: true });
    expect(container.querySelector("details")?.hasAttribute("open")).toBe(true);
    fireEvent.click(container.querySelector("summary") as HTMLElement);
    fireEvent.click(container.querySelector("summary") as HTMLElement);
    expect(calls.desk).toBe(2);
    expect(container.querySelector(".bl-desk-cols")).not.toBeNull();
  });

  test("a closed desk never calls the other callbacks", () => {
    const { calls } = mount();
    expect(calls.filter).toEqual([]);
    expect(calls.select).toEqual([]);
  });
});

describe("<ReviewDesk/> — the tight variant", () => {
  test("the root details carries grp-tight", () => {
    const { container } = mount();
    expect(container.querySelector("details.bl-desk")?.classList).toContain("grp-tight");
  });
});
