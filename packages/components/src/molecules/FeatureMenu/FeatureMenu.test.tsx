// `<FeatureMenu/>` and `<ProjectFeaturePanel/>` tests: the two-level feature picker.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { createRef } from "preact";
import { FEATURE_LABELS, FEATURE_TREE, FEATURE_TREE_EMPTY } from "../../../fixtures/FeatureMenu";
import { FeatureMenu, type FeatureMenuProps, ProjectFeaturePanel } from "./FeatureMenu";

afterEach(cleanup);

const props = (over: Partial<FeatureMenuProps> = {}): FeatureMenuProps => ({
  hook: "bfeature",
  class: "wide",
  heading: "all features",
  buttonClass: "chip",
  labels: FEATURE_LABELS,
  tree: FEATURE_TREE,
  picked: undefined,
  onPick: () => {},
  open: true,
  onOpen: () => {},
  onClose: () => {},
  rootRef: createRef<HTMLSpanElement>(),
  ...over,
});

describe("<FeatureMenu/>", () => {
  test("closed: only the chip, naming « no feature » when nothing is picked", () => {
    const { container } = render(<FeatureMenu {...props({ open: false })} />);
    expect(container.querySelector(".bl-fmenu-list")).toBeNull();
    const chip = container.querySelector("button.chip") as HTMLElement;
    expect(chip.getAttribute("aria-expanded")).toBe("false");
    expect(chip.textContent).toBe("— no feature — ▾");
    expect(container.querySelector("[data-bfeature]")).not.toBeNull();
  });

  test("the chip opens when closed and closes when open", () => {
    const onOpen = mock(() => {});
    const onClose = mock(() => {});
    const closed = render(<FeatureMenu {...props({ open: false, onOpen, onClose })} />);
    fireEvent.click(closed.container.querySelector("button.chip") as HTMLElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
    cleanup();
    const opened = render(<FeatureMenu {...props({ onOpen, onClose })} />);
    fireEvent.click(opened.container.querySelector("button.chip") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("open: header, « no feature », the tree with counts and the unfiled footer", () => {
    const { container } = render(<FeatureMenu {...props()} />);
    expect(container.querySelector(".bl-fm-head")?.textContent).toBe("all featuresopendone");
    expect(container.querySelectorAll("[data-fopt]")).toHaveLength(5);
    expect(container.querySelector('[data-fopt="board"] b')?.textContent).toBe("4");
    expect(container.querySelector('[data-fopt="board"] .bl-fm-span')?.textContent).toBe("↔2");
    expect(container.querySelector('[data-fopt="board/cards"] span')?.textContent).toBe("cards");
    expect(container.querySelector('[data-fopt="tokens"]')?.className).toContain("idle");
    expect(container.querySelector('[data-fopt="tokens"] b')?.textContent).toBe("–");
    expect(container.querySelector(".bl-fm-foot")?.textContent).toBe(
      "unfiled · bugs and one-offs · 2 open",
    );
  });

  test("the picked feature is marked on, and « no feature » is on when none is picked", () => {
    const picked = render(<FeatureMenu {...props({ picked: "board/cards" })} />).container;
    expect(picked.querySelector('[data-fopt="board/cards"]')?.className).toContain(" on");
    expect(picked.querySelector('[data-fopt=""]')?.className).not.toContain(" on");
    expect(picked.querySelector(".bl-fmenu")?.getAttribute("data-value")).toBe("board/cards");
    cleanup();
    const none = render(<FeatureMenu {...props()} />).container;
    expect(none.querySelector('[data-fopt=""]')?.className).toContain(" on");
  });

  test("picking a row closes the menu and reports the name; « no feature » reports an empty one", () => {
    const calls: string[] = [];
    const { container } = render(
      <FeatureMenu
        {...props({
          onClose: () => calls.push("close"),
          onPick: (name) => calls.push(`pick:${name}`),
        })}
      />,
    );
    fireEvent.click(container.querySelector('[data-fopt="board/filters"]') as HTMLElement);
    fireEvent.click(container.querySelector('[data-fopt=""]') as HTMLElement);
    expect(calls).toEqual(["close", "pick:board/filters", "close", "pick:"]);
  });

  test("the progress bar is done over total, and an empty total is 0%", () => {
    const { container } = render(
      <FeatureMenu
        {...props({
          tree: {
            groups: [
              {
                top: { name: "empty", label: "empty", open: 0, done: 0, total: 0, spans: 1 },
                children: [],
              },
            ],
            unfiled: 0,
          },
        })}
      />,
    );
    const bar = container.querySelector('[data-fopt="empty"] .bl-fm-bar > i') as HTMLElement;
    expect(bar.style.width).toBe("0%");
    cleanup();
    const half = render(<FeatureMenu {...props()} />).container;
    expect(
      (half.querySelector('[data-fopt="board/cards"] .bl-fm-bar > i') as HTMLElement).style.width,
    ).toBe("40%");
  });

  test("an empty tree still offers « no feature »", () => {
    const { container } = render(<FeatureMenu {...props({ tree: FEATURE_TREE_EMPTY })} />);
    expect(container.querySelectorAll("[data-fopt]")).toHaveLength(1);
  });
});

describe("<ProjectFeaturePanel/>", () => {
  test("the menu's rows for one project, with no « no feature » row", () => {
    const onPick = mock((_name: string) => {});
    const { container } = render(
      <ProjectFeaturePanel
        heading="adw-factory · features"
        labels={FEATURE_LABELS}
        tree={FEATURE_TREE}
        onPick={onPick}
      />,
    );
    expect(container.querySelector(".bl-pm-head")?.textContent).toBe(
      "adw-factory · featuresopendone",
    );
    expect(container.querySelectorAll("[data-pfopt]")).toHaveLength(4);
    expect(container.querySelector('[data-fopt=""]')).toBeNull();
    fireEvent.click(container.querySelector('[data-pfopt="tokens"]') as HTMLElement);
    expect(onPick).toHaveBeenCalledWith("tokens");
    expect(container.querySelector(".bl-pm-foot")?.textContent).toBe(
      "unfiled · bugs and one-offs · 2 open",
    );
  });
});
