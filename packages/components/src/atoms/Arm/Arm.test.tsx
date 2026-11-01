// `<Arm/>` tests: the density variant of the focus panel's control.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { Arm } from "./Arm";

afterEach(cleanup);

const button = (c: Element) => c.querySelector("button") as HTMLButtonElement;

describe('<Arm/> — density="rail"', () => {
  test("renders arm-rail on the button and keeps its state classes", () => {
    const { container } = render(
      <Arm
        id="x"
        glyph="⏸"
        label="pause"
        tone="bad"
        armed
        dashed
        density="rail"
        onClick={() => {}}
      />,
    );
    expect(button(container).className).toBe("arm t-bad arm-rail armed dashed");
  });

  test("no density, no modifier", () => {
    const { container } = render(
      <Arm id="x" glyph="⏸" label="pause" tone="ok" onClick={() => {}} />,
    );
    expect(button(container).className).toBe("arm t-ok");
  });
});
