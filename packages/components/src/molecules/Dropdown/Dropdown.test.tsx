// `<Dropdown/>` tests: the one chip gesture — hover shows the panel, a click pins it,
// focus inside pins it. The component is controlled, so the tests drive it with a small
// host that keeps the page's hovered/pinned state the way a page does.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { ALPHA, BETA } from "../../../fixtures/Dropdown";
import { Dropdown, type DropdownChange } from "./Dropdown";

afterEach(cleanup);

interface PageState {
  readonly hovered: string | undefined;
  readonly pinned: string | undefined;
}

const next = (state: PageState, id: string, change: DropdownChange): PageState => {
  switch (change) {
    case "enter":
      return { ...state, hovered: id };
    case "leave":
      return { ...state, hovered: state.hovered === id ? undefined : state.hovered };
    case "toggle":
      return { ...state, pinned: state.pinned === id ? undefined : id };
    case "focus":
      return { ...state, pinned: id };
  }
};

function Two({ initial }: { readonly initial?: PageState }) {
  const [state, setState] = useState<PageState>(
    initial ?? { hovered: undefined, pinned: undefined },
  );
  const props = (id: string) => ({
    id,
    open: state.pinned === id || state.hovered === id,
    pinned: state.pinned === id,
    onOpenChange: (change: DropdownChange) => setState((s) => next(s, id, change)),
  });
  return (
    <>
      <Dropdown {...props(ALPHA.id)} chip={<b>{ALPHA.chip}</b>}>
        <span class="in-a">{ALPHA.panel}</span>
      </Dropdown>
      <Dropdown {...props(BETA.id)} chip={<b>{BETA.chip}</b>}>
        <span class="in-b">{BETA.panel}</span>
      </Dropdown>
      <p class="outside">elsewhere</p>
    </>
  );
}

const dd = (c: Element, id: string) => c.querySelector(`.dd[data-dd="${id}"]`) as HTMLElement;
const chip = (c: Element, id: string) => dd(c, id).querySelector(".dd-chip") as HTMLButtonElement;
const panel = (c: Element, id: string) => dd(c, id).querySelector(".dd-panel") as HTMLElement;
const isPinned = (c: Element, id: string) => dd(c, id).classList.contains("dd-on");

describe("<Dropdown/> — the hover and pin gesture", () => {
  test("the panel is hidden at rest, a chip button with a ▾ caret", () => {
    const { container } = render(<Two />);
    expect(panel(container, "a").hidden).toBe(true);
    expect(chip(container, "a").getAttribute("type")).toBe("button");
    expect(chip(container, "a").textContent).toBe("alpha▾");
    expect(chip(container, "a").getAttribute("aria-expanded")).toBe("false");
  });

  test("hovering the chip shows the panel; leaving hides it", () => {
    const { container } = render(<Two />);
    fireEvent.mouseEnter(dd(container, "a"));
    expect(panel(container, "a").hidden).toBe(false);
    expect(panel(container, "b").hidden).toBe(true);
    expect(chip(container, "a").getAttribute("aria-expanded")).toBe("true");
    fireEvent.mouseLeave(dd(container, "a"));
    expect(panel(container, "a").hidden).toBe(true);
  });

  test("the panel is a DOM child of .dd, so the pointer never leaves it", () => {
    const { container } = render(<Two />);
    expect(panel(container, "a").parentElement).toBe(dd(container, "a"));
    expect(panel(container, "a").querySelector(".in-a")).not.toBeNull();
  });

  test("a click pins (border class), stays open after leave; a second click unpins", () => {
    const { container } = render(<Two />);
    fireEvent.mouseEnter(dd(container, "a"));
    fireEvent.click(chip(container, "a"));
    expect(isPinned(container, "a")).toBe(true);
    fireEvent.mouseLeave(dd(container, "a"));
    expect(panel(container, "a").hidden).toBe(false);
    fireEvent.click(chip(container, "a"));
    expect(isPinned(container, "a")).toBe(false);
    expect(panel(container, "a").hidden).toBe(true);
  });

  test("one pinned at a time: pinning b unpins a", () => {
    const { container } = render(<Two />);
    fireEvent.click(chip(container, "a"));
    fireEvent.click(chip(container, "b"));
    expect(isPinned(container, "a")).toBe(false);
    expect(isPinned(container, "b")).toBe(true);
  });

  test("focus inside the panel pins it, so typing survives the pointer leaving", () => {
    const { container } = render(<Two />);
    fireEvent.focusIn(panel(container, "a"));
    expect(isPinned(container, "a")).toBe(true);
  });
});

describe("<Dropdown/> — gesture edges", () => {
  test("hovering b while a is pinned shows both; leaving b leaves a pinned and open", () => {
    const { container } = render(<Two />);
    fireEvent.click(chip(container, "a"));
    fireEvent.mouseEnter(dd(container, "b"));
    expect(panel(container, "a").hidden).toBe(false);
    expect(panel(container, "b").hidden).toBe(false);
    fireEvent.mouseLeave(dd(container, "b"));
    expect(panel(container, "a").hidden).toBe(false);
    expect(panel(container, "b").hidden).toBe(true);
    expect(isPinned(container, "a")).toBe(true);
  });

  test("hovering a pinned dropdown and leaving it does not unpin it", () => {
    const { container } = render(<Two />);
    fireEvent.click(chip(container, "a"));
    fireEvent.mouseEnter(dd(container, "a"));
    fireEvent.mouseLeave(dd(container, "a"));
    expect(isPinned(container, "a")).toBe(true);
  });

  test("focus inside b's panel moves the pin from a to b", () => {
    const { container } = render(<Two />);
    fireEvent.click(chip(container, "a"));
    fireEvent.focusIn(panel(container, "b"));
    expect(isPinned(container, "b")).toBe(true);
    expect(isPinned(container, "a")).toBe(false);
  });

  test("aria-expanded follows hover and pin, and is false at rest", () => {
    const { container } = render(<Two />);
    expect(chip(container, "a").getAttribute("aria-expanded")).toBe("false");
    fireEvent.mouseEnter(dd(container, "a"));
    expect(chip(container, "a").getAttribute("aria-expanded")).toBe("true");
    fireEvent.mouseLeave(dd(container, "a"));
    fireEvent.click(chip(container, "a"));
    expect(chip(container, "a").getAttribute("aria-expanded")).toBe("true");
    expect(chip(container, "b").getAttribute("aria-expanded")).toBe("false");
  });

  test("the panel stays mounted while closed, so its content survives", () => {
    const { container } = render(<Two />);
    expect(container.querySelector(".in-a")).not.toBeNull();
    expect(panel(container, "a").hidden).toBe(true);
  });

  test("an extra class lands on the .dd root next to dd-on", () => {
    const { container } = render(
      <Dropdown id="x" open={false} pinned onOpenChange={() => {}} chip="x" class="wide">
        body
      </Dropdown>,
    );
    expect(dd(container, "x").className).toBe("dd dd-on wide");
  });

  test("each gesture reports its change through onOpenChange", () => {
    const changes: DropdownChange[] = [];
    const { container } = render(
      <Dropdown
        id="x"
        open={false}
        pinned={false}
        onOpenChange={(change) => changes.push(change)}
        chip="x"
      >
        <input />
      </Dropdown>,
    );
    fireEvent.mouseEnter(dd(container, "x"));
    fireEvent.mouseLeave(dd(container, "x"));
    fireEvent.click(chip(container, "x"));
    fireEvent.focusIn(panel(container, "x"));
    expect(changes).toEqual(["enter", "leave", "toggle", "focus"]);
  });
});

describe("<Dropdown/> — warn", () => {
  const chipClass = (c: Element) => c.querySelector(".dd-chip")?.className;
  const noop = () => {};

  test("warn marks the chip dd-chip-warn", () => {
    const { container } = render(
      <Dropdown id="w" open={false} pinned={false} onOpenChange={noop} warn chip={<b>w</b>}>
        <span />
      </Dropdown>,
    );
    expect(chipClass(container)).toBe("dd-chip dd-chip-warn");
  });

  test("a pinned warn chip has no warn marker", () => {
    const { container } = render(
      <Dropdown id="w" open pinned onOpenChange={noop} warn chip={<b>w</b>}>
        <span />
      </Dropdown>,
    );
    expect(chipClass(container)).toBe("dd-chip");
  });

  test("no warn, no marker", () => {
    const { container } = render(
      <Dropdown id="w" open={false} pinned={false} onOpenChange={noop} chip={<b>w</b>}>
        <span />
      </Dropdown>,
    );
    expect(chipClass(container)).toBe("dd-chip");
  });
});
