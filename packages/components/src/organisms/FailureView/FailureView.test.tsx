import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { BARE, FAILURE, NO_TAIL } from "../../../fixtures/FailureView";
import { FailureView } from "./FailureView";

afterEach(cleanup);

const row = (c: Element, key: string) => c.querySelector(`[data-row="${key}"] dd`)?.textContent;

describe("FailureView", () => {
  test("the summary column has the headline and node, gate, exit, at rows", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    expect(container.querySelector(".fv-head")?.textContent).toBe(FAILURE.headline);
    expect(row(container, "node")).toBe("gates-rebased");
    expect(row(container, "gate")).toBe("test-frontend");
    expect(container.querySelector(".fv-gate")?.textContent).toBe("test-frontend");
    expect(row(container, "exit")).toBe("1");
    expect(row(container, "at")).toBe("CreationWizard.flow.test.tsx:77");
  });

  test("the last line is drawn with its class", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    expect(container.querySelector(".fv-last")?.textContent).toBe(FAILURE.last ?? "");
  });

  test("a failure with no last line draws no .fv-last", () => {
    const { last: _last, ...noLast } = FAILURE;
    const { container } = render(<FailureView view={noLast} />);
    expect(container.querySelector(".fv-last")).toBeNull();
  });

  test("tabs are code, stack, output with code selected", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    const tabs = [...container.querySelectorAll(".fv-tab")];
    expect(tabs.map((t) => t.textContent)).toEqual(["code", "stack", "output"]);
    expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
  });

  test("the code tab highlights line 77 and draws the caret as its own row", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    const hit = container.querySelector(".fv-hit");
    expect(hit?.querySelector("i")?.textContent).toBe("77");
    const caret = container.querySelector(".fv-caret");
    expect(caret).not.toBeNull();
    expect(caret).not.toBe(hit);
    expect(caret?.querySelector("i")?.textContent).toBe("");
  });

  test("the stack tab dims library frames and keeps own frames undimmed", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    fireEvent.click(container.querySelector('[data-tab="stack"]') as Element);
    const frames = [...container.querySelectorAll(".fv-fr")];
    expect(frames).toHaveLength(FAILURE.frames.length);
    const own = frames.filter((f) => !f.classList.contains("fv-lib"));
    expect(own).toHaveLength(2);
    expect(own.every((f) => f.textContent?.includes("src/pages"))).toBe(true);
    const lib = frames.filter((f) => f.classList.contains("fv-lib"));
    expect(lib.every((f) => f.textContent?.includes("node_modules"))).toBe(true);
    expect(container.querySelector(".fv-fn")?.textContent).toBe("Object.getElementError");
    expect([...container.querySelectorAll(".fv-fn")].map((n) => n.textContent)).toContain("cta");
  });

  test("the output tab numbers the tail and colours it, with no escape text", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    fireEvent.click(container.querySelector('[data-tab="output"]') as Element);
    expect(container.querySelectorAll(".fv-out .fv-ln")).toHaveLength(FAILURE.output.length);
    expect(container.querySelector(".fv-out [class^='ans-']")).not.toBeNull();
    expect(container.textContent).not.toContain("[39m");
    expect(container.textContent).not.toContain("\x1b");
  });

  test("a failure with no tail has only the output tab, with headline and detail", () => {
    const { container } = render(<FailureView view={NO_TAIL} />);
    expect([...container.querySelectorAll(".fv-tab")].map((t) => t.textContent)).toEqual([
      "output",
    ]);
    const out = container.querySelector(".fv-out")?.textContent ?? "";
    expect(out).toContain(NO_TAIL.headline);
    expect(out).toContain("another run holds the slot");
    for (const key of ["gate", "exit", "at"])
      expect(container.querySelector(`[data-row="${key}"]`)).toBeNull();
    expect(container.querySelector(".fv-code")).toBeNull();
    expect(container.querySelector(".fv-stack")).toBeNull();
  });
});

describe("FailureView — edge cases", () => {
  test("only the selected tab's body is mounted, and switching back to code restores it", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    expect(container.querySelector(".fv-code")).not.toBeNull();
    expect(container.querySelector(".fv-stack")).toBeNull();
    expect(container.querySelector(".fv-out")).toBeNull();
    fireEvent.click(container.querySelector('[data-tab="output"]') as Element);
    expect(container.querySelector(".fv-code")).toBeNull();
    expect(container.querySelector(".fv-out")).not.toBeNull();
    fireEvent.click(container.querySelector('[data-tab="code"]') as Element);
    expect(container.querySelector(".fv-code")).not.toBeNull();
    expect(container.querySelector(".fv-out")).toBeNull();
    expect(container.querySelector('[data-tab="code"]')?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  test("a picked tab the next failure lacks falls back to its first tab", () => {
    const { container, rerender } = render(<FailureView view={FAILURE} />);
    fireEvent.click(container.querySelector('[data-tab="stack"]') as Element);
    expect(container.querySelector(".fv-stack")).not.toBeNull();
    rerender(<FailureView view={NO_TAIL} />);
    expect(container.querySelector(".fv-stack")).toBeNull();
    expect(container.querySelector(".fv-out")).not.toBeNull();
    expect(container.querySelector('[data-tab="output"]')?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  test("exit 0 is drawn as a row", () => {
    const { container } = render(
      <FailureView view={{ ...BARE, summary: [{ key: "exit", value: "0" }] }} />,
    );
    expect(row(container, "exit")).toBe("0");
  });

  test("the gate value carries the gate class and no other row does", () => {
    const { container } = render(
      <FailureView
        view={{
          ...BARE,
          summary: [
            { key: "node", value: "build" },
            { key: "gate", value: "lint" },
          ],
        }}
      />,
    );
    expect(container.querySelectorAll(".fv-gate")).toHaveLength(1);
    expect(container.querySelector('[data-row="node"] dd')?.className).toBe("");
  });

  test("an output line with no colour is drawn as one uncoloured span", () => {
    const { container } = render(
      <FailureView view={{ ...BARE, tabs: ["output"], output: [[{ text: "plain line" }]] }} />,
    );
    const spans = container.querySelectorAll(".fv-out .fv-ln > span > span");
    expect(spans).toHaveLength(1);
    expect(spans[0]?.textContent).toBe("plain line");
    expect(spans[0]?.getAttribute("class")).toBeNull();
  });

  test("a coloured span maps its colour to a class and no escape reaches a text node", () => {
    const { container } = render(
      <FailureView
        view={{
          ...BARE,
          tabs: ["output"],
          output: [[{ text: "red", color: "red" }, { text: " then plain" }]],
        }}
      />,
    );
    expect(container.textContent).not.toContain("\u001b");
    expect(container.textContent).not.toContain("[31m");
    expect(container.querySelector(".ans-red")?.textContent).toBe("red");
  });

  test("stack frames draw no fn span when the frame has no function", () => {
    const { container } = render(
      <FailureView
        view={{
          ...BARE,
          tabs: ["stack"],
          frames: [{ path: "/r/src/a.ts", line: 3, col: 4, lib: false }],
        }}
      />,
    );
    expect(container.querySelector(".fv-fn")).toBeNull();
    expect(container.querySelector(".fv-fr")?.textContent).toContain("/r/src/a.ts:3:4");
  });

  test("the code tab numbers every source line and leaves the caret gutter empty", () => {
    const { container } = render(<FailureView view={FAILURE} />);
    const gutters = [...container.querySelectorAll(".fv-code .fv-ln i")].map((i) => i.textContent);
    expect(gutters).toHaveLength(FAILURE.code.length);
    expect(gutters.filter((g) => g === "")).toHaveLength(1);
    expect(container.querySelectorAll(".fv-hit")).toHaveLength(1);
    expect(container.querySelectorAll(".fv-caret")).toHaveLength(1);
  });
});
