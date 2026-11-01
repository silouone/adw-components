// `<ResultTab/>`: the focus panel's Result tab. Literal view models; which sentence a run's
// state picks (the cause word, the PR line, the ledger text) is the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  BLOCKED_REASON,
  RESULT_TAB_BLOCKED,
  RESULT_TAB_DEFERRED,
  RESULT_TAB_LABELS,
  RESULT_TAB_LINK,
  RESULT_TAB_LIVE,
  RESULT_TAB_MERGED,
  RESULT_TAB_NO_PR,
  RESULT_TAB_TAUGHT,
} from "../../../fixtures/ResultTab";
import { ResultTab, type ResultTabProps } from "./ResultTab";

afterEach(cleanup);

const draw = (view: ResultTabProps["view"], over: Partial<ResultTabProps> = {}) =>
  render(<ResultTab view={view} labels={RESULT_TAB_LABELS} {...over} />).container;

const text = (c: Element, sel: string) => c.querySelector(sel)?.textContent;
const eyebrows = (c: Element) =>
  [...c.querySelectorAll(".eyebrow")].map((e) => e.firstElementChild?.textContent);

describe("<ResultTab/> — pull request", () => {
  test("a merged PR: the number link, CI and validation chips, the state word", () => {
    const container = draw(RESULT_TAB_MERGED);
    expect(text(container, ".pr-num")).toBe("#61");
    expect(container.querySelector(".pr-row")).not.toBeNull();
    expect(text(container, ".rs-pr-state")).toBe("merged");
  });

  test("no PR: a live run says it opens when the tail is green; a finished one says none", () => {
    expect(text(draw(RESULT_TAB_LIVE), ".rs-pr")).toBe("opens when the tail is green");
    cleanup();
    expect(text(draw(RESULT_TAB_NO_PR), ".rs-pr")).toBe("none");
  });

  test("a PR known only by its link still links #n with its state", () => {
    const container = draw(RESULT_TAB_LINK);
    const a = container.querySelector(".rs-pr a");
    expect(a?.textContent).toBe("#9");
    expect(a?.getAttribute("href")).toBe("https://github.com/silouone/adw-factory/pull/9");
    expect(text(container, ".rs-pr-state")).toBe("open");
  });
});

describe("<ResultTab/> — factory review", () => {
  test("standards read, spec —, the counts and the note", () => {
    const container = draw(RESULT_TAB_MERGED);
    expect(text(container, ".rs-standards")).toBe("read");
    expect(text(container, ".rs-spec")).toBe("—");
    expect(text(container, ".rs-findings")).toBe("1 hard · 2 wrong");
    expect(text(container, ".rs-note")).toBe(
      "a hard or wrong finding sends the work to review-fix (≤2)",
    );
  });

  test("no review events → — and no counts", () => {
    const container = draw(RESULT_TAB_NO_PR);
    expect(text(container, ".rs-standards")).toBe("—");
    expect(text(container, ".rs-findings")).toBe("—");
  });
});

describe("<ResultTab/> — why it stopped", () => {
  test("blocked: the cause word, the failing node, the full reason in a scrollable block", () => {
    const container = draw(RESULT_TAB_BLOCKED);
    expect(eyebrows(container)).toContain("why it stopped");
    expect(text(container, ".rs-cause")).toBe("node-fail");
    expect(text(container, ".rs-node")).toBe("build");
    const block = container.querySelector(".rs-reason") as HTMLElement;
    expect(block.textContent).toBe(BLOCKED_REASON);
    expect(block.className).toContain("scroll");
  });

  test("deferred: names deferred and the resume rule", () => {
    const container = draw(RESULT_TAB_DEFERRED);
    expect(text(container, ".rs-deferred")).toBe("deferred");
    expect(text(container, ".rs-rule")).toBe("queued — the next dispatch starts it again");
  });

  test("a green run renders no 'why it stopped'", () => {
    expect(eyebrows(draw(RESULT_TAB_MERGED))).not.toContain("why it stopped");
  });
});

describe("<ResultTab/> — what it taught", () => {
  test("the ledger counts and the artifacts list", () => {
    const container = draw(RESULT_TAB_TAUGHT);
    expect(text(container, ".rs-ledger")).toBe("2 friction · 1 failures · 3 learnings");
    expect(text(container, ".rs-artifact")).toBe("plan plan.md");
  });

  test("a live run shows the ledger sentence it is given; no artifacts draws —", () => {
    const container = draw(RESULT_TAB_LIVE);
    expect(text(container, ".rs-ledger")).toBe("written at run-end");
    expect(container.querySelector(".rs-artifact")).toBeNull();
    expect(container.textContent).toContain("—");
  });
});

describe('<ResultTab/> — density="rail"', () => {
  const rail = (on: boolean) => draw(RESULT_TAB_LIVE, on ? { density: "rail" as const } : {});

  test("renders rs-rail on the root and rt-rail on rt-kv", () => {
    const c = rail(true);
    expect(c.querySelector(".resulttab")?.classList.contains("rs-rail")).toBe(true);
    for (const kv of c.querySelectorAll(".rt-kv"))
      expect(kv.classList.contains("rt-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(rail(false).querySelector('[class*="-rail"]')).toBeNull();
  });
});

describe("<ResultTab/> — the owner marker", () => {
  test("the pr link chip carries rt-chip", () => {
    const chips = [...draw(RESULT_TAB_LINK).querySelectorAll(".chip")];
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((c) => c.classList.contains("rt-chip"))).toBe(true);
  });
});
