import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { PACKAGE_DIR, readManifest } from "./support/build";

// A copied test may reach only its component, its own folder's parts, its siblings, the glyph module, the
// library's own fixtures and the test tooling. A factory path in a test is a test that
// cannot move with its component.

const PACKAGES = new Set(["preact", "preact/hooks", "@testing-library/preact", "bun:test"]);
const COMPONENT_MODULE = /^src\/(?:atoms|molecules|organisms|templates|pages)\/([A-Za-z0-9]+)\/\1$/;
/** Exported sub-parts of a component folder (`./FocusPanel/focusTabs`), as `src/<layer>/<Folder>/<file>`. */
const SUB_PARTS: ReadonlySet<string> = new Set(
  Object.values(readManifest().exports).flatMap((v) => {
    const m =
      typeof v === "string"
        ? null
        : /^\.\/dist\/([a-z]+\/([A-Za-z0-9]+)\/(?!\2\.js)[A-Za-z0-9]+)\.js$/.exec(v.import);
    return m === null ? [] : [`src/${m[1]}`];
  }),
);
const FIXTURE_MODULE = /^fixtures\/[A-Za-z0-9]+$/;

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

/** Every module specifier a source imports, statically or dynamically. */
export const specifiersOf = (source: string): readonly string[] =>
  [...source.matchAll(SPECIFIER)].map((m) => m[1] as string);

/** `packagePath` is the test's path from the package root, e.g. `src/atoms/Kpi/Kpi.test.tsx`. */
export const importProblem = (packagePath: string, specifier: string): string | undefined => {
  if (PACKAGES.has(specifier) || specifier.startsWith("node:")) return undefined;
  if (!specifier.startsWith(".")) {
    return `${packagePath}: imports "${specifier}", which is not a library test dependency`;
  }
  const target = posix.normalize(posix.join(posix.dirname(packagePath), specifier));
  const ownPart = SUB_PARTS.has(target) && posix.dirname(target) === posix.dirname(packagePath);
  const reachable =
    COMPONENT_MODULE.test(target) ||
    ownPart ||
    target === "src/glyphs" ||
    FIXTURE_MODULE.test(target);
  return reachable
    ? undefined
    : `${packagePath}: imports "${specifier}" (${target}), which is not a component, glyphs or a fixture of this package`;
};

export const problemsOf = (packagePath: string, source: string): readonly string[] =>
  specifiersOf(source).flatMap((spec) => {
    const problem = importProblem(packagePath, spec);
    return problem === undefined ? [] : [problem];
  });

const TESTS = [...new Bun.Glob("src/**/*.test.tsx").scanSync({ cwd: PACKAGE_DIR })].sort();

describe("problemsOf", () => {
  const kpiTest = "src/atoms/Kpi/Kpi.test.tsx";

  test("flags a test that imports a factory path", () => {
    const source = 'import { parseFailure } from "../../../../../src/web/failure";\n';
    expect(problemsOf(kpiTest, source)).toEqual([
      `${kpiTest}: imports "../../../../../src/web/failure" (../../src/web/failure), which is not a component, glyphs or a fixture of this package`,
    ]);
  });

  test("flags the factory's css helper and a bare package", () => {
    const source =
      'import { cleanupAtHome } from "./css-home";\nimport { signal } from "@preact/signals";\n';
    expect(problemsOf(kpiTest, source)).toHaveLength(2);
  });

  test("flags a dynamic import and a require", () => {
    const source = 'const a = await import("../../../x");\nconst b = require("../../../y");\n';
    expect(problemsOf(kpiTest, source)).toHaveLength(2);
  });

  test("accepts the component, a sibling, glyphs, a fixture and the test tooling", () => {
    const source = [
      'import { describe } from "bun:test";',
      'import { render } from "@testing-library/preact";',
      'import { useState } from "preact/hooks";',
      'import type { ComponentChildren } from "preact";',
      'import { readFileSync } from "node:fs";',
      'import { Kpi } from "./Kpi";',
      'import { Arm } from "../Arm/Arm";',
      'import { PhaseStrip } from "../../molecules/PhaseStrip/PhaseStrip";',
      'import { PROVIDER_GLYPH } from "../../glyphs";',
      'import { BASE_RED } from "../../../fixtures/BaseRedChip";',
    ].join("\n");
    expect(problemsOf(kpiTest, source)).toEqual([]);
  });

  test("accepts an exported sub-part of its own component folder only", () => {
    const panelTest = "src/organisms/FocusPanel/FocusPanel.test.tsx";
    expect(problemsOf(panelTest, 'import { x } from "./focusTabs";')).toEqual([]);
    expect(
      problemsOf(kpiTest, 'import { x } from "../../organisms/FocusPanel/focusTabs";'),
    ).toHaveLength(1);
  });

  test("flags a component that is not at <layer>/<Name>/<Name>", () => {
    expect(problemsOf(kpiTest, 'import x from "../Arm/Other";')).toHaveLength(1);
    expect(problemsOf(kpiTest, 'import x from "./helpers";')).toHaveLength(1);
  });
});

describe("the tests under src/", () => {
  test("there are tests to scan", () => {
    expect(TESTS.length).toBeGreaterThanOrEqual(3);
  });

  test("every one imports only its component, siblings, glyphs, fixtures and test tooling", () => {
    const problems = TESTS.flatMap((path) =>
      problemsOf(path, readFileSync(join(PACKAGE_DIR, path), "utf8")),
    );
    expect(problems).toEqual([]);
  });

  test("each is named for its folder", () => {
    expect(
      TESTS.filter((path) => {
        const parts = path.split("/");
        return parts.length !== 4 || parts[3] !== `${parts[2]}.test.tsx`;
      }),
    ).toEqual([]);
  });
});
