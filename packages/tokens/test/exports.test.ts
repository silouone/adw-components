import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR, buildOnce } from "./support/build";
import { parseDeclarations } from "./support/css";

const FILES = [
  "tokens.css",
  "tokens.light.css",
  "typography.css",
  "reset.css",
  "motion.css",
] as const;
const DIST = join(PACKAGE_DIR, "dist");
const SRC = join(PACKAGE_DIR, "src");

type Manifest = {
  readonly files: readonly string[];
  readonly sideEffects: readonly string[];
  readonly publishConfig: { readonly access: string };
  readonly exports: Readonly<Record<string, string>>;
};
const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as Manifest;

beforeAll(buildOnce);

describe("published shape", () => {
  test("dist/ holds exactly the five css files", () => {
    expect(readdirSync(DIST).sort()).toEqual([...FILES].sort());
  });

  test("each dist file is byte-identical to its source", () => {
    for (const file of FILES) {
      expect({
        file,
        same: readFileSync(join(DIST, file), "utf8") === readFileSync(join(SRC, file), "utf8"),
      }).toEqual({
        file,
        same: true,
      });
    }
  });

  test("the exports map keys the five subpaths to ./dist/*.css", () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(FILES.map((f) => `./${f}`).sort());
    for (const file of FILES) expect(manifest.exports[`./${file}`]).toBe(`./dist/${file}`);
  });

  test("each export target exists", () => {
    for (const target of Object.values(manifest.exports)) {
      expect({ target, exists: existsSync(join(PACKAGE_DIR, target)) }).toEqual({
        target,
        exists: true,
      });
    }
  });

  test("files, sideEffects and publishConfig", () => {
    expect(manifest.files).toEqual(["dist"]);
    expect(manifest.sideEffects).toEqual(["**/*.css"]);
    expect(manifest.publishConfig.access).toBe("public");
  });

  test("dist/tokens.css opens with the header and carries color-scheme: dark and the --bg line", () => {
    const css = readFileSync(join(DIST, "tokens.css"), "utf8");
    expect(css.trimStart().startsWith("/*")).toBe(true);
    expect(css).toContain("color-scheme: dark");
    expect(css).toMatch(/--grey-951:\s*#0A0B0F/);
    expect(css).toMatch(/--bg:\s*var\(--grey-951\)/);
  });
});

describe("motion.css", () => {
  const decls = parseDeclarations(readFileSync(join(SRC, "motion.css"), "utf8"));

  test("declares only --dur-* and --ease-* tokens", () => {
    expect(decls.size).toBeGreaterThan(0);
    for (const name of decls.keys()) {
      expect({ name, ok: /^--(dur|ease)-/.test(name) }).toEqual({ name, ok: true });
    }
  });

  test("every --dur-* is a time in s or ms", () => {
    for (const [name, value] of decls) {
      if (name.startsWith("--dur-"))
        expect({ name, ok: /^\d+(\.\d+)?m?s$/.test(value) }).toEqual({ name, ok: true });
    }
  });
});
