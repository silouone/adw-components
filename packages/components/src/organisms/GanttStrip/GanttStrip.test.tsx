import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { BLOCKED, FAILURE_TITLE, GREEN, RUNNING, TICKET_ID } from "../../../fixtures/GanttStrip";
import { GanttStrip } from "./GanttStrip";

afterEach(cleanup);

const mount = (
  strip = BLOCKED,
  extra: { failureScope?: string; onScope?: (s: string) => void; onFullScreen?: () => void } = {},
) =>
  render(
    <GanttStrip
      header={{ ticketId: TICKET_ID, gate: "test-frontend" }}
      strip={strip}
      failureTitle={FAILURE_TITLE}
      onFullScreen={extra.onFullScreen ?? (() => {})}
      onScope={extra.onScope ?? (() => {})}
      {...(extra.failureScope !== undefined ? { failureScope: extra.failureScope } : {})}
    />,
  );

describe("<GanttStrip/>", () => {
  test("a blocked run: pill, ticket id, a span per lane, the failure chip, the duration", () => {
    const { container } = mount();
    expect(container.querySelector(".st")?.textContent).toBe("blocked");
    expect(container.querySelector(".gs-id")?.textContent).toBe(TICKET_ID);
    const spans = [...container.querySelectorAll(".gs-track .gs-span")];
    expect(spans).toHaveLength(2);
    expect(spans.map((s) => s.classList.contains("bad"))).toEqual([false, true]);
    expect(container.querySelector(".fv-chip")?.textContent).toBe(
      "✕ gates-rebased · test-frontend",
    );
    expect(container.querySelector(".gs-dur")?.textContent).toBe("2m 30s");
    expect(container.querySelector(".chev")?.textContent).toBe("▸");
  });

  test("a run that is not blocked marks no lane and draws no chip", () => {
    const { container } = mount(GREEN);
    expect(container.querySelector(".gs-span.bad")).toBeNull();
    expect(container.querySelector(".fv-chip")).toBeNull();
  });

  test("a running run draws its pill and its clock, every lane unmarked", () => {
    const { container } = mount(RUNNING);
    expect(container.querySelector(".st")?.className).toContain("live");
    expect(container.querySelector(".gs-dur")?.textContent).toBe("1m 12s");
    expect(container.querySelectorAll(".gs-span")).toHaveLength(4);
    expect(container.querySelector(".gs-span.bad")).toBeNull();
  });

  test("the chip opens the failing node and keeps the strip; the bar restores", () => {
    const onScope = mock((_scope: string) => {});
    const onFullScreen = mock(() => {});
    const { container } = mount(BLOCKED, { failureScope: "gates::x::1", onScope, onFullScreen });
    fireEvent.click(container.querySelector(".fv-chip") as Element);
    expect(onScope).toHaveBeenCalledWith("gates::x::1");
    expect(onFullScreen).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector(".gantt-strip") as Element);
    expect(onFullScreen).toHaveBeenCalledTimes(1);
  });
});
