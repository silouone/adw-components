// `<RunPageFrame/>` renders from props: the crumb, the notice, the full / shut / embedded flags and the
// five slots (header, strip, stage, card, dock) arrive as values; stub elements fill the slots. Literal
// view models from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  RUN_PAGE_CRUMB_HREF,
  RUN_PAGE_CRUMB_LABEL,
  RUN_PAGE_NOTICE,
} from "../../../fixtures/RunPageFrame";
import { RunPageFrame, type RunPageFrameProps } from "./RunPageFrame";

afterEach(cleanup);

const mount = (over: Partial<RunPageFrameProps> = {}) =>
  render(
    <RunPageFrame
      full={false}
      shut={false}
      header={<i data-slot="header" />}
      strip={<i data-slot="strip" />}
      stage={<i data-slot="stage" />}
      card={<i data-slot="card" />}
      dock={<i data-slot="dock" />}
      {...over}
    />,
  );

const consoleOf = (c: Element) => c.querySelector(".run-page-frame-console") as HTMLElement;
const slots = (el: Element) => Array.from(el.children).map((k) => k.getAttribute("data-slot"));

describe("<RunPageFrame/>", () => {
  test("crumb is a link to crumbHref with the label prop; absent on the board's stage", () => {
    const { container } = mount({
      crumbHref: RUN_PAGE_CRUMB_HREF,
      crumbLabel: RUN_PAGE_CRUMB_LABEL,
    });
    const a = container.querySelector("a.run-page-frame-crumb") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toBe(RUN_PAGE_CRUMB_HREF);
    expect(a.textContent).toBe(`← ${RUN_PAGE_CRUMB_LABEL}`);
    cleanup();
    expect(mount().container.querySelector(".run-page-frame-crumb")).toBeNull();
  });

  test("notice renders as an alert list with `⚠ notice`; absent → none", () => {
    const { container } = mount({ notice: RUN_PAGE_NOTICE });
    const ul = container.querySelector("ul.run-page-frame-notices") as HTMLElement;
    expect(ul.getAttribute("role")).toBe("alert");
    expect(ul.querySelector("li")?.textContent).toBe(`⚠ ${RUN_PAGE_NOTICE}`);
    cleanup();
    expect(mount().container.querySelector(".run-page-frame-notices")).toBeNull();
  });

  test("not full: the console box holds header then stage; strip is not rendered", () => {
    const { container } = mount();
    expect(slots(consoleOf(container))).toEqual(["header", "stage"]);
    expect(container.querySelector("[data-slot=strip]")).toBeNull();
  });

  test("full: the console box holds only the strip and carries the full modifier; header/stage not rendered", () => {
    const { container } = mount({ full: true });
    const box = consoleOf(container);
    expect(slots(box)).toEqual(["strip"]);
    expect(box.classList.contains("run-page-frame-console-full")).toBe(true);
    expect(container.querySelector("[data-slot=header]")).toBeNull();
    expect(container.querySelector("[data-slot=stage]")).toBeNull();
  });

  test("docked modifier iff !embedded; dock-shut modifier iff !embedded && shut && !full", () => {
    const has = (c: Element, m: string) =>
      consoleOf(c).classList.contains(`run-page-frame-console-${m}`);
    const run = mount({ shut: true }).container;
    expect([has(run, "docked"), has(run, "dock-shut")]).toEqual([true, true]);
    cleanup();
    const open = mount().container;
    expect([has(open, "docked"), has(open, "dock-shut")]).toEqual([true, false]);
    cleanup();
    const embedded = mount({ embedded: true, shut: true }).container;
    expect([has(embedded, "docked"), has(embedded, "dock-shut")]).toEqual([false, false]);
    cleanup();
    const full = mount({ full: true, shut: true }).container;
    expect([has(full, "docked"), has(full, "dock-shut")]).toEqual([true, false]);
  });

  test("card renders between the console and the dock", () => {
    const { container } = mount();
    expect(
      Array.from(container.children).map((k) => k.getAttribute("data-slot") ?? k.className),
    ).toEqual([
      "run-page-frame-console run-page-frame-console-docked",
      "card",
      "run-page-frame-dock",
    ]);
  });

  test("the dock wrapper is `hidden` iff dockOpen is false and carries the full modifier when full", () => {
    const dock = (c: Element) => c.querySelector(".run-page-frame-dock") as HTMLElement;
    expect(dock(mount().container).hidden).toBe(false);
    expect(dock(mount().container).querySelector("[data-slot=dock]")).not.toBeNull();
    cleanup();
    expect(dock(mount({ dockOpen: false }).container).hidden).toBe(true);
    cleanup();
    expect(
      dock(mount({ full: true }).container).classList.contains("run-page-frame-dock-full"),
    ).toBe(true);
    cleanup();
    expect(dock(mount().container).classList.contains("run-page-frame-dock-full")).toBe(false);
  });

  test("the dock wrapper carries the shut modifier iff !embedded && shut && !full", () => {
    const shutOf = (over: Partial<RunPageFrameProps>) =>
      (
        mount(over).container.querySelector(".run-page-frame-dock") as HTMLElement
      ).classList.contains("run-page-frame-dock-shut");
    expect(shutOf({ shut: true })).toBe(true);
    cleanup();
    expect(shutOf({ shut: false })).toBe(false);
    cleanup();
    expect(shutOf({ shut: true, embedded: true })).toBe(false);
    cleanup();
    expect(shutOf({ shut: true, full: true })).toBe(false);
  });

  test.each(["header", "strip", "stage", "card", "dock"] as const)(
    "a lone %s slot is enough to bring the console box and the dock wrapper",
    (slot) => {
      const { container } = render(
        <RunPageFrame full={false} shut={false} {...{ [slot]: <i data-slot={slot} /> }} />,
      );
      expect(container.querySelector(".run-page-frame-console")).not.toBeNull();
      expect(container.querySelector(".run-page-frame-dock")).not.toBeNull();
    },
  );

  test("full without a strip leaves the console box empty rather than falling back to the header", () => {
    const { container } = mount({ full: true, strip: undefined });
    expect(consoleOf(container).childElementCount).toBe(0);
    expect(container.querySelector("[data-slot=header]")).toBeNull();
    expect(container.querySelector("[data-slot=stage]")).toBeNull();
  });

  test("embedded and full: the full modifier stays, the docked modifier does not", () => {
    const box = consoleOf(mount({ embedded: true, full: true }).container);
    expect(box.classList.contains("run-page-frame-console-full")).toBe(true);
    expect(box.classList.contains("run-page-frame-console-docked")).toBe(false);
  });

  test("the card and the dock still render in full screen", () => {
    const { container } = mount({ full: true });
    expect(container.querySelector("[data-slot=card]")).not.toBeNull();
    expect(container.querySelector("[data-slot=dock]")).not.toBeNull();
  });

  test("the notice is text, never markup", () => {
    const { container } = mount({ notice: "<i>lost</i>" });
    expect(container.querySelector(".run-page-frame-notices li")?.textContent).toBe(
      "⚠ <i>lost</i>",
    );
    expect(container.querySelector(".run-page-frame-notices i")).toBeNull();
  });

  test("a hidden dock stays hidden with no dock content, and the crumb alone renders only the crumb", () => {
    const { container } = render(
      <RunPageFrame
        full={false}
        shut={false}
        dockOpen={false}
        crumbHref={RUN_PAGE_CRUMB_HREF}
        crumbLabel={RUN_PAGE_CRUMB_LABEL}
      />,
    );
    expect(Array.from(container.children).map((k) => k.className)).toEqual([
      "run-page-frame-crumb",
    ]);
  });

  test("no slots at all renders only crumb/notice (no console, no dock) — the pre-first-frame state", () => {
    const { container } = render(
      <RunPageFrame
        full={false}
        shut={false}
        crumbHref={RUN_PAGE_CRUMB_HREF}
        crumbLabel={RUN_PAGE_CRUMB_LABEL}
        notice={RUN_PAGE_NOTICE}
      />,
    );
    expect(Array.from(container.children).map((k) => k.className)).toEqual([
      "run-page-frame-crumb",
      "run-page-frame-notices",
    ]);
  });
});
