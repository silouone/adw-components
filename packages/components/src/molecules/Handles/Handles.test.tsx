// `<Handles/>` tests: the eight handle rows and the command buttons.

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import {
  HANDLES_FINISHED,
  HANDLES_FULL,
  HANDLES_LABELS,
  HANDLES_PUBLISH,
  HANDLES_SHORT,
  WORKSPACE,
} from "../../../fixtures/Handles";
import { Handles, type HandlesProps } from "./Handles";

const writeText = mock(async (_t: string) => {});
const onCopy = mock((_text: string) => {});
beforeEach(() => {
  writeText.mockClear();
  onCopy.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});
afterEach(cleanup);

const view = (over: Partial<HandlesProps> = {}) => (
  <Handles view={HANDLES_FULL} labels={HANDLES_LABELS} onCopy={onCopy} {...over} />
);
const row = (c: Element, key: string) =>
  c.querySelector(`[data-handle="${key}"]`) as HTMLButtonElement;

describe("<Handles/>", () => {
  test("eyebrow with the click-to-copy label", () => {
    const { container } = render(view());
    expect(container.querySelector(".eyebrow")?.textContent).toContain("handles");
    expect(container.textContent).toContain("click to copy");
  });

  test("eight rows from a full view, tails with the full value in the tooltip", () => {
    const { container } = render(view());
    expect(container.querySelectorAll("[data-handle]").length).toBe(8);
    const ws = row(container, "workspace");
    expect(ws.title).toBe(WORKSPACE);
    expect(ws.textContent).toContain(HANDLES_FULL.rows[2]?.shown as string);
    expect(ws.textContent).toContain("worktree");
    expect(row(container, "pr").textContent).toContain("#12 open");
  });

  test("a short value shows no ellipsis", () => {
    const { container } = render(view({ view: HANDLES_SHORT }));
    expect(row(container, "ticket").textContent).toContain("sabado-1");
    expect(row(container, "ticket").textContent).not.toContain("…");
  });

  test("clicking a row copies the FULL value and flashes copied", () => {
    const { container } = render(view());
    fireEvent.click(row(container, "workspace"));
    expect(onCopy).toHaveBeenCalledWith(WORKSPACE);
    expect(writeText).not.toHaveBeenCalled();
    expect(row(container, "workspace").textContent).toContain("copied");
    expect(row(container, "branch").textContent).not.toContain("copied");
  });

  test("the flash reverts", async () => {
    const { container } = render(view({ flashMs: 20 }));
    fireEvent.click(row(container, "branch"));
    await waitFor(() => expect(row(container, "branch").textContent).not.toContain("copied"));
  });

  test("command buttons copy the complete commands", () => {
    const { container } = render(view());
    const buttons = [...container.querySelectorAll("[data-cmd]")] as HTMLButtonElement[];
    expect(buttons.map((b) => b.title)).toEqual(HANDLES_FULL.commands.map((c) => c.command));
    fireEvent.click(buttons[0] as HTMLButtonElement);
    expect(onCopy).toHaveBeenCalledWith(HANDLES_FULL.commands[0]?.command as string);
    expect(buttons[0]?.textContent).toBe("copied");
  });

  test("a view without the watch command renders no watch button", () => {
    const { container } = render(view({ view: HANDLES_FINISHED }));
    expect(container.querySelector('[data-cmd="watch"]')).toBeNull();
  });

  test("a publish command renders only when the view carries it", () => {
    const { container } = render(view({ view: HANDLES_PUBLISH }));
    const publish = container.querySelector('[data-cmd="publish"]') as HTMLButtonElement;
    expect(publish.title).toBe("adw publish --target sabado --ticket adw-board-15-handles");
    cleanup();
    const plain = render(view({ view: HANDLES_FINISHED }));
    expect(plain.container.querySelector('[data-cmd="publish"]')).toBeNull();
  });
});

describe('<Handles/> — density="rail"', () => {
  const all = (c: Element, sel: string) => [...c.querySelectorAll(sel)];

  test("renders the modifier on every restyled element", () => {
    const { container } = render(view({ density: "rail" }));
    for (const [sel, cls] of [
      [".rt-sec", "rt-rail"],
      [".hd-row", "hd-rail"],
      [".hd-key", "hd-rail"],
      [".hd-hint", "hd-rail"],
      [".hd-cmds", "hd-rail"],
      [".hd-cmd", "hd-rail"],
    ] as const) {
      const els = all(container, sel);
      expect(els.length).toBeGreaterThan(0);
      for (const e of els) expect(e.classList.contains(cls)).toBe(true);
    }
  });

  test("no density, no modifier", () => {
    const { container } = render(view());
    expect(container.querySelector('[class*="-rail"]')).toBeNull();
  });
});
