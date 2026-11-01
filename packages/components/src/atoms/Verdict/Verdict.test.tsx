// `<VerdictEvidence/>` tests: the evidence behind a blocked run's verdict. The factory
// kept no test for it; these pin the markup the run header relies on.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { type VerdictView, VerdictEvidence } from "./Verdict";

afterEach(cleanup);

const verdict = (over: Partial<VerdictView> = {}): VerdictView => ({
  class: "gate-red",
  suggestedAction: "retry",
  salvageable: false,
  evidence: ["lint exit 1", "2 tests failed"],
  ...over,
});

describe("<VerdictEvidence/>", () => {
  test("the cause word reads 'class · action'", () => {
    const { container } = render(
      <VerdictEvidence salvageableLabel="salvageable" verdict={verdict()} />,
    );
    expect(container.querySelector(".cause-word")?.textContent).toBe("gate-red · retry");
  });

  test("a salvageable verdict says so", () => {
    const { container } = render(
      <VerdictEvidence salvageableLabel="salvageable" verdict={verdict({ salvageable: true })} />,
    );
    expect(container.querySelector(".cause-word")?.textContent).toBe(
      "gate-red · retry · salvageable",
    );
  });

  test("one list item per evidence line, in order", () => {
    const { container } = render(
      <VerdictEvidence salvageableLabel="salvageable" verdict={verdict()} />,
    );
    expect(
      [...container.querySelectorAll(".verdict-evidence li")].map((n) => n.textContent),
    ).toEqual(["lint exit 1", "2 tests failed"]);
  });

  test("no evidence draws an empty list", () => {
    const { container } = render(
      <VerdictEvidence salvageableLabel="salvageable" verdict={verdict({ evidence: [] })} />,
    );
    expect(container.querySelectorAll(".verdict-evidence li")).toHaveLength(0);
  });
});
