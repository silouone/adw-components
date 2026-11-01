// `<Journey/>`: the stale page state reaches the journey as its own class, and every gate chip
// carries the journey's owner marker.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { GATES_RED, RUN_FACES } from "../../../fixtures/HoverCard";
import { EMPTY, JOURNEY, LABELS } from "../../../fixtures/Journey";
import { Journey } from "./Journey";

afterEach(cleanup);

describe("<Journey/> — stale as a modifier class", () => {
  const root = (stale?: boolean) =>
    render(
      <Journey
        journey={EMPTY}
        upNext={[]}
        faces={new Map()}
        scope={undefined}
        onScope={() => {}}
        onHover={() => {}}
        labels={LABELS}
        {...(stale !== undefined ? { stale } : {})}
      />,
    ).container.querySelector(".jn") as HTMLElement;

  test("renders jn-stale when stale", () => {
    expect(root(true).classList.contains("jn-stale")).toBe(true);
  });
  test("omits jn-stale when not stale", () => {
    expect(root(false).classList.contains("jn-stale")).toBe(false);
    expect(root().classList.contains("jn-stale")).toBe(false);
  });
});

describe("<Journey/> — the owner marker", () => {
  test("each gate chip in a step carries jn-chip", () => {
    const journey = {
      steps: [GATES_RED],
      stations: [
        {
          phase: "gates",
          status: "bad",
          durationMs: 10_000,
          share: 1,
          steps: [GATES_RED],
          pending: [],
          rounds: 0,
        },
      ],
      total: 10_000,
      stationDur: ["10s"],
    } as const;
    const { container } = render(
      <Journey
        journey={journey}
        upNext={[]}
        faces={RUN_FACES}
        scope={undefined}
        onScope={() => {}}
        onHover={() => {}}
        labels={LABELS}
      />,
    );
    const chips = [...container.querySelectorAll(".jn-step .chip")];
    expect(chips).toHaveLength(3);
    expect(chips.every((c) => c.classList.contains("jn-chip"))).toBe(true);
  });
});

describe("<Journey/> — a journaled rig never reads as unjournaled", () => {
  test("the committed run, whose agent steps all carry a rig, never says the rig was not journaled", () => {
    const { container } = render(
      <Journey
        journey={JOURNEY}
        upNext={[]}
        faces={RUN_FACES}
        scope={undefined}
        onScope={() => {}}
        onHover={() => {}}
        labels={LABELS}
      />,
    );
    expect(container.textContent).not.toContain(LABELS.rigNotJournaled);
  });
});
