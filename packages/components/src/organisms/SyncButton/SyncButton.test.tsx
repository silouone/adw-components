// `<SyncButton/>`: the backlog header's sync button is a view. It shows `status` and calls
// `onSync`, and touches no fetch.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { SYNC_BUTTON_LABELS } from "../../../fixtures/SyncButton";
import { SyncButton, type SyncButtonProps } from "./SyncButton";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const draw = (status: SyncButtonProps["status"], onSync: () => void = () => {}) =>
  render(<SyncButton status={status} labels={SYNC_BUTTON_LABELS} onSync={onSync} />).container;

describe("<SyncButton/>", () => {
  test("idle renders an enabled sync button", () => {
    const b = draw("idle").querySelector("button") as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    expect(b.textContent).toBe("⟳ sync");
    expect(b.title).toBe(SYNC_BUTTON_LABELS.title);
  });

  test("syncing renders disabled with the syncing label", () => {
    const b = draw("syncing").querySelector("button") as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    expect(b.textContent).toBe("⟳ syncing…");
  });

  test("a click calls onSync once and touches no fetch", () => {
    const spy = mock(() => Promise.resolve(new Response("")));
    globalThis.fetch = spy as unknown as typeof fetch;
    const onSync = mock(() => {});
    fireEvent.click(draw("idle", onSync).querySelector("button") as HTMLButtonElement);
    expect(onSync).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
  });
});
