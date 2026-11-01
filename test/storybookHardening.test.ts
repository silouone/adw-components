import { describe, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

const PROBES = [
  "packages/components/src/atoms/Kpi/Kpi.stories.tsx",
  "packages/components/src/molecules/ArmButton/ArmButton.stories.tsx",
  "packages/components/src/molecules/PhaseStrip/PhaseStrip.stories.tsx",
] as const;

describe("storybook scripts", () => {
  const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;

  test("root scripts dev, build and publish exist", () => {
    expect(scripts.storybook).toBe("storybook dev -p 6006");
    expect(scripts["build-storybook"]).toBe("storybook build");
    expect(scripts["storybook:publish"]).toBe("bash scripts/publish-storybook.sh");
  });

  test("publish-storybook.sh is a strict, executable bash script that dispatches the workflow", () => {
    const path = "scripts/publish-storybook.sh";
    expect(statSync(join(ROOT, path)).mode & 0o111).not.toBe(0);
    const source = read(path);
    expect(source.startsWith("#!/usr/bin/env bash\nset -euo pipefail\n")).toBe(true);
    for (const needle of ["chromatic.yml", "gh workflow run", "STORYBOOK_URL", "BUILD_URL"]) {
      expect(source).toContain(needle);
    }
    expect(source).toContain("git ls-remote --exit-code --heads origin");
  });
});

describe("README", () => {
  const readme = read("README.md");

  test("names the hosted URL pattern, the publish command and the contract", () => {
    expect(readme).toContain("https://main--<appId>.chromatic.com");
    expect(readme).toContain("bun run storybook:publish");
    expect(readme).toContain("Chromatic hosts; it never gates");
  });
});

describe("probe stories", () => {
  for (const path of PROBES) {
    test(`${path} is autodocs with What, Where, When, Don't in order`, () => {
      const source = read(path);
      expect(source).toMatch(/tags:\s*\["autodocs"\]/);
      const at = ["**What**", "**Where**", "**When**", "**Don't**"].map((l) => source.indexOf(l));
      expect(at.every((i) => i >= 0)).toBe(true);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
    });
  }
});

describe("Foundations docs", () => {
  test("DesignSystem.mdx carries the contract, the golden rule, four red lines and the how-to", () => {
    const mdx = read("packages/components/docs/DesignSystem.mdx");
    expect(mdx).toMatch(/^## The contract$/m);
    expect(mdx).toContain("compose → extend → local CSS in tokens → add");
    expect(mdx).toMatch(/^## How to add a component$/m);
    expect(mdx).toContain("What · Where · When · Don't");
    const red = /^## Red lines\n([\s\S]*?)(?=^## )/m.exec(mdx);
    expect(red).not.toBeNull();
    expect((red?.[1] ?? "").match(/^\d+\. /gm)).toHaveLength(4);
  });

  test("Layers.mdx names all five component layers", () => {
    const mdx = read("packages/components/docs/Layers.mdx");
    for (const layer of ["Atoms", "Molecules", "Organisms", "Templates", "Pages"]) {
      expect(mdx).toContain(layer);
    }
  });
});
