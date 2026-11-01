// `<ActionBar/>`: the focus panel's arm-then-confirm bar.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import {
  ACTION_BAR_BLOCKED,
  ACTION_BAR_DEFERRED,
  ACTION_BAR_LABELS,
  ACTION_BAR_PAUSED,
  ACTION_BAR_PUBLISH,
  ACTION_BAR_RUNNING,
  ACTION_BAR_WITH_PR,
  FULL_ID,
} from "../../../fixtures/ActionBar";
import {
  ARM_MS,
  ActionBar,
  type ActionBarProps,
  type ActionBarView,
  type PauseAction,
} from "./ActionBar";

afterEach(cleanup);

const stubPost = () => mock<PauseAction>(async () => undefined);

function setup(
  view: ActionBarView = ACTION_BAR_RUNNING,
  opts: Partial<Pick<ActionBarProps, "onAction" | "armMs" | "density" | "awayKey">> = {},
) {
  const post = stubPost();
  const copy = mock((_text: string) => {});
  const stage = mock((_s: "board" | "run") => {});
  const props: ActionBarProps = {
    view,
    labels: ACTION_BAR_LABELS,
    token: "tok",
    onAction: post,
    onCopy: copy,
    onStage: stage,
    ...opts,
  };
  const rendered = render(<ActionBar {...props} />);
  const arm = (id: string) =>
    rendered.container.querySelector(`[data-arm="${id}"]`) as HTMLButtonElement;
  const text = (id: string) => arm(id)?.textContent ?? "";
  return { post, copy, stage, arm, text, props, ...rendered };
}

describe("<ActionBar/> — a running ticket", () => {
  test("the default arm window is four seconds", () => {
    expect(ARM_MS).toBe(4000);
  });

  test("pause + kill left, open run right, no filled ArmButton", () => {
    const { text, container } = setup();
    expect(text("pause")).toBe("⏸ pause");
    expect(text("kill")).toBe("✕ kill");
    expect(text("open")).toBe("▸ open run");
    expect(container.querySelector(".arm-btn")).toBeNull();
  });

  test("one click arms pause with the consequence and hides the right group", () => {
    const { arm, text, post } = setup();
    fireEvent.click(arm("pause"));
    expect(text("pause")).toContain("pause sabado-276 after strip-tags?");
    expect(arm("pause").classList.contains("armed")).toBe(true);
    expect(arm("open")).toBeNull();
    expect(post).not.toHaveBeenCalled();
  });

  test("a second click posts and disables the control until it settles", async () => {
    let release: (v: string | undefined) => void = () => {};
    const slow: PauseAction = () =>
      new Promise((r) => {
        release = r;
      });
    const { arm, text } = setup(ACTION_BAR_RUNNING, { onAction: slow });
    fireEvent.click(arm("pause"));
    fireEvent.click(arm("pause"));
    expect(text("pause")).toContain("pause…");
    expect(arm("pause").disabled).toBe(true);
    release(undefined);
    await waitFor(() => expect(text("pause")).toBe("⏸ pause"));
    expect(arm("pause").disabled).toBe(false);
  });

  test("the post carries the verb, the scope and the token", async () => {
    const { arm, post } = setup();
    fireEvent.click(arm("pause"));
    fireEvent.click(arm("pause"));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]).toEqual(["pause", { target: "sabado", ticket: FULL_ID }, "tok"]);
  });

  test("a post goes out through onAction only, never through fetch", async () => {
    const realFetch = globalThis.fetch;
    const fetchSpy = mock(async () => new Response("{}"));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      const { arm, post } = setup();
      fireEvent.click(arm("pause"));
      fireEvent.click(arm("pause"));
      await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  test("a click reported away by the page disarms and brings the right group back", () => {
    const { arm, text, rerender, props } = setup(ACTION_BAR_RUNNING, { awayKey: 0 });
    fireEvent.click(arm("pause"));
    expect(text("pause")).toContain("after strip-tags?");
    rerender(<ActionBar {...props} awayKey={1} />);
    expect(text("pause")).toBe("⏸ pause");
    expect(text("open")).toBe("▸ open run");
  });

  test("with no second click the label reverts after the window", async () => {
    const { arm, text } = setup(ACTION_BAR_RUNNING, { armMs: 30 });
    fireEvent.click(arm("pause"));
    expect(arm("pause").classList.contains("armed")).toBe(true);
    await waitFor(() => expect(text("pause")).toBe("⏸ pause"));
    expect(text("open")).toBe("▸ open run");
  });

  test("clicking another arm control arms that one instead", () => {
    const { arm, text } = setup();
    fireEvent.click(arm("pause"));
    fireEvent.click(arm("kill"));
    expect(text("kill")).toContain("kill sabado-276? the ticket goes to blocked");
    expect(text("pause")).toBe("⏸ pause");
  });

  test("kill posts on the second click and copies nothing", async () => {
    const { arm, copy, post } = setup();
    fireEvent.click(arm("kill"));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(arm("kill"));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]).toEqual(["kill", { target: "sabado", ticket: FULL_ID }, "tok"]);
    expect(copy).not.toHaveBeenCalled();
  });

  test("a failed post shows its text under the bar and re-enables the control", async () => {
    const { arm, container } = setup(ACTION_BAR_RUNNING, {
      onAction: async () => 'ticket "x" is blocked, not in-progress',
    });
    fireEvent.click(arm("kill"));
    fireEvent.click(arm("kill"));
    await waitFor(() =>
      expect(container.querySelector(".arm-err")?.textContent).toBe(
        'ticket "x" is blocked, not in-progress',
      ),
    );
    expect(arm("kill").disabled).toBe(false);
  });

  test("open run asks the page for the run stage", () => {
    const { arm, stage } = setup();
    fireEvent.click(arm("open"));
    expect(stage).toHaveBeenCalledWith("run");
  });

  test("unmounting while armed leaves no timer to fire", async () => {
    const { arm, unmount } = setup(ACTION_BAR_RUNNING, { armMs: 10 });
    fireEvent.click(arm("pause"));
    unmount();
    await new Promise((r) => setTimeout(r, 40));
  });

  test("a new view object mid-arm does not disarm", () => {
    const { arm, rerender, props } = setup();
    fireEvent.click(arm("pause"));
    rerender(<ActionBar {...props} view={{ ...ACTION_BAR_RUNNING }} />);
    expect(arm("pause").classList.contains("armed")).toBe(true);
  });

  test("the armed action vanishing (run finished) clears the arming", () => {
    const { arm, rerender, props, container } = setup();
    fireEvent.click(arm("pause"));
    rerender(<ActionBar {...props} view={ACTION_BAR_WITH_PR} />);
    expect(container.querySelector(".armed")).toBeNull();
    expect(container.querySelector('[data-arm="open"]')).not.toBeNull();
  });
});

describe("<ActionBar/> — the other states", () => {
  test("paused → resume posts the resume verb", async () => {
    const { arm, text, post } = setup(ACTION_BAR_PAUSED);
    expect(text("resume")).toBe("▶ resume");
    fireEvent.click(arm("resume"));
    expect(text("resume")).toContain("resume sabado-276 at 14:30?");
    fireEvent.click(arm("resume"));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]?.[0]).toBe("resume");
  });

  test("blocked with green gates → publish copies on ONE click, dashed, and posts nothing", () => {
    const { arm, copy, post, text } = setup(ACTION_BAR_PUBLISH);
    expect(arm("publish").classList.contains("dashed")).toBe(true);
    fireEvent.click(arm("publish"));
    expect(copy).toHaveBeenCalledWith(`adw publish --target sabado --ticket ${FULL_ID}`);
    expect(post).not.toHaveBeenCalled();
    expect(text("publish")).toBe("⧉ copied");
    expect(arm("requeue")).not.toBeNull();
  });

  test("the copied flash lapses back to the verb", async () => {
    const { arm, text } = setup(ACTION_BAR_PUBLISH);
    fireEvent.click(arm("publish"));
    expect(text("publish")).toBe("⧉ copied");
    await waitFor(() => expect(text("publish")).toBe("⧉ publish"), { timeout: 2000 });
  });

  test("blocked → requeue posts after arming", async () => {
    const { arm, post, text } = setup(ACTION_BAR_BLOCKED);
    fireEvent.click(arm("requeue"));
    expect(text("requeue")).toContain("requeue sabado-276? it goes back in line");
    fireEvent.click(arm("requeue"));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]).toEqual(["requeue", { target: "sabado", ticket: FULL_ID }, "tok"]);
  });

  test("deferred → boost posts after arming", async () => {
    const { arm, post } = setup(ACTION_BAR_DEFERRED);
    fireEvent.click(arm("boost"));
    fireEvent.click(arm("boost"));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]?.[0]).toBe("boost");
  });

  test("a PR is an anchor opening in a new tab, not an arm control", () => {
    const { arm } = setup(ACTION_BAR_WITH_PR);
    const pr = arm("pr") as unknown as HTMLAnchorElement;
    expect(pr.tagName).toBe("A");
    expect(pr.getAttribute("href")).toBe("https://github.com/acme/sabado/pull/12");
    expect(pr.getAttribute("target")).toBe("_blank");
    expect(pr.getAttribute("rel")).toBe("noopener noreferrer");
    expect(pr.textContent).toBe("⇗ PR #12");
  });

  test("the rail density sets actions-rail and arm-rail", () => {
    const { container } = setup(ACTION_BAR_RUNNING, { density: "rail" });
    expect(container.querySelector(".actions")?.classList.contains("actions-rail")).toBe(true);
    expect(container.querySelector("[data-arm=pause]")?.classList.contains("arm-rail")).toBe(true);
  });

  test("a disabled spec renders disabled and never arms", () => {
    const pausing: ActionBarView = {
      ...ACTION_BAR_RUNNING,
      left: [{ id: "pausing", glyph: "⏸", verb: "pausing…", tone: "dim", mode: "disabled" }],
    };
    const { arm } = setup(pausing);
    expect(arm("pausing").disabled).toBe(true);
  });
});
