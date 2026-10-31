// The card's 8 px row of run phases. Pure: a `PhaseStripView` in, one segment per entry out.

import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/preact";
import { PhaseStrip, type PhaseStripView } from "./PhaseStrip";

afterEach(cleanup);

const css = readFileSync(new URL("./PhaseStrip.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../../../tokens/src/tokens.css", import.meta.url), "utf8");

const seg = (
  over: Partial<PhaseStripView["segments"][number]["place"]> & {
    cls?: string;
    title?: string;
  } = {},
): PhaseStripView["segments"][number] => ({
  cls: over.cls ?? "tc-ph k-agent ph-plan",
  place: { left: over.left ?? "0%", width: over.width ?? "10%" },
  title: over.title ?? "plan · 1m 05s",
});

const segs = (container: Element): HTMLElement[] =>
  Array.from(container.querySelectorAll(".tc-strip > i")) as HTMLElement[];

describe("<PhaseStrip/>", () => {
  test("one segment per entry, placed by inline percent", () => {
    const view: PhaseStripView = {
      segments: [seg(), seg({ left: "10%", width: "20%" }), seg({ left: "30%", width: "5%" })],
    };
    const { container } = render(<PhaseStrip view={view} />);
    expect(segs(container)).toHaveLength(3);
    expect(segs(container)[1]?.style.left).toBe("10%");
    expect(segs(container)[1]?.style.width).toBe("20%");
  });

  test("cls passes through untouched, ph-<phase> included", () => {
    const { container } = render(
      <PhaseStrip view={{ segments: [seg({ cls: "tc-ph k-gate ph-gates" })] }} />,
    );
    expect(container.querySelector(".tc-strip > i.ph-gates")?.className).toBe(
      "tc-ph k-gate ph-gates",
    );
  });

  test("title is an attribute, never markup", () => {
    const { container } = render(
      <PhaseStrip view={{ segments: [seg({ title: '"><b>x</b>' })] }} />,
    );
    expect(container.querySelector("b")).toBeNull();
    expect(segs(container)[0]?.getAttribute("title")).toBe('"><b>x</b>');
  });

  test("no segments still draws the row", () => {
    const { container } = render(<PhaseStrip view={{ segments: [] }} />);
    expect(container.querySelector(".tc-strip")).not.toBeNull();
    expect(segs(container)).toHaveLength(0);
  });

  test("fractional positions pass through as written", () => {
    const { container } = render(
      <PhaseStrip view={{ segments: [seg({ left: "12.5%", width: "0.8%" })] }} />,
    );
    expect(segs(container)[0]?.style.left).toBe("12.5%");
    expect(segs(container)[0]?.style.width).toBe("0.8%");
  });

  test("equal positions both render", () => {
    const { container } = render(<PhaseStrip view={{ segments: [seg(), seg(), seg()] }} />);
    expect(segs(container)).toHaveLength(3);
  });
});

describe("PhaseStrip.css phases", () => {
  for (const phase of ["setup", "plan", "build", "test", "gates", "review", "ship", "other"]) {
    test(`PhaseStrip.css maps ph-${phase} to --pc-${phase}, which tokens declare`, () => {
      expect(css).toMatch(
        new RegExp(`\\.tc-ph\\.ph-${phase}\\s*\\{\\s*--pc:\\s*var\\(--pc-${phase}\\);?\\s*\\}`),
      );
      expect(tokens).toMatch(new RegExp(`--pc-${phase}\\s*:`));
    });
  }
});
