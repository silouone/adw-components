// `<GatesTab/>`: the focus panel's Gates tab. Literal view models; building the live line and
// picking the cause line are the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  GATES_TAB,
  GATES_TAB_BARE,
  GATES_TAB_EDGES,
  GATES_TAB_LABELS,
  GATES_TAB_LIVE,
  GATES_TAB_RED,
} from "../../../fixtures/GatesTab";
import { GatesTab, type GatesTabProps } from "./GatesTab";

afterEach(cleanup);

const draw = (view: GatesTabProps["view"], over: Partial<GatesTabProps> = {}) =>
  render(<GatesTab view={view} labels={GATES_TAB_LABELS} {...over} />).container;

const rowsOf = (c: Element) => [...c.querySelectorAll(".gt-pass")];

describe("<GatesTab/>", () => {
  test("baseline state and sha", () => {
    const t = draw(GATES_TAB).textContent ?? "";
    expect(t).toContain("green · cached for this sha");
    expect(t).toContain("abc1234");
  });

  test("without a baseline: not checked yet", () => {
    expect(draw(GATES_TAB_BARE).textContent).toContain("not checked yet");
  });

  test("passes in order with a pass 2, the count, host and elapsed", () => {
    const c = draw(GATES_TAB);
    const rows = rowsOf(c);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain("✓");
    expect(rows[0]?.textContent).toContain("lint");
    expect(rows[1]?.textContent).toContain("✕");
    expect(rows[1]?.textContent).toContain("m1max");
    expect(rows[2]?.textContent).toContain("pass 2");
    expect(c.textContent).toContain("gate passes(3)");
  });

  test("failing names under the red pass, capped at six with +3 more", () => {
    const c = draw(GATES_TAB);
    const names = [...c.querySelectorAll(".gt-fail li:not(.faint)")].map((l) => l.textContent);
    expect(names).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(c.textContent).toContain("+3 more");
    expect(rowsOf(c)[2]?.querySelector(".gt-fail")).toBeNull();
  });

  test("the live gate line", () => {
    expect(draw(GATES_TAB_LIVE).querySelector(".gt-live")?.textContent).toBe(
      "● build-fix · test · m1max · slot 2 · 4m",
    );
  });

  test("the target's gates, heavy flagged only on the slot-taking one", () => {
    const rows = [...draw(GATES_TAB).querySelectorAll(".gt-target")];
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).not.toContain("heavy");
    expect(rows[1]?.textContent).toContain("⚑ heavy");
  });

  test("no target on the wire says so", () => {
    expect(draw(GATES_TAB_BARE).textContent).toContain("target not on the wire");
  });

  test("why red shows only when the view carries it", () => {
    const a = draw(GATES_TAB_RED);
    expect(a.textContent).toContain("why red");
    expect(a.textContent).toContain("gate test failed");
    cleanup();
    expect(draw(GATES_TAB).textContent).not.toContain("why red");
  });

  test("no detail, no target, no activity: the static sections render without throwing", () => {
    const c = draw(GATES_TAB_BARE);
    expect(c.textContent).toContain("not checked yet");
    expect(c.textContent).toContain("target not on the wire");
    expect(c.querySelector(".gt-live")).toBeNull();
    expect(c.querySelector(".gt-why")).toBeNull();
    expect(c.querySelectorAll(".gt-pass")).toHaveLength(0);
  });

  test("a passing gate never lists failing names; exactly six failing names show no +n more", () => {
    const passes = rowsOf(draw(GATES_TAB_EDGES));
    expect(passes[0]?.querySelector(".gt-fail")).toBeNull();
    expect(passes[1]?.querySelectorAll(".gt-fail li")).toHaveLength(6);
    expect(passes[1]?.textContent).not.toContain("more");
  });

  test("a red gate with no failing names shows ✕ and no empty list", () => {
    const passes = rowsOf(draw(GATES_TAB_EDGES));
    expect(passes[2]?.querySelector(".gt-line .bad")?.textContent).toBe("✕");
    expect(passes[2]?.querySelector(".gt-fail")).toBeNull();
  });

  test("a skipped gate line is faint", () => {
    const c = draw({
      ...GATES_TAB_BARE,
      passes: [{ mark: "✓", name: "e2e", skipped: true, failing: [], failingMore: 0 }],
    });
    expect(c.querySelector(".gt-line")?.classList).toContain("faint");
  });

  test("a target that declares no gates renders an empty list, not the not-on-the-wire note", () => {
    const c = draw({ ...GATES_TAB_BARE, targetGates: [] });
    expect(c.textContent).not.toContain("target not on the wire");
    expect(c.querySelectorAll(".gt-target")).toHaveLength(0);
  });

  test("baseline red shows red with its sha", () => {
    const base = draw({
      ...GATES_TAB_BARE,
      baseline: { text: "red", tone: "bad", sha: "dead123" },
    }).querySelector(".gt-base");
    expect(base?.classList).toContain("bad");
    expect(base?.textContent).toContain("red");
    expect(base?.textContent).toContain("dead123");
  });
});

describe('<GatesTab/> — density="rail"', () => {
  test("renders gt-rail on the root and the rail variant on every section", () => {
    const c = draw(GATES_TAB_BARE, { density: "rail" });
    expect(c.querySelector(".gatestab")?.classList.contains("gt-rail")).toBe(true);
    const secs = [...c.querySelectorAll(".tab-section")];
    expect(secs.length).toBeGreaterThan(0);
    for (const s of secs) expect(s.classList.contains("tab-section-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(draw(GATES_TAB_BARE).querySelector('[class*="-rail"]')).toBeNull();
  });
});
