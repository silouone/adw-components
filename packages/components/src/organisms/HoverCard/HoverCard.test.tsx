// `<HoverCard/>`: the one detail card the three timeline views share. It draws the `hovered`
// step, or the members of a cluster, from `faces`; with nothing hovered it draws nothing, and it
// keeps itself inside the viewport it is given, at the zoom it is given.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  BUILD_2,
  face,
  facesOf,
  GATES_RED,
  HOVER_BUILD,
  HOVER_CLUSTER,
  HOVER_GATES,
  LABELS,
  member,
  RUN_FACES,
  VIEWPORT,
} from "../../../fixtures/HoverCard";
import { HoverCard, type HoverCardProps } from "./HoverCard";

afterEach(cleanup);

const mount = (over: Partial<HoverCardProps> = {}) =>
  render(<HoverCard faces={RUN_FACES} viewport={VIEWPORT} zoom={1} labels={LABELS} {...over} />)
    .container;

describe("<HoverCard/> — nothing under the pointer", () => {
  test("nothing hovered renders nothing", () => {
    expect(mount().querySelector(".hc")).toBeNull();
  });

  test("a hover over no member renders nothing", () => {
    expect(mount({ hovered: { members: [], x: 0, y: 0 } }).querySelector(".hc")).toBeNull();
  });
});

describe("<HoverCard/> — one step", () => {
  test("a failed gate lists its failing tests, the ones a pre-existing failure tagged", () => {
    const c = mount({ hovered: HOVER_GATES });
    const fails = [...c.querySelectorAll(".hc-fails li")].map((li) => li.textContent);
    expect(fails).toEqual(["parses a ticket id", `rejects an empty node (${LABELS.preExisting})`]);
  });

  test("a skipped gate names its reason", () => {
    const c = mount({ hovered: HOVER_GATES });
    expect(c.querySelector(".hc-gate.skipped")?.textContent).toBe("– e2e · paths");
  });

  test("more than six failing tests cut to six plus '+N more'", () => {
    const names = Array.from({ length: 9 }, (_, i) => `case ${i}`);
    const failing = face({
      ...RUN_FACES.get("workspace::gates::100900"),
      gates: [{ gate: { name: "test", outcome: "fail", failingTests: names }, suffix: "" }],
    });
    const c = mount({ faces: facesOf([[GATES_RED, failing]]), hovered: HOVER_GATES });
    expect(c.querySelectorAll(".hc-fails li:not(.more)")).toHaveLength(6);
    expect(c.querySelector(".hc-fails .more")?.textContent).toBe(`+3 ${LABELS.more}`);
  });

  test("an agent step shows its rig, turns and tokens; no capture reads as such", () => {
    const c = mount({ hovered: HOVER_BUILD });
    expect(c.querySelector(".hc-rig .rig")?.textContent).toContain("gpt-6-sol");
    expect(c.querySelector(".hc-kpi")?.textContent).toContain("9");
    expect(c.querySelector(".hc-kpi")?.textContent).toContain("640k");
    expect(c.querySelector(".hc-nocap")?.textContent).toBe(LABELS.noCapture);
  });

  test("the card names the round, the phase, the offsets and the outcome glyph", () => {
    const c = mount({ hovered: HOVER_BUILD });
    expect(c.querySelector(".badge-round")?.textContent).toBe(`${LABELS.round} 2/2`);
    expect(c.querySelector(".hc-meta")?.textContent).toContain("build");
    expect(c.querySelector(".hc-meta")?.textContent).toContain("+1m 51s → +2m 31s");
    expect(c.querySelector(".hc-head .mk")?.textContent).toBe("✓");
  });

  test("an agent with no journaled rig says so; a deterministic step says it ran on none", () => {
    const bare = face({ rig: undefined });
    expect(
      mount({ faces: facesOf([[BUILD_2, bare]]), hovered: HOVER_BUILD }).querySelector(".hc-rig")
        ?.textContent,
    ).toBe(LABELS.rigNotJournaled);
    cleanup();
    expect(mount({ hovered: HOVER_GATES }).querySelector(".hc-rig")?.textContent).toBe(
      LABELS.rigNone,
    );
  });

  test("a node's reason and a watchdog trip are shown", () => {
    const stuck = {
      ...BUILD_2,
      block: { ...BUILD_2.block, reason: "no output", watchdog: { reason: "idle 5m" } },
    };
    const c = mount({
      faces: facesOf([[stuck, RUN_FACES.get("build::build::110900") ?? face()]]),
      hovered: { members: [stuck], x: 0, y: 0 },
    });
    const reasons = [...c.querySelectorAll(".hc-reason")].map((r) => r.textContent);
    expect(reasons).toEqual(["no output", `${LABELS.watchdog}: idle 5m`]);
  });
});

describe("<HoverCard/> — a clustered marker", () => {
  test("lists every member, one line each, under the count of quick steps", () => {
    const c = mount({ hovered: HOVER_CLUSTER });
    expect(c.querySelector(".hc-head")?.textContent).toBe(`2 ${LABELS.quickSteps}`);
    expect([...c.querySelectorAll(".hc-line b")].map((b) => b.textContent)).toEqual([
      "provision",
      "dispatch",
    ]);
  });
});

describe("<HoverCard/> — placement in the viewport", () => {
  const at = (x: number, y: number, over: Partial<HoverCardProps> = {}) =>
    mount({ hovered: { members: [member("build", BUILD_2.block)], x, y }, ...over }).querySelector(
      ".hc",
    ) as HTMLElement;

  test("sits just below and right of the pointer", () => {
    const hc = at(100, 100);
    expect(hc.style.left).toBe("116px");
    expect(hc.style.top).toBe("118px");
  });

  test("flips left of the viewport's edge and above the pointer near the bottom-right corner", () => {
    const hc = at(1_190, 790);
    expect(Number.parseFloat(hc.style.left)).toBeLessThan(1_190);
    expect(Number.parseFloat(hc.style.top)).toBeLessThan(790);
  });

  test("measures the viewport in layout px: a page zoom of 2 halves it", () => {
    const hc = at(500, 100, { zoom: 2 });
    expect(Number.parseFloat(hc.style.left)).toBe(600 - 380 - 8);
  });
});
