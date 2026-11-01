import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { GAPS, LABELS, SUMMARY } from "../../../fixtures/RunScopeSection";
import { RunScopeSection, type RunScopeSectionProps } from "./RunScopeSection";

afterEach(cleanup);

const view = (props: Partial<RunScopeSectionProps> = {}) =>
  render(<RunScopeSection summary={SUMMARY} mdOn={false} labels={LABELS} {...props} />).container;

describe("<RunScopeSection/>", () => {
  test("an 'ok' ticket and report render both raw <pre> panes, titled", () => {
    const c = view();
    expect([...c.querySelectorAll(".rp-pre")].map((p) => p.textContent)).toEqual([
      SUMMARY.ticket.status === "ok" ? SUMMARY.ticket.text : "",
      SUMMARY.report.status === "ok" ? SUMMARY.report.text : "",
    ]);
    expect([...c.querySelectorAll(".rp-sh")].map((h) => h.textContent)).toEqual([
      "initial ticket",
      "agent final output",
    ]);
    expect(c.querySelector(".rp-md")).toBeNull();
  });

  test("mdOn swaps the raw panes for rendered markdown, never both", () => {
    const c = view({ mdOn: true });
    expect(c.querySelector(".rp-pre")).toBeNull();
    expect(c.querySelectorAll(".rp-md")).toHaveLength(2);
    expect(c.querySelector(".rp-md h1")?.textContent).toBe("Add the dock");
    expect(c.querySelector(".rp-md strong")?.textContent).toBe("bold");
  });

  test("a 'not-persisted' part renders the gap panel with its reason, in either view", () => {
    for (const mdOn of [false, true]) {
      const gap = view({ summary: GAPS, mdOn }).querySelector(".rp-gap");
      expect(gap?.textContent).toContain("not available");
      expect(gap?.textContent).toContain("ENOSPC");
    }
  });

  test("a 'not-persisted' part with no reason says so, no 'undefined'", () => {
    const text = view({ summary: { ...GAPS, ticket: { status: "not-persisted" } } }).querySelector(
      ".rp-gap",
    )?.textContent;
    expect(text).toContain("no reason recorded");
    expect(text).not.toContain("undefined");
  });

  test("a 'mismatch' part renders the byte/hash gap panel", () => {
    const gap = view({ summary: GAPS }).querySelectorAll(".rp-gap")[1];
    expect(gap?.textContent).toContain("content mismatch");
    for (const part of ["100", "aaa", "90", "bbb"]) expect(gap?.textContent).toContain(part);
  });

  test("markup in the text is escaped, never injected", () => {
    const c = view({
      mdOn: true,
      summary: { ...SUMMARY, ticket: { status: "ok", text: "<script>x</script>" } },
    });
    expect(c.querySelector(".rp-md script")).toBeNull();
    expect(c.querySelector(".rp-md")?.textContent).toContain("<script>x</script>");
  });
});
