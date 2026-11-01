// <PrChips/> and <Ci/>: asserted on the rendered DOM/HTML — the browser is never a test seam.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { readFileSync } from "node:fs";
import {
  APPROVED,
  AWAITING,
  BEHIND,
  CHANGES_REQUESTED,
  CI_CANCELLED,
  CI_FAILING,
  CI_FAILING_BARE,
  CI_HOSTILE,
  CI_NO_CHECKS,
  CI_PASSING,
  CI_PENDING,
  CONFLICTS,
  MERGED,
  MERGED_WITHOUT_APPROVAL,
  NOT_FETCHED,
  NO_REPO,
  PARKED,
  PR_URL,
  REJECTED,
  REVIEW_REQUIRED,
  UNAVAILABLE,
  UNMATCHED,
  JOB_URL,
  prOf,
} from "../../../fixtures/PrChips";
import { PrChips, type PrView } from "./PrChips";

const css = readFileSync(new URL("./PrChips.css", import.meta.url), "utf8");

afterEach(() => {
  cleanup();
});

function html(state: PrView | undefined): string {
  const { container } = render(<PrChips pr={state} />);
  const out = container.innerHTML;
  cleanup();
  return out;
}

function dom(state: PrView | undefined): HTMLElement {
  return render(<PrChips pr={state} />).container as HTMLElement;
}

describe("<PrChips/> — the CI chip", () => {
  test("only passing and failing carry a colour class", () => {
    const passing = dom(prOf(CI_PASSING)).querySelector(".pr-ci");
    expect(passing?.classList.contains("ok")).toBe(true);
    cleanup();
    const failing = dom(prOf(CI_FAILING_BARE)).querySelector(".pr-ci");
    expect(failing?.classList.contains("bad")).toBe(true);
    cleanup();
    for (const ci of [CI_CANCELLED, CI_PENDING, CI_NO_CHECKS]) {
      const chip = dom(prOf(ci)).querySelector(".pr-ci");
      expect(chip?.classList.contains("none")).toBe(true);
      expect(chip?.classList.contains("ok")).toBe(false);
      expect(chip?.classList.contains("bad")).toBe(false);
      cleanup();
    }
  });

  test("cancelled / pending / no-checks share one glyph and differ only in the tooltip", () => {
    const rendered = [CI_CANCELLED, CI_PENDING, CI_NO_CHECKS].map((ci) => {
      const chip = dom(prOf(ci)).querySelector(".pr-ci") as HTMLElement;
      const out = {
        glyph: chip.querySelector("i")?.textContent,
        title: chip.getAttribute("title"),
      };
      cleanup();
      return out;
    });
    expect(new Set(rendered.map((r) => r.glyph)).size).toBe(1);
    expect(new Set(rendered.map((r) => r.title)).size).toBe(3);
    expect(rendered.map((r) => r.title)).toEqual([
      "CI: cancelled",
      "CI: pending — checks still running",
      "CI: no checks reported",
    ]);
  });

  test("failing shows the check's name and links to its job", () => {
    const chip = dom(prOf(CI_FAILING)).querySelector(".pr-ci.bad") as HTMLElement;
    expect(chip.textContent).toContain("unit-tests");
    expect(chip.getAttribute("title")).toBe("CI failing: unit-tests");
    const a = chip.querySelector("a") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toBe(JOB_URL);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("failing without a url has no anchor, and no name falls back to plain text", () => {
    const chip = dom(prOf(CI_FAILING_BARE)).querySelector(".pr-ci.bad") as HTMLElement;
    expect(chip.querySelector("a")).toBeNull();
    expect(chip.textContent?.length).toBeGreaterThan(1);
  });
});

describe("<PrChips/> — the validation chip", () => {
  const CASES = [
    [MERGED, "✓", "merged"],
    [REJECTED, "✕", "rejected"],
    [APPROVED, "✓", "approved"],
    [CHANGES_REQUESTED, "⚑", "changes requested"],
    [REVIEW_REQUIRED, "⧗", "review required"],
    [AWAITING, "⧗", "awaiting review"],
  ] as const;

  test.each(CASES)("%o renders glyph %s and text %s", (v, glyph, text) => {
    const chip = dom(prOf(CI_PASSING, v)).querySelector(".pr-val") as HTMLElement;
    expect(chip.classList.contains(v.kind)).toBe(true);
    expect(chip.querySelector("i")?.textContent).toBe(glyph);
    expect(chip.querySelector("b")?.textContent).toBe(text);
    expect(chip.getAttribute("title")).toBeTruthy();
  });

  test.each(CASES)("%o is a button that opens the PR in a new tab", (v) => {
    const chip = dom(prOf(CI_PASSING, v)).querySelector(".pr-val") as HTMLElement;
    expect(chip.tagName).toBe("A");
    expect(chip.getAttribute("href")).toBe(PR_URL);
    expect(chip.getAttribute("target")).toBe("_blank");
    expect(chip.getAttribute("rel")).toBe("noopener noreferrer");
  });

  // The ledger row asks for compact labels — the three open-PR verdicts shorten, the
  // tooltip keeps the full wording, the rest is unchanged.
  const COMPACT = [
    [CHANGES_REQUESTED, "changes"],
    [REVIEW_REQUIRED, "review req."],
    [AWAITING, "awaiting"],
    [APPROVED, "approved"],
    [MERGED, "merged"],
    [REJECTED, "rejected"],
  ] as const;

  test.each(COMPACT)("compact: %o reads %s", (v, text) => {
    const { container } = render(<PrChips pr={prOf(CI_PASSING, v)} compact />);
    const chip = container.querySelector(".pr-val") as HTMLElement;
    cleanup();
    const full = dom(prOf(CI_PASSING, v)).querySelector(".pr-val") as HTMLElement;
    expect(chip.querySelector("b")?.textContent).toBe(text);
    expect(chip.getAttribute("title")).toBe(full.getAttribute("title"));
    expect(chip.querySelector("i")?.textContent).toBe(full.querySelector("i")?.textContent);
  });

  test("merged without approval carries a superscript dot and a tooltip naming why", () => {
    const chip = dom(prOf(CI_PASSING, MERGED_WITHOUT_APPROVAL)).querySelector(
      ".pr-val",
    ) as HTMLElement;
    expect(chip.querySelector("sup.pr-dot")).not.toBeNull();
    expect(chip.getAttribute("title")).toContain("without an approving review");
    // a marker, not a colour: same class set as a plain merge
    cleanup();
    const plain = dom(prOf(CI_PASSING, MERGED)).querySelector(".pr-val") as HTMLElement;
    expect(plain.className).toBe(chip.className);
  });

  test("a plain merge and a rejection carry no dot", () => {
    for (const v of [MERGED, REJECTED]) {
      expect(dom(prOf(CI_PASSING, v)).querySelector(".pr-dot")).toBeNull();
      cleanup();
    }
  });

  test("solo repo: OPEN + '' → awaiting only; MERGED + '' → merged with no dot", () => {
    const open = dom(prOf(CI_PASSING, AWAITING));
    expect(open.querySelectorAll(".pr-val").length).toBe(1);
    expect(open.querySelector(".pr-val b")?.textContent).toBe("awaiting review");
    cleanup();
    const merged = dom(prOf(CI_PASSING, MERGED));
    expect(merged.querySelector(".pr-dot")).toBeNull();
  });

  test("no validation → the row renders no validation chip at all", () => {
    expect(dom(prOf()).querySelector(".pr-val")).toBeNull();
  });

  test("#N links to the PR", () => {
    const a = dom(prOf()).querySelector("a.pr-num") as HTMLAnchorElement;
    expect(a.textContent).toBe("#61");
    expect(a.getAttribute("href")).toBe(PR_URL);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("<PrChips/> — the merge-state chip", () => {
  const CASES = [
    [CONFLICTS, "⚠", "conflicts"],
    [BEHIND, "↓", "behind"],
    [PARKED, "⏸", "parked"],
  ] as const;

  test.each(CASES)("%o renders glyph %s and text %s", (m, glyph, text) => {
    const chip = dom(prOf(CI_PASSING, AWAITING, m)).querySelector(".pr-merge") as HTMLElement;
    expect(chip.classList.contains("kpi")).toBe(true);
    expect(chip.classList.contains(m.kind)).toBe(true);
    expect(chip.querySelector("i")?.textContent).toBe(glyph);
    expect(chip.querySelector("b")?.textContent).toBe(text);
    expect(chip.getAttribute("title")).toBeTruthy();
  });

  test("the three chips have pairwise-distinct tooltips", () => {
    const titles = CASES.map(([m]) => {
      const t = dom(prOf(CI_PASSING, undefined, m))
        .querySelector(".pr-merge")
        ?.getAttribute("title");
      cleanup();
      return t;
    });
    expect(new Set(titles).size).toBe(3);
  });

  test("it sits after the validation chip and before the PR number", () => {
    const row = dom(prOf(CI_PASSING, AWAITING, CONFLICTS)).querySelector(".pr-row") as HTMLElement;
    const order = Array.from(row.children).map(
      (c) => /\bpr-(ci|val|merge|num)\b/.exec(c.className)?.[0],
    );
    expect(order).toEqual(["pr-ci", "pr-val", "pr-merge", "pr-num"]);
    expect(row.children[2]?.classList.contains("pr-merge")).toBe(true);
  });

  test("no merge → no .pr-merge", () => {
    expect(dom(prOf()).querySelector(".pr-merge")).toBeNull();
  });

  test("the non-pr states never render it", () => {
    for (const s of [NO_REPO, UNAVAILABLE, NOT_FETCHED, UNMATCHED]) {
      expect(dom(s).querySelector(".pr-merge")).toBeNull();
      cleanup();
    }
  });

  test("survives the SSE JSON round trip", () => {
    const s = prOf(CI_PASSING, undefined, PARKED);
    expect(html(JSON.parse(JSON.stringify(s)))).toBe(html(s));
  });
});

describe("<PrChips/> — four ways of saying nothing", () => {
  test("no PR → no .pr-row node at all, not an empty row", () => {
    const c = dom(undefined);
    expect(c.querySelector(".pr-row")).toBeNull();
    expect(c.innerHTML).toBe("");
  });

  test("the four absences render four pairwise-distinct outputs", () => {
    const outputs = [html(undefined), html(NO_REPO), html(UNAVAILABLE), html(NOT_FETCHED)];
    expect(new Set(outputs).size).toBe(4);
  });

  test("only gh-unavailable earns the warning class", () => {
    const warn = (s: PrView) => dom(s).querySelector(".pr-absent.warn") !== null;
    expect(warn(UNAVAILABLE)).toBe(true);
    cleanup();
    expect(warn(NO_REPO)).toBe(false);
    cleanup();
    expect(warn(NOT_FETCHED)).toBe(false);
    cleanup();
    expect(warn(prOf())).toBe(false);
  });

  test("each present absence draws its own glyph and none pretends to be a verdict", () => {
    const glyphOf = (s: PrView): string | null | undefined =>
      dom(s).querySelector(".pr-absent i")?.textContent;
    expect(glyphOf(NO_REPO)).toBe("∅");
    cleanup();
    expect(glyphOf(UNAVAILABLE)).toBe("⚠");
    cleanup();
    expect(glyphOf(NOT_FETCHED)).toBe("…");
    cleanup();
    for (const s of [NO_REPO, UNAVAILABLE, UNMATCHED]) {
      const c = dom(s);
      expect(c.querySelector(".pr-ci")).toBeNull();
      expect(c.querySelector(".pr-val")).toBeNull();
      expect(c.querySelector("a.pr-num")).toBeNull();
      cleanup();
    }
  });

  test("unfetched: not-fetched vs unmatched differ in the tooltip only", () => {
    const a = dom(NOT_FETCHED).querySelector(".pr-absent") as HTMLElement;
    const aTitle = a.getAttribute("title");
    const aInner = a.innerHTML;
    cleanup();
    const b = dom(UNMATCHED).querySelector(".pr-absent") as HTMLElement;
    expect(b.getAttribute("title")).not.toBe(aTitle);
    expect(b.innerHTML).toBe(aInner);
  });
});

describe("<PrChips/> — hardening", () => {
  test("a check name is text, never markup", () => {
    const c = dom(prOf(CI_HOSTILE));
    expect(c.querySelector("img")).toBeNull();
    expect(c.querySelector(".pr-ci a")?.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  test("a merge with the marker and a plain merge have different tooltips", () => {
    const title = (v: typeof MERGED) => {
      const t = dom(prOf(CI_PASSING, v)).querySelector(".pr-val")?.getAttribute("title");
      cleanup();
      return t;
    };
    expect(title(MERGED_WITHOUT_APPROVAL)).not.toBe(title(MERGED));
  });

  test("a PR with no validation is exactly two chips: CI and the number", () => {
    const row = dom(prOf()).querySelector(".pr-row") as HTMLElement;
    expect(row.children.length).toBe(2);
    expect(row.children[0]?.classList.contains("pr-ci")).toBe(true);
    expect(row.children[1]?.classList.contains("pr-num")).toBe(true);
  });

  test("every anchor in every state opens a new tab without leaking the opener", () => {
    const states: readonly PrView[] = [prOf(CI_FAILING), prOf(CI_PASSING, MERGED_WITHOUT_APPROVAL)];
    for (const s of states) {
      const anchors = Array.from(dom(s).querySelectorAll("a"));
      expect(anchors.length).toBeGreaterThan(0);
      for (const a of anchors) {
        expect(a.getAttribute("target")).toBe("_blank");
        expect(a.getAttribute("rel")).toBe("noopener noreferrer");
      }
      cleanup();
    }
  });

  test("a state that crossed the SSE wire (JSON round trip) renders identically", () => {
    const states: readonly (PrView | undefined)[] = [
      prOf(CI_FAILING, MERGED_WITHOUT_APPROVAL),
      prOf(CI_PENDING, AWAITING),
      NO_REPO,
      UNAVAILABLE,
      UNMATCHED,
    ];
    for (const s of states) {
      expect(html(JSON.parse(JSON.stringify(s)))).toBe(html(s));
    }
  });

  test("live: re-rendering the same mount from unfetched to a pr replaces the placeholder in place", () => {
    const { container, rerender } = render(<PrChips pr={NOT_FETCHED} />);
    expect(container.querySelector(".pr-absent")).not.toBeNull();
    rerender(<PrChips pr={prOf(CI_PASSING, AWAITING)} />);
    expect(container.querySelectorAll(".pr-row").length).toBe(1);
    expect(container.querySelector(".pr-absent")).toBeNull();
    expect(container.querySelector(".pr-ci.ok")).not.toBeNull();
    rerender(<PrChips pr={undefined} />);
    expect(container.querySelector(".pr-row")).toBeNull();
  });
});

describe("<PrChips/> — room for a third chip", () => {
  test("the row is one flat container of sibling chips", () => {
    const row = dom(prOf(CI_PASSING, AWAITING)).querySelector(".pr-row") as HTMLElement;
    expect(row.children.length).toBe(3);
    for (const child of Array.from(row.children)) {
      expect(child.parentElement).toBe(row);
    }
  });
});

describe("<PrChips/> — links are not covered by an overlay", () => {
  test("no pseudo-element stretches over the PR row", () => {
    expect(css).not.toMatch(/::after/);
  });

  test("the PR row's links stay stacked above their siblings", () => {
    const body = css.match(/(?:^|[}\s])\.pr-row a\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(body).toContain("position: relative");
  });
});
