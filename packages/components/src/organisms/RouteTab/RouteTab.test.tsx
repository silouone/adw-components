// `<RouteTab/>`: the focus panel's Route tab. Literal view models; resolving the chain and
// picking the gear are the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  ROUTE_TAB,
  ROUTE_TAB_EMPTY,
  ROUTE_TAB_ESCALATED,
  ROUTE_TAB_LABELS,
  ROUTE_TAB_NO_ROUNDS,
  ROUTE_TAB_PINNED,
} from "../../../fixtures/RouteTab";
import { RouteTab, type RouteTabProps } from "./RouteTab";

afterEach(cleanup);

const draw = (view: RouteTabProps["view"], over: Partial<RouteTabProps> = {}) =>
  render(<RouteTab view={view} labels={ROUTE_TAB_LABELS} {...over} />).container;

const rows = (c: Element, sel: string) => [...c.querySelectorAll(sel)].map((e) => e.textContent);

describe("<RouteTab/> — resolution", () => {
  test("the resolution chain is shown as given", () => {
    expect(draw(ROUTE_TAB).querySelector(".rs-chain")?.textContent).toBe(
      "no pin → default → claude",
    );
    expect(draw(ROUTE_TAB_PINNED).querySelector(".rs-chain")?.textContent).toBe(
      "ticket G3 → target → codex",
    );
  });
});

describe("<RouteTab/> — gear per stage", () => {
  test("a bug-lane fixture: a row per stage with model and gear, in plan order", () => {
    expect(rows(draw(ROUTE_TAB), ".rs-stage")).toEqual([
      "plansonnetG2",
      "buildopusG3",
      "reviewsonnet—",
      "repair / review-fix · escalate at round 3 / 2 · G2 → G3",
    ]);
  });

  test("no escalation row in the view → none invented", () => {
    expect(rows(draw(ROUTE_TAB_NO_ROUNDS), ".rs-stage")).toHaveLength(3);
  });
});

describe("<RouteTab/> — shadow router", () => {
  test("mode, would pick with its reason, escalation none", () => {
    const container = draw(ROUTE_TAB);
    expect(container.querySelector(".rs-mode")?.textContent).toBe("shadow");
    expect(container.querySelector(".rs-pick")?.textContent).toBe("G3 · opus — size large");
    expect(container.querySelector(".rs-esc")?.textContent).toBe("none");
  });

  test("a fired escalation lists node, round and from → to, with its reason in the title", () => {
    const esc = draw(ROUTE_TAB_ESCALATED).querySelector(".rs-esc");
    expect(esc?.textContent).toBe("fired ×1 — build r3 G3 → G4");
    expect(esc?.getAttribute("title")).toContain("red twice");
  });
});

describe("<RouteTab/> — a journal without a route event", () => {
  test("every section shows —; no row is invented", () => {
    const container = draw(ROUTE_TAB_EMPTY);
    expect(container.querySelectorAll(".rs-stage")).toHaveLength(0);
    expect(container.querySelector(".rs-chain")?.textContent).toBe("—");
    expect(container.querySelector(".rs-mode")?.textContent).toBe("—");
    expect(container.querySelector(".rs-pick")?.textContent).toBe("—");
    expect(container.querySelector(".rs-esc")?.textContent).toBe("—");
  });
});

describe('<RouteTab/> — density="rail"', () => {
  const rail = (on: boolean) => draw(ROUTE_TAB, on ? { density: "rail" as const } : {});

  test("renders routetab-rail on the root and stages, rt-rail on rt-kv", () => {
    const c = rail(true);
    expect(c.querySelector(".routetab")?.classList.contains("routetab-rail")).toBe(true);
    const stages = [...c.querySelectorAll(".rs-stage")];
    expect(stages.length).toBeGreaterThan(0);
    for (const s of stages) expect(s.classList.contains("routetab-rail")).toBe(true);
    for (const kv of c.querySelectorAll(".rt-kv"))
      expect(kv.classList.contains("rt-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(rail(false).querySelector('[class*="-rail"]')).toBeNull();
  });
});
