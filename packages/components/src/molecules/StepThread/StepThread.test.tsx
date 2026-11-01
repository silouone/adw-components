// `<StepThread/>` tests: the card's run as one dot per node, grouped by phase, each dot
// carrying its hover card. Pure: a view in, markup out; the dots size to fit the card.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  EMPTY,
  SAME_PHASE_THEN_NEW,
  THREE_PHASES,
  WAIT_LABEL,
  WAITING,
} from "../../../fixtures/StepThread";
import { StepThread } from "./StepThread";

afterEach(cleanup);

const dots = (c: Element) => Array.from(c.querySelectorAll(".tc-thread > i")) as HTMLElement[];

describe("<StepThread/>", () => {
  test("one dot per node, classed by phase, kind and a non-green outcome", () => {
    const { container } = render(<StepThread view={THREE_PHASES} waitLabel={WAIT_LABEL} />);
    expect(dots(container).map((d) => d.className)).toEqual([
      "st-dot ph-setup k-det",
      "st-dot ph-plan k-agent gap",
      "st-dot ph-gates k-gate blocked gap",
    ]);
  });

  test("a dot that opens a new phase carries `gap`; a same-phase neighbour does not", () => {
    const { container } = render(<StepThread view={SAME_PHASE_THEN_NEW} waitLabel={WAIT_LABEL} />);
    expect(dots(container).map((d) => d.classList.contains("gap"))).toEqual([false, false, true]);
  });

  test("each dot's hover card is its tip, verbatim", () => {
    const { container } = render(<StepThread view={SAME_PHASE_THEN_NEW} waitLabel={WAIT_LABEL} />);
    expect(dots(container).map((d) => d.dataset.tip)).toEqual(
      SAME_PHASE_THEN_NEW.dots.map((d) => d.tip),
    );
    expect(dots(container)[0]?.dataset.tip).toBe("build · build\n1m 05s\n1.50M tokens\nagent");
  });

  test("a wait for a slot is a trailing hollow dot, not a step", () => {
    const { container } = render(<StepThread view={WAITING} waitLabel={WAIT_LABEL} />);
    const all = dots(container);
    expect(all).toHaveLength(2);
    expect(all[1]?.className).toBe("st-dot wait");
    expect(all[1]?.dataset.tip).toBe("waiting for a slot");
  });

  test("no wait, no trailing dot", () => {
    const { container } = render(<StepThread view={THREE_PHASES} waitLabel={WAIT_LABEL} />);
    expect(container.querySelector(".st-dot.wait")).toBeNull();
  });

  test("the thread tells the CSS how many dots and phase gaps it must fit", () => {
    const { container } = render(<StepThread view={SAME_PHASE_THEN_NEW} waitLabel={WAIT_LABEL} />);
    const t = container.querySelector(".tc-thread") as HTMLElement;
    expect(t.style.getPropertyValue("--n")).toBe("3");
    expect(t.style.getPropertyValue("--gaps")).toBe("1");
  });

  test("no phases still draws the empty thread", () => {
    const { container } = render(<StepThread view={EMPTY} waitLabel={WAIT_LABEL} />);
    expect(container.querySelector(".tc-thread")).not.toBeNull();
    expect(dots(container)).toHaveLength(0);
  });
});
