// `<CopyRunMenu/>` tests: the « ▶ copy ▾ » control copies one line when the project has no
// gate host, and opens a menu of « this mac » + each host otherwise. Pure: a view in,
// markup out, callbacks on click.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { createRef } from "preact";
import { LABELS, NO_HOSTS, WITH_HOSTS } from "../../../fixtures/CopyRunMenu";
import { CopyRunMenu, type CopyRunMenuView } from "./CopyRunMenu";

afterEach(cleanup);

const menu = (
  view: CopyRunMenuView,
  open: boolean,
  fns: {
    onOpenChange?: (open: boolean) => void;
    onPickHost?: (host: string | undefined) => void;
    onCopy?: (text: string, label: string) => void;
  } = {},
) => (
  <CopyRunMenu
    view={view}
    className="bl-btn"
    labels={LABELS}
    open={open}
    onOpenChange={fns.onOpenChange ?? (() => {})}
    onPickHost={fns.onPickHost ?? (() => {})}
    onCopy={fns.onCopy ?? (() => {})}
    rootRef={createRef<HTMLSpanElement>()}
  />
);

describe("<CopyRunMenu/>", () => {
  test("without hosts: a plain copy button, no menu, one click copies today's line", () => {
    const onCopy = mock((_text: string, _label: string) => {});
    const { container } = render(menu(NO_HOSTS, false, { onCopy }));
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("▶ copy");
    expect(button.getAttribute("title")).toBe("adw run acme-7");
    expect(button.getAttribute("aria-haspopup")).toBeNull();
    expect(container.querySelector("[role=menu]")).toBeNull();
    fireEvent.click(button);
    expect(onCopy).toHaveBeenCalledWith("adw run acme-7", "dispatch line");
  });

  test("with hosts, closed: a « ▶ copy ▾ » menu button and no list", () => {
    const { container } = render(menu(WITH_HOSTS, false));
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("▶ copy ▾");
    expect(button.getAttribute("title")).toBe(LABELS.pick);
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("[role=menu]")).toBeNull();
  });

  test("clicking the menu button asks to open, and to close when already open", () => {
    const onOpenChange = mock((_open: boolean) => {});
    const closed = render(menu(WITH_HOSTS, false, { onOpenChange }));
    fireEvent.click(closed.container.querySelector("button") as HTMLButtonElement);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    cleanup();
    const open = render(menu(WITH_HOSTS, true, { onOpenChange }));
    fireEvent.click(open.container.querySelector("button") as HTMLButtonElement);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("open: « this mac » first, then each host, as menu items", () => {
    const { container } = render(menu(WITH_HOSTS, true));
    expect(container.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
    const items = [...container.querySelectorAll("[role=menuitem]")];
    expect(items.map((i) => i.textContent)).toEqual(["this mac", "mac-mini", "build-box"]);
  });

  test("choosing an item copies its own line, records the host and closes", () => {
    const onCopy = mock((_text: string, _label: string) => {});
    const onPickHost = mock((_host: string | undefined) => {});
    const onOpenChange = mock((_open: boolean) => {});
    const { container } = render(menu(WITH_HOSTS, true, { onCopy, onPickHost, onOpenChange }));
    const items = container.querySelectorAll("[role=menuitem]");
    fireEvent.click(items[1] as HTMLButtonElement);
    expect(onCopy).toHaveBeenCalledWith("adw run acme-7 --gate-host mac-mini", "dispatch line");
    expect(onPickHost).toHaveBeenCalledWith("mac-mini");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("choosing « this mac » records no host", () => {
    const onCopy = mock((_text: string, _label: string) => {});
    const onPickHost = mock((_host: string | undefined) => {});
    const { container } = render(menu(WITH_HOSTS, true, { onCopy, onPickHost }));
    fireEvent.click(container.querySelector("[role=menuitem]") as HTMLButtonElement);
    expect(onCopy).toHaveBeenCalledWith("adw run acme-7", "dispatch line");
    expect(onPickHost).toHaveBeenCalledWith(undefined);
  });
});
