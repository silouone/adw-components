// `<AppHeaderFrame/>` renders from props: brand, tabs, the context and chip slots arrive as values and
// the link targets from `hrefFor`; the only write is the `onNavigate` callback. Literal view models
// from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { APP_HEADER_BRAND, APP_HEADER_TABS, appHeaderHref } from "../../../fixtures/AppHeaderFrame";
import { AppHeaderFrame } from "./AppHeaderFrame";

afterEach(cleanup);

const mount = (over: { route?: string | undefined; onNavigate?: (r: string) => void } = {}) =>
  render(
    <AppHeaderFrame
      brand={APP_HEADER_BRAND}
      tabs={APP_HEADER_TABS}
      route={"route" in over ? over.route : "board"}
      hrefFor={appHeaderHref}
      {...(over.onNavigate === undefined ? {} : { onNavigate: over.onNavigate })}
      context={<span class="ctx-probe">ctx</span>}
      chip={<i class="chip-probe" />}
    />,
  );

const tabs = (c: Element) =>
  Array.from(c.querySelectorAll(".app-header-frame-tab")) as HTMLAnchorElement[];

describe("<AppHeaderFrame/>", () => {
  test("renders brand, tabs, context, chip in that DOM order", () => {
    const { container } = mount();
    const header = container.querySelector("header.app-header-frame") as HTMLElement;
    const kids = Array.from(header.children);
    expect(kids.map((k) => k.className)).toEqual([
      "app-header-frame-brand",
      "app-header-frame-tabs",
      "app-header-frame-ctx",
      "chip-probe",
    ]);
    expect(kids[0]?.textContent).toBe(APP_HEADER_BRAND);
    expect(kids[2]?.querySelector(".ctx-probe")).not.toBeNull();
    expect(kids[2]?.querySelector(".chip-probe")).toBeNull();
  });

  test("the tabs are links whose href comes from hrefFor, one per tab, labels from the props", () => {
    const { container } = mount();
    const links = tabs(container);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/board?token=t%20k",
      "/backlog?token=t%20k",
    ]);
    expect(links.map((a) => a.textContent)).toEqual(["Board", "Backlog"]);
    expect(links.map((a) => a.dataset.route)).toEqual(["board", "backlog"]);
  });

  test("the active tab is .on with aria-current=page; route undefined marks neither", () => {
    const board = tabs(mount({ route: "backlog" }).container);
    expect(board.map((a) => a.classList.contains("on"))).toEqual([false, true]);
    expect(board.map((a) => a.getAttribute("aria-current"))).toEqual([null, "page"]);
    cleanup();
    const none = tabs(mount({ route: undefined }).container);
    expect(none.some((a) => a.classList.contains("on"))).toBe(false);
    expect(none.some((a) => a.hasAttribute("aria-current"))).toBe(false);
  });

  test("with onNavigate, a plain left click prevents default and reports the route", () => {
    const seen: string[] = [];
    const { container } = mount({ onNavigate: (r) => seen.push(r) });
    const proceeded = fireEvent.click(tabs(container)[1] as HTMLElement, { button: 0 });
    expect(proceeded).toBe(false);
    expect(seen).toEqual(["backlog"]);
  });

  test("meta/ctrl/shift/alt-click and middle-click are left to the browser (no preventDefault, no callback)", () => {
    const seen: string[] = [];
    const { container } = mount({ onNavigate: (r) => seen.push(r) });
    const link = tabs(container)[1] as HTMLElement;
    const clicks = [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ];
    for (const init of clicks) {
      // Registered after the component's handler, so it sees whether that one prevented the click;
      // it then stops the browser navigation the test cannot follow.
      let prevented: boolean | undefined;
      link.addEventListener(
        "click",
        (e) => {
          prevented = e.defaultPrevented;
          e.preventDefault();
        },
        { once: true },
      );
      fireEvent.click(link, init);
      expect(prevented).toBe(false);
    }
    expect(seen).toEqual([]);
  });

  test("without onNavigate a click is a normal link (not prevented)", () => {
    const { container } = mount();
    const link = tabs(container)[0] as HTMLElement;
    let defaultPrevented: boolean | undefined;
    link.addEventListener("click", (e) => {
      defaultPrevented = e.defaultPrevented;
      e.preventDefault();
    });
    fireEvent.click(link, { button: 0 });
    expect(defaultPrevented).toBe(false);
  });

  test("each tab reports its own route, once per click, and no other", () => {
    const seen: string[] = [];
    const { container } = mount({ onNavigate: (r) => seen.push(r) });
    fireEvent.click(tabs(container)[0] as HTMLElement, { button: 0 });
    expect(seen).toEqual(["board"]);
    fireEvent.click(tabs(container)[1] as HTMLElement, { button: 0 });
    expect(seen).toEqual(["board", "backlog"]);
  });

  test("a right-click is left to the browser", () => {
    const seen: string[] = [];
    const { container } = mount({ onNavigate: (r) => seen.push(r) });
    const link = tabs(container)[0] as HTMLElement;
    let prevented: boolean | undefined;
    link.addEventListener(
      "click",
      (e) => {
        prevented = e.defaultPrevented;
        e.preventDefault();
      },
      { once: true },
    );
    fireEvent.click(link, { button: 2 });
    expect(prevented).toBe(false);
    expect(seen).toEqual([]);
  });

  test("a route matching no tab marks none; an empty tab list renders an empty nav", () => {
    const stray = tabs(mount({ route: "elsewhere" }).container);
    expect(stray.some((a) => a.classList.contains("on") || a.hasAttribute("aria-current"))).toBe(
      false,
    );
    cleanup();
    const { container } = render(
      <AppHeaderFrame brand={APP_HEADER_BRAND} tabs={[]} route="board" hrefFor={appHeaderHref} />,
    );
    const nav = container.querySelector("nav.app-header-frame-tabs") as HTMLElement;
    expect(nav.childElementCount).toBe(0);
    expect((container.querySelector("header") as HTMLElement).children.length).toBe(3);
  });

  test("hrefFor is asked once per tab with that tab's route; its answer is the href verbatim", () => {
    const asked: string[] = [];
    const { container } = render(
      <AppHeaderFrame
        brand={APP_HEADER_BRAND}
        tabs={APP_HEADER_TABS}
        route="board"
        hrefFor={(r) => {
          asked.push(r);
          return `/x/${r}?a=1&b=2`;
        }}
      />,
    );
    expect(asked).toEqual(["board", "backlog"]);
    expect(tabs(container).map((a) => a.getAttribute("href"))).toEqual([
      "/x/board?a=1&b=2",
      "/x/backlog?a=1&b=2",
    ]);
  });

  test("with no context the context div is still there, empty", () => {
    const { container } = render(
      <AppHeaderFrame
        brand={APP_HEADER_BRAND}
        tabs={APP_HEADER_TABS}
        route="board"
        hrefFor={appHeaderHref}
      />,
    );
    const ctx = container.querySelector(".app-header-frame-ctx") as HTMLElement;
    expect(ctx.childElementCount).toBe(0);
    expect(ctx.textContent).toBe("");
  });

  test("no chip passed renders nothing in its place; ctxTight adds the tight modifier iff set", () => {
    const bare = render(
      <AppHeaderFrame
        brand={APP_HEADER_BRAND}
        tabs={APP_HEADER_TABS}
        route="board"
        hrefFor={appHeaderHref}
      />,
    );
    const header = bare.container.querySelector("header") as HTMLElement;
    expect(header.children.length).toBe(3);
    expect(header.querySelector(".app-header-frame-ctx-tight")).toBeNull();
    cleanup();
    const tight = render(
      <AppHeaderFrame
        brand={APP_HEADER_BRAND}
        tabs={APP_HEADER_TABS}
        route="board"
        hrefFor={appHeaderHref}
        ctxTight
      />,
    );
    expect(
      tight.container.querySelector(".app-header-frame-ctx.app-header-frame-ctx-tight"),
    ).not.toBeNull();
  });
});
