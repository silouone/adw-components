// `<PhaseLegend/>`: the board's one key to the phase strip — a swatch per
// phase in the run's order, then the two marks that are not phases.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { PHASE_LEGEND_LABELS, PHASES } from "../../../fixtures/PhaseLegend";
import { PhaseLegend } from "./PhaseLegend";

afterEach(cleanup);

describe("<PhaseLegend/>", () => {
  test("names the seven phases in run order, each with its swatch class", () => {
    const { container } = render(<PhaseLegend phases={PHASES} labels={PHASE_LEGEND_LABELS} />);
    const items = Array.from(container.querySelectorAll(".pl-item"));
    expect(items.map((e) => e.textContent)).toEqual([
      "setup",
      "plan",
      "build",
      "test",
      "gates",
      "review",
      "ship",
      "waiting for a slot",
      "blocked",
    ]);
    expect(items[1]?.querySelector("i")?.className).toBe("pl-sw ph-plan");
    expect(items[7]?.querySelector("i")?.className).toBe("pl-sw wait");
    expect(items[8]?.querySelector("i")?.className).toBe("pl-sw blocked");
  });
});
