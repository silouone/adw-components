// `<AutonomyChips/>` tests: the read-only `shadow` chip per target in the board header.

import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/preact";
import { CHIPS, CHIPS_MARKUP, CHIPS_UNSORTED, SHADOW_LABEL } from "../../../fixtures/AutonomyChips";
import { AutonomyChips } from "./AutonomyChips";

afterEach(cleanup);

const css = readFileSync(new URL("./AutonomyChips.css", import.meta.url), "utf8");

describe("<AutonomyChips/>", () => {
  test("one span per target, labelled shadow with the level", () => {
    const { container } = render(<AutonomyChips autonomy={CHIPS} label={SHADOW_LABEL} />);
    const chips = container.querySelectorAll("span.autonomy-chip");
    expect(chips).toHaveLength(1);
    const chip = chips[0] as HTMLElement;
    expect(chip.tagName).toBe("SPAN");
    expect(chip.children).toHaveLength(0);
    expect(chip.textContent).toBe("silou-hq shadow HOTL");
  });

  test("the tooltip carries the reason", () => {
    const { container } = render(<AutonomyChips autonomy={CHIPS} label={SHADOW_LABEL} />);
    expect((container.querySelector(".autonomy-chip") as HTMLElement).title).toBe(
      "silou-hq · shadow — HOTL: chore · merge: at the edge",
    );
  });

  test("undefined and {} render nothing", () => {
    expect(
      render(<AutonomyChips autonomy={undefined} label={SHADOW_LABEL} />).container.innerHTML,
    ).toBe("");
    cleanup();
    expect(render(<AutonomyChips autonomy={{}} label={SHADOW_LABEL} />).container.innerHTML).toBe(
      "",
    );
  });

  test("two targets render two chips in key-sorted order", () => {
    const { container } = render(<AutonomyChips autonomy={CHIPS_UNSORTED} label={SHADOW_LABEL} />);
    expect([...container.querySelectorAll(".autonomy-chip")].map((el) => el.textContent)).toEqual([
      "alpha shadow HOOTL",
      "zeta shadow HITL",
    ]);
  });

  test("is not interactive", () => {
    const { container } = render(<AutonomyChips autonomy={CHIPS} label={SHADOW_LABEL} />);
    expect(container.querySelector("button, a, [onclick]")).toBeNull();
  });

  test("its own stylesheet styles it", () => {
    expect(css).toContain(".autonomy-chip");
  });

  test.each(["HITL", "HOTL", "HOOTL"] as const)("labels %s", (level) => {
    const { container } = render(
      <AutonomyChips autonomy={{ t: { level, reason: "r" } }} label={SHADOW_LABEL} />,
    );
    expect(container.querySelector(".autonomy-chip")?.textContent).toBe(`t shadow ${level}`);
  });

  test("markup in a reason or target name is not injected", () => {
    const { container } = render(<AutonomyChips autonomy={CHIPS_MARKUP} label={SHADOW_LABEL} />);
    expect(container.querySelector("b, img")).toBeNull();
    const chip = container.querySelector(".autonomy-chip") as HTMLElement;
    expect(chip.textContent).toBe("<b>t</b> shadow HITL");
    expect(chip.title).toContain("<img src=x>");
  });

  test("re-rendering with a new level updates the same chip", () => {
    const { container, rerender } = render(
      <AutonomyChips autonomy={{ t: { level: "HITL", reason: "a" } }} label={SHADOW_LABEL} />,
    );
    rerender(
      <AutonomyChips autonomy={{ t: { level: "HOTL", reason: "b" } }} label={SHADOW_LABEL} />,
    );
    const chips = container.querySelectorAll(".autonomy-chip");
    expect(chips).toHaveLength(1);
    expect(chips[0]?.textContent).toBe("t shadow HOTL");
  });
});
