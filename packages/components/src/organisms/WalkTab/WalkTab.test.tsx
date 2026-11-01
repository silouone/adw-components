// `<WalkTab/>`: the focus panel's Walk tab. Literal view models; merging a lane's graph with the
// run's nodes, and telling a maintenance round or an unknown lane apart, are the factory's
// projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  WALK_TAB,
  WALK_TAB_CHORE,
  WALK_TAB_FAILED,
  WALK_TAB_FEAT,
  WALK_TAB_FRESH,
  WALK_TAB_LABELS,
  WALK_TAB_UNLISTED,
} from "../../../fixtures/WalkTab";
import { WalkTab, type WalkTabProps } from "./WalkTab";

afterEach(cleanup);

const draw = (view: WalkTabProps["view"], over: Partial<WalkTabProps> = {}) =>
  render(<WalkTab view={view} labels={WALK_TAB_LABELS} {...over} />).container;

describe("<WalkTab/>", () => {
  test("the lane line: BUG, the blurb and done/total nodes", () => {
    const line = draw(WALK_TAB).querySelector(".wk-lane");
    expect(line?.textContent).toContain("BUG");
    expect(line?.textContent).toContain("a regression test");
    expect(line?.textContent).toContain("12/25 nodes");
  });

  test("one segment per graph node with the right tones", () => {
    const segs = [...draw(WALK_TAB).querySelectorAll(".wk-bar .seg")];
    expect(segs).toHaveLength(25);
    expect(segs.filter((s) => s.classList.contains("ok"))).toHaveLength(12);
    expect(segs.filter((s) => s.classList.contains("live"))).toHaveLength(1);
    expect(segs.filter((s) => s.classList.contains("faint"))).toHaveLength(12);
  });

  test("repair sits under gates with ↻2; the live row shows …; next rows are blank and hollow", () => {
    const rows = [...draw(WALK_TAB).querySelectorAll(".wk-row")];
    const names = rows.map((r) => r.querySelector(".wk-node")?.textContent);
    const g = names.indexOf("gates");
    expect(names[g + 1]).toBe("repair");
    expect(rows[g + 1]?.textContent).toContain("↻2");
    expect(rows[g]?.querySelector(".wk-ms")?.textContent).toBe("…");
    const push = rows[names.indexOf("push")];
    expect(push?.querySelector(".wk-ms")?.textContent).toBe("");
    expect(push?.querySelector(".wk-dot")?.classList.contains("hollow")).toBe(true);
    expect(rows[0]?.querySelector(".wk-dot")?.classList.contains("hollow")).toBe(false);
    expect(rows[0]?.textContent).toContain("owned by the factory");
  });

  test("nothing run: the lane line and an all-next graph", () => {
    const c = draw(WALK_TAB_FRESH);
    expect(c.querySelector(".wk-lane")?.textContent).toContain("0/25 nodes");
    expect(c.querySelectorAll(".wk-row")).toHaveLength(25);
  });

  test("a view without a graph says so and draws no row", () => {
    const c = draw(undefined);
    expect(c.textContent).toContain("no node graph for this run");
    expect(c.querySelector(".wk-row")).toBeNull();
    expect(c.querySelector(".wk-lane")).toBeNull();
  });

  test("chore and feat lanes show their own lane names and segments", () => {
    const chore = draw(WALK_TAB_CHORE);
    expect(chore.querySelector(".wk-lane")?.textContent).toContain("CHORE");
    expect(chore.querySelectorAll(".wk-bar .seg")).toHaveLength(3);
    cleanup();
    const feat = draw(WALK_TAB_FEAT);
    expect(feat.querySelectorAll(".wk-bar .seg")).toHaveLength(4);
    expect(feat.querySelector(".wk-lane")?.textContent).toContain("FEAT");
  });

  test("a failed node is a bad row with a bad segment; ↻ appears only from two runs", () => {
    const c = draw(WALK_TAB_FAILED);
    const row = (n: string) =>
      [...c.querySelectorAll(".wk-row")].find(
        (r) => r.querySelector(".wk-node")?.textContent === n,
      );
    expect(row("provision")?.querySelector(".wk-dot")?.classList).toContain("bad");
    expect(row("provision")?.querySelector(".wk-runs")?.textContent).toBe("");
    expect(row("baseline")?.querySelector(".wk-runs")?.textContent).toBe("↻2");
    expect(c.querySelectorAll(".wk-bar .seg.bad")).toHaveLength(1);
  });

  test("an unlisted node is a row but not a bar segment", () => {
    const c = draw(WALK_TAB_UNLISTED);
    expect(c.querySelectorAll(".wk-row")).toHaveLength(3);
    expect(c.querySelectorAll(".wk-bar .seg")).toHaveLength(2);
    expect(c.querySelector(".wk-lane")?.textContent).toContain("1/2 nodes");
  });

  test("the now row is exactly one", () => {
    expect(draw(WALK_TAB).querySelectorAll(".wk-row.now")).toHaveLength(1);
  });
});

describe('<WalkTab/> — density="rail"', () => {
  test("renders wk-rail on the root", () => {
    const root = draw(WALK_TAB, { density: "rail" }).querySelector(".walktab") as Element;
    expect(root.classList.contains("wk-rail")).toBe(true);
  });

  test("the no-graph root renders wk-rail too, and only with density", () => {
    expect(
      draw(undefined, { density: "rail" }).querySelector(".walktab.wk-rail .wk-none"),
    ).not.toBeNull();
    cleanup();
    expect(draw(undefined).querySelector(".walktab")?.className).toBe("walktab");
  });

  test("no density, no modifier", () => {
    expect(draw(WALK_TAB).querySelector('[class*="-rail"]')).toBeNull();
  });
});

describe("<WalkTab/> — the owner marker", () => {
  test("each faint segment carries wk-faint", () => {
    const c = draw(WALK_TAB);
    const faint = [...c.querySelectorAll(".wk-bar .seg.faint")];
    expect(faint).toHaveLength(12);
    expect(faint.every((s) => s.classList.contains("wk-faint"))).toBe(true);
    expect(c.querySelector(".wk-bar .seg:not(.faint).wk-faint")).toBeNull();
  });
});
