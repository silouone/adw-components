// `<ShellFrame/>` renders from props: the rails' open states and widths, the stale flag and its notice
// arrive as values; the three regions are slots, filled here with stub elements. Literal view models
// from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { SHELL_NOTICE, SHELL_RAIL1_WIDTH, SHELL_RAIL2_WIDTH } from "../../../fixtures/ShellFrame";
import { ShellFrame, type ShellFrameProps } from "./ShellFrame";

afterEach(cleanup);

const mount = (over: Partial<ShellFrameProps> = {}) =>
  render(
    <ShellFrame
      rail1={<i data-slot="rail1" />}
      rail2={<i data-slot="rail2" />}
      stage={<i data-slot="stage" />}
      rail1Open={false}
      rail2Open={false}
      stale={false}
      {...over}
    />,
  );

const grid = (c: Element) => c.querySelector(".shell-frame") as HTMLElement;

describe("<ShellFrame/>", () => {
  test("grid order: rail1, rail2, then the stage <main> holding the stage slot", () => {
    const { container } = mount();
    const kids = Array.from(grid(container).children);
    expect(kids.map((k) => k.getAttribute("data-slot") ?? k.tagName.toLowerCase())).toEqual([
      "rail1",
      "rail2",
      "main",
    ]);
    const stage = kids[2] as HTMLElement;
    expect(stage.className).toBe("shell-frame-stage");
    expect(stage.querySelector("[data-slot=stage]")).not.toBeNull();
  });

  test.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ] as const)(
    "the four rail states: rail1Open=%p rail2Open=%p set data attributes and modifiers",
    (r1, r2) => {
      const el = grid(mount({ rail1Open: r1, rail2Open: r2 }).container);
      expect(el.dataset.rail1).toBe(r1 ? "open" : "closed");
      expect(el.dataset.rail2).toBe(r2 ? "open" : "closed");
      expect(el.classList.contains("shell-frame-rail1-open")).toBe(r1);
      expect(el.classList.contains("shell-frame-rail2-open")).toBe(r2);
    },
  );

  test("widths land as --adw-shell-frame-rail1/2 custom properties when given; absent → no inline style", () => {
    const sized = grid(
      mount({ rail1Width: SHELL_RAIL1_WIDTH, rail2Width: SHELL_RAIL2_WIDTH }).container,
    );
    expect(sized.style.getPropertyValue("--adw-shell-frame-rail1")).toBe(SHELL_RAIL1_WIDTH);
    expect(sized.style.getPropertyValue("--adw-shell-frame-rail2")).toBe(SHELL_RAIL2_WIDTH);
    cleanup();
    expect(grid(mount().container).hasAttribute("style")).toBe(false);
  });

  test("stale + staleNotice renders a role=status paragraph above the grid and the stale modifier", () => {
    const { container } = mount({ stale: true, staleNotice: SHELL_NOTICE });
    const p = container.firstElementChild as HTMLElement;
    expect(p.tagName).toBe("P");
    expect(p.getAttribute("role")).toBe("status");
    expect(p.textContent).toBe(SHELL_NOTICE);
    expect(container.children[1]).toBe(grid(container));
    expect(grid(container).classList.contains("shell-frame-stale")).toBe(true);
  });

  test("stale without a notice marks the grid stale and renders no paragraph; notice without stale renders none", () => {
    const stale = mount({ stale: true });
    expect(stale.container.querySelector("p")).toBeNull();
    expect(grid(stale.container).classList.contains("shell-frame-stale")).toBe(true);
    cleanup();
    const live = mount({ staleNotice: SHELL_NOTICE });
    expect(live.container.querySelector("p")).toBeNull();
    expect(grid(live.container).classList.contains("shell-frame-stale")).toBe(false);
  });

  test("a single width sets only its own custom property, whatever the rail's open state", () => {
    const first = grid(mount({ rail1Width: SHELL_RAIL1_WIDTH, rail1Open: false }).container);
    expect(first.style.getPropertyValue("--adw-shell-frame-rail1")).toBe(SHELL_RAIL1_WIDTH);
    expect(first.style.getPropertyValue("--adw-shell-frame-rail2")).toBe("");
    cleanup();
    const second = grid(mount({ rail2Width: SHELL_RAIL2_WIDTH, rail2Open: true }).container);
    expect(second.style.getPropertyValue("--adw-shell-frame-rail1")).toBe("");
    expect(second.style.getPropertyValue("--adw-shell-frame-rail2")).toBe(SHELL_RAIL2_WIDTH);
  });

  test("the notice is text, never markup", () => {
    const { container } = mount({ stale: true, staleNotice: "<b>dropped</b>" });
    const p = container.querySelector("p") as HTMLElement;
    expect(p.textContent).toBe("<b>dropped</b>");
    expect(p.querySelector("b")).toBeNull();
  });

  test("absent slot content renders empty regions, not a missing stage", () => {
    const { container } = render(
      <ShellFrame rail1={null} rail2={undefined} stage={null} rail1Open rail2Open stale={false} />,
    );
    const kids = Array.from(grid(container).children);
    expect(kids.map((k) => k.tagName.toLowerCase())).toEqual(["main"]);
    expect(kids[0]?.childElementCount).toBe(0);
  });

  test("slots are not rendered inside each other (rail slots stay siblings of the stage)", () => {
    const { container } = mount();
    const stage = container.querySelector(".shell-frame-stage") as HTMLElement;
    expect(stage.querySelector("[data-slot=rail1]")).toBeNull();
    expect(stage.querySelector("[data-slot=rail2]")).toBeNull();
    expect(container.querySelectorAll("[data-slot=stage]").length).toBe(1);
  });
});
