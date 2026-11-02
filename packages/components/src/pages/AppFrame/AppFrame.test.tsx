// `<AppFrame/>` renders from one view and reports through its actions: the route, the page class and
// the usage figures arrive as values. Literal view models from the fixtures.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { APP_FRAME_BASE, appHeaderHref } from "../../../fixtures/AppFrame";
import { AppFrame, type AppFrameActions, type AppFrameView } from "./AppFrame";

afterEach(cleanup);

const actions = (over: Partial<AppFrameActions> = {}): AppFrameActions => ({
  hrefFor: appHeaderHref,
  onNavigate: mock(() => {}),
  onToggleUsage: mock(() => {}),
  onCloseUsage: mock(() => {}),
  ...over,
});

const mount = (view: AppFrameView = APP_FRAME_BASE, a: AppFrameActions = actions()) =>
  render(
    <AppFrame
      view={view}
      actions={a}
      context={<i class="ctx-probe" />}
      screen={<main class="screen-probe" />}
    />,
  );

describe("<AppFrame/>", () => {
  test("the root takes the page class and holds the header, the panel and the screen in order", () => {
    const { container } = mount();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe(APP_FRAME_BASE.pageClass);
    expect(root.firstElementChild?.tagName).toBe("HEADER");
    expect(root.lastElementChild?.className).toBe("screen-probe");
    expect(root.querySelector("header .ctx-probe")).not.toBeNull();
  });

  test("the route's tab is the active one", () => {
    const { container } = mount({ ...APP_FRAME_BASE, route: "backlog" });
    const on = container.querySelector(".app-header-frame-tab.on");
    expect(on?.getAttribute("data-route")).toBe("backlog");
  });

  test("the run route marks no tab", () => {
    const { container } = mount({ ...APP_FRAME_BASE, route: "run" });
    expect(container.querySelector(".app-header-frame-tab.on")).toBeNull();
  });

  test("a tab click reports through onNavigate; without it the tab is a plain link", () => {
    const a = actions();
    const { container } = mount(APP_FRAME_BASE, a);
    fireEvent.click(container.querySelector('[data-route="backlog"]') as Element);
    expect(a.onNavigate).toHaveBeenCalledWith("backlog");
    cleanup();
    const plain = mount(APP_FRAME_BASE, actions({ onNavigate: undefined }));
    const link = plain.container.querySelector('[data-route="backlog"]') as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(appHeaderHref("backlog"));
  });

  test("the usage panel is the header's sibling, never inside it", () => {
    const { container } = mount({
      ...APP_FRAME_BASE,
      usage: { ...APP_FRAME_BASE.usage, open: true },
    });
    const header = container.querySelector("header") as HTMLElement;
    const panel = container.querySelector(".up-panel");
    expect(panel).not.toBeNull();
    expect(header.contains(panel)).toBe(false);
  });
});
