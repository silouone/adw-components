// `<CostTab/>`: the focus panel's Cost tab. Literal view models; the factory's projection
// cases (grouping, shares, totals, the time split, the price basis) stay with the factory.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { COST_TAB, COST_TAB_EMPTY, COST_TAB_LABELS } from "../../../fixtures/CostTab";
import { CostTab, type CostTabProps } from "./CostTab";

afterEach(cleanup);

const draw = (view: CostTabProps["view"], over: Partial<CostTabProps> = {}) =>
  render(<CostTab view={view} labels={COST_TAB_LABELS} {...over} />).container;

const text = (c: Element, sel: string) => c.querySelector(sel)?.textContent;

describe("<CostTab/> — this run", () => {
  test("three cells: est. cost, total tokens, turns; the meter line", () => {
    const container = draw(COST_TAB);
    const cells = [...container.querySelectorAll(".ct-cell")].map((c) => c.textContent);
    expect(cells).toEqual(["est. cost~$1.00", "tokens1K", "turns12"]);
    expect(text(container, ".ct-meter")).toBe("91% cache reads · 70 in · 2K out");
  });

  test("no summary → every cell is —, nothing throws", () => {
    const none = draw(COST_TAB_EMPTY);
    expect([...none.querySelectorAll(".ct-cell b")].map((b) => b.textContent)).toEqual([
      "—",
      "—",
      "—",
    ]);
    expect(none.querySelectorAll(".ct-stage")).toHaveLength(0);
    expect(none.querySelector(".ct-agent")).toBeNull();
  });
});

describe("<CostTab/> — by stage", () => {
  test("a bar without tokens renders —; the footer names the agent share", () => {
    const container = draw(COST_TAB);
    const plan = [...container.querySelectorAll(".ct-stage")].find((r) =>
      r.textContent?.startsWith("plan"),
    );
    expect(plan?.textContent).toContain("—");
    expect(plan?.textContent).toContain("5%");
    expect(text(container, ".ct-agent")).toBe("agent 65%");
  });

  test("a row per stage with its duration, share and tokens, in order", () => {
    const rows = [...draw(COST_TAB).querySelectorAll(".ct-stage")].map((r) => r.textContent);
    expect(rows).toEqual(["build4m 00s40%600", "repair2m 00s20%150", "plan30.0s5%—"]);
  });
});

describe("<CostTab/> — the ticket so far", () => {
  test("the count, the attempts and the total; an unpriced attempt shows —", () => {
    const container = draw(COST_TAB);
    expect(text(container, ".ct-count")).toBe("3 attempts");
    expect(text(container, ".ct-total")).toBe("ticket total~$1.25");
    const rows = [...container.querySelectorAll(".ct-attempt")].map((r) => r.textContent);
    expect(rows[0]).toContain("ci round");
    expect(rows[0]).toContain("—");
    expect(rows[1]).toContain("rebase round");
    expect(rows[1]).toContain("opus-4.5");
    expect(rows[1]).toContain("~$0.25");
    expect(rows[2]).toContain("build");
    expect(rows[2]).toContain("sonnet-4.5");
  });

  test("the time line and the price-basis sentence are shown verbatim", () => {
    const container = draw(COST_TAB);
    expect(text(container, ".ct-time")).toBe("agent 2m 00s · factory 1m 00s · wait 30.0s");
    expect(text(container, ".ct-basis")).toBe("sonnet list price, 2026-10-01");
    expect(text(draw(COST_TAB_EMPTY), ".ct-basis")).toBe("—");
  });
});

describe('<CostTab/> — density="rail"', () => {
  const rail = (on: boolean) => draw(COST_TAB, on ? { density: "rail" as const } : {});

  test("renders ct-rail on the root, cells and rows, rt-rail on sections", () => {
    const c = rail(true);
    for (const [sel, cls] of [
      [".costtab", "ct-rail"],
      [".ct-cell", "ct-rail"],
      [".ct-stage", "ct-rail"],
      [".rt-sec", "rt-rail"],
    ] as const) {
      const els = [...c.querySelectorAll(sel)];
      expect(els.length).toBeGreaterThan(0);
      for (const e of els) expect(e.classList.contains(cls)).toBe(true);
    }
    for (const a of c.querySelectorAll(".ct-attempt"))
      expect(a.classList.contains("ct-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(rail(false).querySelector('[class*="-rail"]')).toBeNull();
  });
});
