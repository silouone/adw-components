import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LAYERS, LAYER_OF_FOLDER } from "../.storybook/layers";

const ROOT = join(import.meta.dir, "..");

const scan = (pattern: string): readonly string[] =>
  [...new Bun.Glob(pattern).scanSync({ cwd: ROOT })].sort();

const STORIES = scan("packages/*/src/**/*.stories.tsx");
const DOCS = scan("packages/*/docs/**/*.mdx");

const TITLE = new RegExp(`^(${LAYERS.join("|")})/[^/]+$`);

/** A problem with how `title` sits in the library, or undefined when it is right. */
const layerProblem = (path: string, title: string): string | undefined => {
  if (!TITLE.test(title)) return `${path}: title '${title}' is not <Layer>/<Name>`;
  const layer = title.split("/")[0];
  const name = title.split("/")[1];
  const component = /^packages\/components\/src\/([a-z]+)\/([^/]+)\//.exec(path);
  if (component !== null) {
    const folder = component[1] as keyof typeof LAYER_OF_FOLDER;
    const expected = LAYER_OF_FOLDER[folder];
    if (expected === undefined) return `${path}: unknown layer folder '${folder}'`;
    if (layer !== expected) return `${path}: title '${title}' must start with '${expected}/'`;
    if (name !== component[2]) return `${path}: title '${title}' must name '${component[2]}'`;
    return undefined;
  }
  if (path.startsWith("packages/tokens/src/") && layer !== "Foundations") {
    return `${path}: title '${title}' must start with 'Foundations/'`;
  }
  return undefined;
};

const literalTitle = (path: string): string => {
  const source = readFileSync(join(ROOT, path), "utf8");
  const matches = [...source.matchAll(/^\s*title:\s*"([^"`$]*)"/gm)];
  if (matches.length !== 1) {
    throw new Error(`${path}: expected exactly one literal title: "…", found ${matches.length}`);
  }
  return matches[0]?.[1] as string;
};

const mdxTitle = (path: string): string => {
  const match = /<Meta\s+title="([^"]+)"/.exec(readFileSync(join(ROOT, path), "utf8"));
  if (match === null) throw new Error(`${path}: no <Meta title="…" />`);
  return match[1] as string;
};

const TITLES = new Map<string, string>([
  ...STORIES.map((p) => [p, literalTitle(p)] as const),
  ...DOCS.map((p) => [p, mdxTitle(p)] as const),
]);

describe("layerProblem", () => {
  test("flags a title whose layer disagrees with the folder", () => {
    expect(layerProblem("packages/components/src/atoms/Kpi/Kpi.stories.tsx", "Molecules/Kpi")).toBe(
      "packages/components/src/atoms/Kpi/Kpi.stories.tsx: title 'Molecules/Kpi' must start with 'Atoms/'",
    );
  });

  test("flags a title that is not <Layer>/<Name>", () => {
    expect(layerProblem("packages/tokens/src/X.stories.tsx", "Tokens")).toContain("<Layer>/<Name>");
  });

  test("accepts a matching atom and a Foundations story", () => {
    expect(layerProblem("packages/components/src/atoms/Kpi/Kpi.stories.tsx", "Atoms/Kpi")).toBe(
      undefined,
    );
    expect(layerProblem("packages/tokens/src/Tokens.stories.tsx", "Foundations/Tokens")).toBe(
      undefined,
    );
  });
});

describe("story titles", () => {
  test("there are stories to check", () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(5);
  });

  test("every title is <Layer>/<Name>, in the layer of its folder", () => {
    const problems = [...TITLES].flatMap(([path, title]) => {
      const problem = layerProblem(path, title);
      return problem === undefined ? [] : [problem];
    });
    expect(problems).toEqual([]);
  });

  test("every title is ASCII", () => {
    expect([...TITLES.values()].filter((t) => /[^\x20-\x7e]/.test(t))).toEqual([]);
  });

  test("titles are unique across stories and docs", () => {
    const titles = [...TITLES.values()];
    expect(titles.filter((t, i) => titles.indexOf(t) !== i)).toEqual([]);
  });

  test("the Foundations pages and the three probes are all present", () => {
    const titles = new Set(TITLES.values());
    for (const expected of [
      "Foundations/Tokens",
      "Foundations/Text styles",
      "Foundations/Design system",
      "Foundations/Layers",
      "Atoms/Kpi",
      "Molecules/ArmButton",
      "Molecules/PhaseStrip",
    ]) {
      expect(titles.has(expected)).toBe(true);
    }
  });
});
