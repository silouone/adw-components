import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR } from "./support/build";

// The library is the stateless layer: a component renders from its props and reports through
// callbacks. The factory's containers (signals, the event stream, the URL, storage) are not
// copied, so no source under `src/` may import a signal module or name the browser state they read.

const FORBIDDEN: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: "@preact/signals", pattern: /@preact\/signals/ },
  { name: "EventSource", pattern: /\bEventSource\b/ },
  { name: "location", pattern: /\blocation\b/ },
  { name: "history", pattern: /\bhistory\b/ },
  { name: "localStorage", pattern: /\blocalStorage\b/ },
];

/** A source with its comments blanked: a comment may say what a component does not do. */
export const codeOf = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The forbidden names a source uses, each once. */
export const statefulNamesIn = (source: string): readonly string[] => {
  const code = codeOf(source);
  return FORBIDDEN.filter((f) => f.pattern.test(code)).map((f) => f.name);
};

const SOURCES = [...new Bun.Glob("src/**/*.{ts,tsx}").scanSync({ cwd: PACKAGE_DIR })]
  .filter((path) => !/\.(?:test|stories)\.tsx?$/.test(path))
  .sort();

describe("statefulNamesIn", () => {
  test("flags a signal import and each browser-state name", () => {
    const source = 'import { signal } from "@preact/signals";\nnew EventSource(location.href);\n';
    expect(statefulNamesIn(source)).toEqual(["@preact/signals", "EventSource", "location"]);
  });

  test("flags history and localStorage", () => {
    expect(statefulNamesIn("history.pushState({}, '', '/');\nlocalStorage.getItem('k');")).toEqual([
      "history",
      "localStorage",
    ]);
  });

  test("ignores a comment that names one", () => {
    const source =
      "// never reads location or history\n/* nor localStorage */\nexport const a = 1;\n";
    expect(statefulNamesIn(source)).toEqual([]);
  });

  test("does not flag a longer identifier", () => {
    expect(statefulNamesIn("const relocation = 1; const historyLength = 2;")).toEqual([]);
  });
});

describe("the library sources are stateless", () => {
  test("the scan sees the component sources", () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    expect(SOURCES).toContain("src/pages/BoardPage/BoardPage.tsx");
  });

  test("no source imports @preact/signals or names EventSource, location, history or localStorage", () => {
    const offenders = SOURCES.flatMap((path) => {
      const names = statefulNamesIn(readFileSync(join(PACKAGE_DIR, path), "utf8"));
      return names.length === 0 ? [] : [`${path}: ${names.join(", ")}`];
    });
    expect(offenders).toEqual([]);
  });
});
