// `<ToolsTab/>`: the focus panel's Tools tab. Literal view models; reading skill sets and
// capture data off the run's detail is the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  TOOLS_TAB,
  TOOLS_TAB_ALL_CAPTURED,
  TOOLS_TAB_BARE,
  TOOLS_TAB_LABELS,
  TOOLS_TAB_LIVE,
  TOOLS_TAB_NO_TOOLS,
  TOOLS_TAB_NONE_CAPTURED,
} from "../../../fixtures/ToolsTab";
import { ToolsTab, type ToolsTabProps } from "./ToolsTab";

afterEach(cleanup);

const draw = (view: ToolsTabProps["view"], over: Partial<ToolsTabProps> = {}) =>
  render(<ToolsTab view={view} labels={TOOLS_TAB_LABELS} {...over} />).container;

const titles = (c: Element) =>
  [...c.querySelectorAll(".tab-section-eyebrow")].map((e) => e.firstElementChild?.textContent);

describe("<ToolsTab/>", () => {
  test("the four sections in order", () => {
    expect(titles(draw(TOOLS_TAB))).toEqual([
      "the agent could use",
      "skills reaching it",
      "context it was given",
      "tool calls",
    ]);
  });

  test("allowed tools as tags and the suite-guard note", () => {
    const c = draw(TOOLS_TAB);
    expect([...c.querySelectorAll(".tl-allowed .tag")].map((t) => t.textContent)).toEqual([
      "Read",
      "Edit",
      "Bash(bun:*)",
    ]);
    expect(c.textContent).toContain("the suite guard denies the rest");
  });

  test("skills: none reads none, a list reads as tags, all reads every", () => {
    const t = draw(TOOLS_TAB).querySelector(".tl-skills")?.textContent ?? "";
    expect(t).toContain("none");
    expect(t).toContain("engineering");
    expect(t).toContain("every stage");
    cleanup();
    expect(draw(TOOLS_TAB_BARE).querySelector(".tl-skills")?.textContent).toContain(
      "every repo skill",
    );
  });

  test("context lists files, specs and artifacts", () => {
    const t = draw(TOOLS_TAB).querySelector(".tl-context")?.textContent ?? "";
    expect(t).toContain("CLAUDE.md");
    expect(t).toContain("adw-v1.32-board-redesign.md");
    expect(t).toContain("plan → .adw/artifacts/plan.md");
  });

  test("tool calls: 2/3 captured, dot counts, and no capture", () => {
    const c = draw(TOOLS_TAB);
    expect(c.textContent).toContain("2/3 captured");
    const rows = [...c.querySelectorAll(".tl-call")];
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain("plan");
    expect(rows[0]?.textContent).toContain("12");
    expect(rows[1]?.textContent).toContain("no capture");
    expect(rows[2]?.textContent).toContain("3m 03s");
  });

  test("no capture data says so rather than 0/0", () => {
    const c = draw(TOOLS_TAB_BARE);
    expect(c.textContent).toContain("no capture data");
    expect(c.textContent).not.toContain("0/0");
  });

  test("no allowed list: the allowed tools say the factory default", () => {
    expect(draw(TOOLS_TAB_BARE).querySelector(".tl-allowed")?.textContent).toContain(
      "the factory default",
    );
  });

  test("a live agent row shows … and its dot count so far; a live block without calls reads 0 calls", () => {
    const c = draw(TOOLS_TAB_LIVE);
    const rows = [...c.querySelectorAll(".tl-call")];
    expect(rows[0]?.textContent).toContain("…");
    expect(rows[0]?.textContent).toContain("4 calls");
    expect(rows[1]?.textContent).toContain("0 calls");
    expect(c.textContent).toContain("1/2 captured");
  });

  test("every captured: n/n; none captured: 0/n with no capture on every row", () => {
    expect(draw(TOOLS_TAB_ALL_CAPTURED).textContent).toContain("2/2 captured");
    cleanup();
    const none = draw(TOOLS_TAB_NONE_CAPTURED);
    expect(none.textContent).toContain("0/2 captured");
    expect(none.querySelectorAll(".tl-call")[1]?.textContent).toContain("no capture");
  });

  test("empty context lists render no list at all, not empty headings", () => {
    expect(draw(TOOLS_TAB_BARE).querySelectorAll(".tl-list")).toHaveLength(0);
  });

  test("an empty allowed list renders no tags and no factory-default text", () => {
    const c = draw(TOOLS_TAB_NO_TOOLS);
    expect(c.querySelectorAll(".tl-allowed .tag")).toHaveLength(0);
    expect(c.querySelector(".tl-allowed")?.textContent).toBe("");
  });

  test("a view without calls renders every section without throwing", () => {
    const c = draw(TOOLS_TAB_BARE);
    expect(c.querySelectorAll(".tab-section-eyebrow")).toHaveLength(4);
    expect(c.textContent).toContain("no capture data");
  });
});

describe('<ToolsTab/> — density="rail"', () => {
  test("renders tl-rail on the root and the rail variant on every section", () => {
    const c = draw(TOOLS_TAB, { density: "rail" });
    expect(c.querySelector(".toolstab")?.classList.contains("tl-rail")).toBe(true);
    const secs = [...c.querySelectorAll(".tab-section")];
    expect(secs.length).toBeGreaterThan(0);
    for (const s of secs) expect(s.classList.contains("tab-section-rail")).toBe(true);
  });

  test("no density, no modifier", () => {
    expect(draw(TOOLS_TAB).querySelector('[class*="-rail"]')).toBeNull();
  });
});

describe("<ToolsTab/> — the owner marker", () => {
  test("every tool tag carries toolstab-tag beside tag", () => {
    const tags = [...draw(TOOLS_TAB).querySelectorAll(".tl-allowed .tag")];
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => t.classList.contains("toolstab-tag"))).toBe(true);
  });
});
