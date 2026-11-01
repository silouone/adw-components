import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const INDEX = join(ROOT, "storybook-static", "index.json");

type Entry = {
  readonly id: string;
  readonly title: string;
  readonly importPath: string;
  readonly type: "story" | "docs";
};

const readIndex = (): readonly Entry[] => {
  if (!existsSync(INDEX)) {
    throw new Error(
      `storybook-static/index.json is missing: run \`bun run build-storybook\` under Node 22 first (the build gate does)`,
    );
  }
  const parsed = JSON.parse(readFileSync(INDEX, "utf8")) as {
    entries?: Readonly<Record<string, Entry>>;
  };
  if (parsed.entries === undefined) throw new Error(`${INDEX}: no "entries" map`);
  return Object.values(parsed.entries);
};

const storyFiles = (): readonly string[] =>
  [...new Bun.Glob("packages/*/src/**/*.stories.tsx").scanSync({ cwd: ROOT })]
    .sort()
    .map((p) => `./${p}`);

describe("storybook-static/index.json", () => {
  const entries = readIndex();
  const stories = entries.filter((e) => e.type === "story");

  test("every story file is indexed by at least one story", () => {
    const indexed = new Set(stories.map((e) => e.importPath));
    expect(storyFiles().filter((f) => !indexed.has(f))).toEqual([]);
  });

  test("every story entry comes from a real stories file", () => {
    const files = new Set(storyFiles());
    expect(stories.filter((e) => !files.has(e.importPath)).map((e) => e.id)).toEqual([]);
  });

  test("nothing comes from .adw or node_modules, everything from ./packages/", () => {
    const paths = entries.map((e) => e.importPath);
    expect(paths.filter((p) => p.includes(".adw") || p.includes("node_modules"))).toEqual([]);
    expect(paths.filter((p) => !p.startsWith("./packages/"))).toEqual([]);
  });

  test("the four Foundations pages are indexed", () => {
    const titles = new Set(entries.map((e) => e.title));
    for (const title of [
      "Foundations/Tokens",
      "Foundations/Text styles",
      "Foundations/Design system",
      "Foundations/Layers",
    ]) {
      expect(titles.has(title)).toBe(true);
    }
  });

  test("each probe has an autodocs page", () => {
    const docs = new Set(entries.filter((e) => e.type === "docs").map((e) => e.importPath));
    for (const probe of [
      "./packages/components/src/atoms/Kpi/Kpi.stories.tsx",
      "./packages/components/src/molecules/ArmButton/ArmButton.stories.tsx",
      "./packages/components/src/molecules/PhaseStrip/PhaseStrip.stories.tsx",
    ]) {
      expect(docs.has(probe)).toBe(true);
    }
  });
});
