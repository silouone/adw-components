// `<BaseRedChip/>` tests: the status chip a run wears when it went green over a red base.

import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/preact";
import {
  BASE_RED,
  BASE_RED_LABELS,
  BASE_RED_ONE_GATE,
  BASE_RED_SHORT_SHA,
  BASE_RED_THREE_GATES,
} from "../../../fixtures/BaseRedChip";
import { BaseRedChip, baseRedTitle } from "./BaseRedChip";

afterEach(cleanup);

const css = readFileSync(new URL("./BaseRedChip.css", import.meta.url), "utf8");

describe("<BaseRedChip/>", () => {
  test("the title names the 7-char sha and each red gate with its count", () => {
    expect(baseRedTitle(BASE_RED, BASE_RED_LABELS)).toBe(
      "base abcdef1 was red: test (12 tests), lint (2 tests)",
    );
  });

  test("renders a span.base-red-chip reading 'base red' with that title", () => {
    const { container } = render(<BaseRedChip baseRed={BASE_RED} labels={BASE_RED_LABELS} />);
    const chip = container.querySelector(".base-red-chip") as HTMLElement;
    expect(chip.tagName).toBe("SPAN");
    expect(chip.textContent).toBe("base red");
    expect(chip.children.length).toBe(0);
    expect(chip.getAttribute("title")).toBe(baseRedTitle(BASE_RED, BASE_RED_LABELS));
  });

  test("renders nothing for undefined", () => {
    const { container } = render(<BaseRedChip baseRed={undefined} labels={BASE_RED_LABELS} />);
    expect(container.innerHTML).toBe("");
  });

  test("the chip never wraps or shrinks, and is a filled block in the red status hue", () => {
    const rule = /\.base-red-chip\s*\{([^}]*)\}/.exec(css)?.[1]?.replace(/\s+/g, "") ?? "";
    expect(rule).toContain("white-space:nowrap");
    expect(rule).toContain("flex:none");
    expect(rule).toContain("background:var(--bad)");
    expect(rule).not.toContain("font-family");
  });
});

describe("baseRedTitle — edges", () => {
  test("a sha shorter than seven chars is kept whole", () => {
    expect(baseRedTitle(BASE_RED_SHORT_SHA, BASE_RED_LABELS)).toBe(
      "base abc was red: test (3 tests)",
    );
  });

  test("a single gate carries no separator", () => {
    const title = baseRedTitle(BASE_RED_ONE_GATE, BASE_RED_LABELS);
    expect(title).toBe("base abcdef1 was red: lint (2 tests)");
    expect(title).not.toContain(",");
  });

  test("the title lists every gate in order", () => {
    expect(baseRedTitle(BASE_RED_THREE_GATES, BASE_RED_LABELS)).toBe(
      "base abcdef1 was red: a (1 tests), b (2 tests), c (3 tests)",
    );
  });

  test("the chip is not interactive", () => {
    const { container } = render(<BaseRedChip baseRed={BASE_RED} labels={BASE_RED_LABELS} />);
    const chip = container.querySelector(".base-red-chip") as HTMLElement;
    expect(chip.getAttribute("href")).toBeNull();
    expect(chip.getAttribute("role")).toBeNull();
    expect(chip.getAttribute("tabindex")).toBeNull();
    expect(container.querySelector("a,button")).toBeNull();
  });
});
