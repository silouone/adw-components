// `<StageHeader/>` tests: the breadcrumb line above the board. Pure: crumbs in, markup
// out; the run segment's controls report through callbacks.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import {
  CRUMBS_ALL,
  CRUMBS_NO_GLYPH,
  CRUMBS_ONE,
  CRUMBS_THREE,
  RUN,
  RUN_ID,
  STAGE_LABELS,
} from "../../../fixtures/StageHeader";
import { type StageHeaderProps, StageHeader as StageHeaderView } from "./StageHeader";

afterEach(cleanup);

const StageHeader = (p: Partial<StageHeaderProps> & Pick<StageHeaderProps, "crumbs">) => (
  <StageHeaderView
    labels={STAGE_LABELS}
    onCloseRun={() => {}}
    onFullScreen={() => {}}
    onCopy={() => {}}
    {...p}
  />
);

describe("<StageHeader/>", () => {
  test("no selection: runner all · project all", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_ALL} />);
    const segs = [...container.querySelectorAll(".crumb .cr")];
    expect(segs.map((s) => s.querySelector(".cr-eb")?.textContent)).toEqual(["RUNNER", "PROJECT"]);
    expect(segs.map((s) => s.querySelector(".cr-v")?.textContent)).toEqual(["all", "all"]);
    expect(container.querySelectorAll(".crumb .sep").length).toBe(1);
  });

  test("three segments with the provider glyph before the agent value", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_THREE} />);
    expect(container.querySelectorAll(".crumb .sep").length).toBe(2);
    expect(container.querySelector(".crumb")?.textContent).toBe(
      "RUNNERthis mac›WORKSPACEadw-factory · worktree›AGENT✳ claude · feat",
    );
  });

  test("never restates the brand or the tabs", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_ONE} />);
    expect(container.textContent ?? "").not.toMatch(/adw|board|backlog/i);
  });

  test("no crumbs: an empty line, no separator", () => {
    const { container } = render(<StageHeader crumbs={[]} />);
    expect(container.querySelector(".crumb")?.textContent).toBe("");
    expect(container.querySelectorAll(".sep")).toHaveLength(0);
  });

  test("one crumb: no separator", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_ONE} />);
    expect(container.querySelectorAll(".sep")).toHaveLength(0);
  });

  test("a crumb without a glyph carries no leading space", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_NO_GLYPH} />);
    expect(container.querySelector(".cr-v")?.textContent).toBe("unknown · feat");
  });
});

describe("<StageHeader/> — the run segment", () => {
  const open = (p: Partial<StageHeaderProps> = {}) =>
    render(<StageHeader crumbs={CRUMBS_ONE} run={RUN} {...p} />);

  test("without a run the line is unchanged: no controls", () => {
    const { container } = render(<StageHeader crumbs={CRUMBS_ONE} />);
    expect(container.querySelector("button")).toBeNull();
  });

  test("a run appends a run segment with its label", () => {
    const { container } = open();
    expect(container.querySelector(".crumb")?.textContent).toContain("run1791963430406");
  });

  test("◂ comes first and the full screen chip last", () => {
    const { container } = open();
    const kids = [...(container.querySelector(".crumb")?.children ?? [])];
    expect(kids[0]?.textContent).toBe("◂");
    expect(kids[kids.length - 1]?.textContent).toBe("⤢ full screen");
  });

  test("◂ reports the close", () => {
    const onCloseRun = mock(() => {});
    const { container } = open({ onCloseRun });
    fireEvent.click(container.querySelector(".cr-back") as Element);
    expect(onCloseRun).toHaveBeenCalledTimes(1);
  });

  test("the chip reports the full screen", () => {
    const onFullScreen = mock(() => {});
    const { container } = open({ onFullScreen });
    fireEvent.click(container.querySelector(".cr-full") as Element);
    expect(onFullScreen).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".cr-full")?.getAttribute("title")).toBe("close both rails");
  });

  test("⧉ copies the full run id and flashes copied", async () => {
    const onCopy = mock((_text: string) => {});
    const { container } = open({ onCopy });
    const copy = container.querySelector(".cr-copy") as HTMLElement;
    expect(copy.textContent).toBe("⧉");
    fireEvent.click(copy);
    expect(onCopy.mock.calls).toEqual([[RUN_ID]]);
    await waitFor(() => expect(copy.textContent).toBe("copied"));
  });

  test("copied flashes back to ⧉ after the timer", async () => {
    const { container } = open({ flashMs: 20 });
    const copy = container.querySelector(".cr-copy") as HTMLElement;
    fireEvent.click(copy);
    await waitFor(() => expect(copy.textContent).toBe("copied"));
    await waitFor(() => expect(copy.textContent).toBe("⧉"), { timeout: 2500 });
  });

  test("the copy control names the full run id for assistive tech", () => {
    const { container } = open();
    expect(container.querySelector(".cr-copy")?.getAttribute("aria-label")).toBe(`copy ${RUN_ID}`);
    expect(container.querySelector(".cr-back")?.getAttribute("aria-label")).toBe(
      "back to the board",
    );
  });

  test("with no crumbs the run segment, ◂ and chip still render", () => {
    const { container } = render(<StageHeader crumbs={[]} run={RUN} />);
    expect(container.querySelector(".cr-back")).not.toBeNull();
    expect(container.querySelector(".cr-full")).not.toBeNull();
    expect(container.querySelector(".crumb")?.textContent).toContain("run1791963430406");
  });
});
