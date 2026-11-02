// `<RunPage/>` renders from one view and reports through its actions: no signal, no clock, no
// viewport read. Literal view models from the fixtures.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { hrefFor } from "../../../fixtures/RunRounds";
import { RUN_PAGE_BASE, RUN_SCREEN, RUN_PAGE_GRID_URL } from "../../../fixtures/RunPage";
import { RunPage, type RunPageActions, type RunPageView } from "./RunPage";

afterEach(cleanup);

const actions = (): RunPageActions => ({
  onScope: mock(() => {}),
  onClose: mock(() => {}),
  onHover: mock(() => {}),
  onViewTab: mock(() => {}),
  onFullScreen: mock(() => {}),
  onShutDock: mock(() => {}),
  onMarkdownToggle: mock(() => {}),
  hrefFor,
});

const withRun: RunPageView = { ...RUN_PAGE_BASE, run: RUN_SCREEN };

const mount = (view: RunPageView, a: RunPageActions = actions()) =>
  render(<RunPage view={view} actions={a} />);

describe("<RunPage/>", () => {
  test("before the first frame only the crumb renders", () => {
    const { container } = mount(RUN_PAGE_BASE);
    const crumb = container.querySelector("a.run-page-frame-crumb") as HTMLAnchorElement;
    expect(crumb.getAttribute("href")).toBe(RUN_PAGE_GRID_URL);
    expect(crumb.textContent).toBe(`← ${RUN_PAGE_BASE.labels.crumb}`);
    expect(container.querySelector(".run-page-frame-console")).toBeNull();
  });

  test("the gantt tab draws the header, the lanes and the dock", () => {
    const { container } = mount(withRun);
    expect(container.querySelector(".run-page-frame-console")).not.toBeNull();
    expect(container.querySelector(".run-page-frame-dock")).not.toBeNull();
    expect(container.querySelector(".run-page-frame-console-full")).toBeNull();
  });

  test("each tab draws its own stage and the others none", () => {
    const html = (tab: RunPageView["tab"]) => mount({ ...withRun, tab }).container.innerHTML;
    const gantt = html("gantt");
    cleanup();
    const ledger = html("ledger");
    cleanup();
    const journey = html("journey");
    expect(new Set([gantt, ledger, journey]).size).toBe(3);
  });

  test("full screen swaps the console for the strip", () => {
    const { container } = mount({ ...withRun, full: true });
    expect(container.querySelector(".run-page-frame-console-full")).not.toBeNull();
  });

  test("embedded has no crumb back to the board", () => {
    const { container } = mount({ ...withRun, embedded: true });
    expect(container.querySelector(".run-page-frame-crumb")).toBeNull();
  });

  test("an error shows as the frame's alert notice", () => {
    const { container } = mount({ ...withRun, error: "run log unreadable" });
    expect(container.querySelector(".run-page-frame-notices")?.textContent).toBe(
      "⚠ run log unreadable",
    );
  });

  test("a closed dock hides the dock slot", () => {
    const { container } = mount({ ...withRun, scope: undefined });
    expect(container.querySelector(".run-page-frame-dock")?.hasAttribute("hidden")).toBe(true);
  });

  test("a view tab click reports through onViewTab", () => {
    const a = actions();
    const { container } = mount(withRun, a);
    const tabs = container.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[tabs.length - 1] as Element);
    expect(a.onViewTab).toHaveBeenCalledTimes(1);
  });
});
