// `<BacklogFrame/>` renders from props: the stale flag, its notice, the head's custom properties and the
// six slots (chips, desk, hero, sections, panel, drawer) arrive as values; stub elements fill the
// slots. Literal view models from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { createRef } from "preact";
import { BACKLOG_NOTICE, BACKLOG_STYLE } from "../../../fixtures/BacklogFrame";
import { BacklogFrame, type BacklogFrameProps } from "./BacklogFrame";

afterEach(cleanup);

const mount = (over: Partial<BacklogFrameProps> = {}) =>
  render(
    <BacklogFrame
      stale={false}
      chips={<i data-slot="chips" />}
      sections={<i data-slot="sections" />}
      {...over}
    />,
  );

const root = (c: Element) => c.querySelector(".backlog-frame") as HTMLElement;
const slotOf = (el: Element) => el.getAttribute("data-slot") ?? el.className;

describe("<BacklogFrame/>", () => {
  test("slot order inside the root: head(chips), desk, hero, sections, panel, drawer", () => {
    const { container } = mount({
      desk: <i data-slot="desk" />,
      hero: <i data-slot="hero" />,
      panel: <i data-slot="panel" />,
      drawer: <i data-slot="drawer" />,
    });
    const kids = Array.from(root(container).children);
    expect(kids.map(slotOf)).toEqual([
      "backlog-frame-head",
      "desk",
      "hero",
      "sections",
      "panel",
      "drawer",
    ]);
    expect(kids[0]?.querySelector("[data-slot=chips]")).not.toBeNull();
  });

  test("absent desk/hero/panel/drawer render nothing; chips and sections are required", () => {
    const { container } = mount();
    expect(Array.from(root(container).children).map(slotOf)).toEqual([
      "backlog-frame-head",
      "sections",
    ]);
  });

  test("style is applied to the root as given (custom property present)", () => {
    const { container } = mount({ style: BACKLOG_STYLE });
    expect(root(container).style.getPropertyValue("--bl-head-top")).toBe("48px");
  });

  test("no style leaves the root without a style attribute", () => {
    expect(root(mount().container).hasAttribute("style")).toBe(false);
  });

  test("the notice is text, never markup", () => {
    const { container } = mount({ stale: true, staleNotice: "<b>dropped</b>" });
    const p = container.querySelector("p") as HTMLElement;
    expect(p.textContent).toBe("<b>dropped</b>");
    expect(p.querySelector("b")).toBeNull();
  });

  test("the notice paragraph is outside the root, the head is the root's first child", () => {
    const { container } = mount({ stale: true, staleNotice: BACKLOG_NOTICE });
    expect(root(container).querySelector("p")).toBeNull();
    expect(root(container).firstElementChild?.className).toBe("backlog-frame-head");
  });

  test("an explicitly undefined headRef is accepted like an absent one", () => {
    const { container } = mount({ headRef: undefined });
    expect(container.querySelector(".backlog-frame-head")).not.toBeNull();
  });

  test("headRef receives the head div; absent headRef is fine", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = mount({ headRef: ref });
    expect(ref.current).toBe(container.querySelector(".backlog-frame-head"));
    cleanup();
    expect(mount().container.querySelector(".backlog-frame-head")).not.toBeNull();
  });

  test("stale + staleNotice renders the status paragraph before the root and the stale modifier; stale alone renders only the modifier", () => {
    const { container } = mount({ stale: true, staleNotice: BACKLOG_NOTICE });
    const p = container.firstElementChild as HTMLElement;
    expect(p.tagName).toBe("P");
    expect(p.getAttribute("role")).toBe("status");
    expect(p.textContent).toBe(BACKLOG_NOTICE);
    expect(container.children[1]).toBe(root(container));
    expect(root(container).classList.contains("backlog-frame-stale")).toBe(true);
    cleanup();
    const alone = mount({ stale: true });
    expect(alone.container.querySelector("p")).toBeNull();
    expect(root(alone.container).classList.contains("backlog-frame-stale")).toBe(true);
    cleanup();
    expect(
      root(mount({ staleNotice: BACKLOG_NOTICE }).container).classList.contains(
        "backlog-frame-stale",
      ),
    ).toBe(false);
  });
});
