// `<RunTab/>`: the focus panel's Run tab.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  RUN_TAB_ATTEMPTS,
  RUN_TAB_HOLDING,
  RUN_TAB_LABELS,
  RUN_TAB_RUNNING,
  RUN_TAB_WAITING,
} from "../../../fixtures/RunTab";
import { RunTab, type RunTabProps } from "./RunTab";

afterEach(cleanup);

const draw = (view: RunTabProps["view"], over: Partial<RunTabProps> = {}) =>
  render(<RunTab view={view} labels={RUN_TAB_LABELS} onCopy={() => {}} {...over} />).container;

const eyebrows = (c: Element) =>
  [...c.querySelectorAll(".eyebrow")].map((e) => e.firstElementChild?.textContent);

describe("<RunTab/> — a waiter", () => {
  test("the in-line block names the ordinal, host, clock and wait", () => {
    const container = draw(RUN_TAB_WAITING);
    const t = container.textContent ?? "";
    expect(t).toContain("3rd in line on this mac");
    expect(t).toMatch(/since \d\d:\d\d · waited 34m/);
    expect(eyebrows(container)[0]).toBe("in line");
  });

  test("the host's bays with holders and gauges, and the behind chips", () => {
    const container = draw(RUN_TAB_WAITING);
    const bays = container.querySelectorAll(".bay");
    expect(bays.length).toBe(3);
    expect(bays[0]?.textContent).toContain("sabado-1-holder");
    expect(bays[0]?.querySelector(".gauge")).not.toBeNull();
    expect(bays[2]?.querySelector(".gauge")).toBeNull();
    const chips = [...container.querySelectorAll(".chip")].map((c) => c.textContent);
    expect(chips).toEqual(["sabado-276-waiting", "sabado-277-waiting"]);
    expect(container.textContent).toContain("behind");
    expect(container.textContent).not.toContain("holding a slot");
  });
});

describe("<RunTab/> — a slot holder", () => {
  test("the gauge and the slot sentence", () => {
    const container = draw(RUN_TAB_HOLDING);
    expect(eyebrows(container)[0]).toBe("holding a slot");
    expect(container.textContent).toContain("slot 1 on this mac · test · 30m");
    const g = container.querySelector(".gauge > i") as HTMLElement;
    expect(g.style.width).toBe("43%");
    expect(container.textContent).not.toContain("in line on");
  });
});

describe("<RunTab/> — always", () => {
  test("no queue block without a queue entry; the rest, in order", () => {
    expect(eyebrows(draw(RUN_TAB_RUNNING))).toEqual(["where", "handles", "agent", "attempts"]);
  });

  test("where rows", () => {
    const t = draw(RUN_TAB_RUNNING).textContent ?? "";
    expect(t).toContain("this mac");
    expect(t).toContain("sabado · worktree");
    expect(t).toContain("strip-tags");
    expect(t).toContain("abc1234 dirty");
    expect(t).toMatch(/20m ago · \d\d:\d\d/);
  });

  test("the agent box", () => {
    const box = draw(RUN_TAB_RUNNING).querySelector(".agent-box");
    expect(box?.textContent).toContain("✳");
    expect(box?.textContent).toContain("claude-sonnet-5-5");
    expect(box?.textContent).toContain("claude · worktree");
  });

  test("attempts count and rows", () => {
    const c = draw(RUN_TAB_ATTEMPTS);
    const rows = c.querySelectorAll(".attempt");
    expect(rows.length).toBe(2);
    expect(rows[0]?.textContent).toContain("ci round");
    expect(rows[0]?.textContent).toContain("1m 30s");
    expect(rows[0]?.querySelector("a")?.textContent).toBe("#4");
    expect(rows[1]?.textContent).toContain("build");
    expect(c.textContent).toContain("(2)");
  });

  test("nothing that repeats the run screen", () => {
    expect(draw(RUN_TAB_RUNNING).querySelector(".gantt, table")).toBeNull();
  });
});

describe('<RunTab/> — density="rail"', () => {
  const rail = (density: boolean) =>
    draw(RUN_TAB_WAITING, density ? { density: "rail" as const } : {});

  test("renders rt-rail on every restyled element and passes it to Handles", () => {
    const c = rail(true);
    for (const sel of [".runtab", ".rt-sec", ".rt-line"]) {
      const els = [...c.querySelectorAll(sel)];
      expect(els.length).toBeGreaterThan(0);
      for (const e of els) expect(e.classList.contains("rt-rail")).toBe(true);
    }
    for (const sel of [".rt-kv", ".agent-box"])
      for (const e of c.querySelectorAll(sel)) expect(e.classList.contains("rt-rail")).toBe(true);
    const rows = [...c.querySelectorAll(".hd-row")];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.classList.contains("hd-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(rail(false).querySelector('[class*="-rail"]')).toBeNull();
  });
});

describe("<RunTab/> — the owner marker", () => {
  test("the section chips carry rt-chip", () => {
    const chips = [...draw(RUN_TAB_WAITING).querySelectorAll(".rt-sec .chip")];
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((c) => c.classList.contains("rt-chip"))).toBe(true);
  });
});
