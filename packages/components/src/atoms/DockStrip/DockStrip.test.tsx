import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { FAILURE_LINE } from "../../../fixtures/DockStrip";
import { DockStrip } from "./DockStrip";

afterEach(cleanup);

describe("<DockStrip/>", () => {
  test("a failure reads as one --bad line", () => {
    const { container } = render(<DockStrip line={FAILURE_LINE} />);
    const line = container.querySelector(".rp-fail");
    expect(line?.textContent).toBe(FAILURE_LINE);
    expect(line?.getAttribute("title")).toBe(line?.textContent ?? "");
  });

  test("no failure draws nothing", () => {
    const { container } = render(<DockStrip />);
    expect(container.innerHTML).toBe("");
  });
});
