// `<Ledger/>`: the gate chips carry the ledger's owner marker beside the shared chip class.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { GATES_RED, NOW, RUN_FACES } from "../../../fixtures/HoverCard";
import { LABELS } from "../../../fixtures/Ledger";
import { Ledger } from "./Ledger";

afterEach(cleanup);

describe("<Ledger/> — the owner marker", () => {
  test("each gate chip carries lg-chip", () => {
    const { container } = render(
      <Ledger
        ledger={{ rows: [{ kind: "step", step: GATES_RED }], span: { lo: 0, span: NOW } }}
        upNext={[]}
        faces={RUN_FACES}
        now={NOW}
        scope={undefined}
        onScope={() => {}}
        onHover={() => {}}
        labels={LABELS}
      />,
    );
    const chips = [...container.querySelectorAll(".lg-gates .chip")];
    expect(chips).toHaveLength(3);
    expect(chips.every((c) => c.classList.contains("lg-chip"))).toBe(true);
  });
});
