import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOnce, DIST, PACKAGE_DIR } from "./support/build";

beforeAll(buildOnce, 60_000);

const sourceCss = (layer: string, name: string): string =>
  readFileSync(join(PACKAGE_DIR, "src", layer, name, `${name}.css`), "utf8");

const filesUnder = (dir: string, ext: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(ext))
    .map((f) => join(dir, f));

const jsFiles = (): string[] => filesUnder(DIST, ".js");

describe("css in the dist", () => {
  test("dist/atoms/Kpi/Kpi.css exists beside Kpi.js and equals its source", () => {
    const built = join(DIST, "atoms/Kpi/Kpi.css");
    expect(existsSync(built)).toBe(true);
    expect(existsSync(join(DIST, "atoms/Kpi/Kpi.js"))).toBe(true);
    expect(readFileSync(built, "utf8")).toBe(sourceCss("atoms", "Kpi"));
  });

  test("components.css holds the three stylesheets in layer order", () => {
    const all = readFileSync(join(DIST, "components.css"), "utf8");
    const at = [
      sourceCss("atoms", "Kpi"),
      sourceCss("molecules", "ArmButton"),
      sourceCss("molecules", "PhaseStrip"),
    ].map((css) => all.indexOf(css.trimEnd()));
    for (const i of at) expect(i).toBeGreaterThanOrEqual(0);
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });

  test("no dist js imports a css file", () => {
    for (const file of jsFiles()) expect(readFileSync(file, "utf8"), file).not.toMatch(/\.css["']/);
  });

  test("no .d.ts imports a css file", () => {
    for (const file of filesUnder(DIST, ".d.ts")) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/\.css["']/);
    }
  });
});

describe("dist js imports", () => {
  test("dist js imports only preact, preact/hooks and preact/jsx-runtime", () => {
    const allowed = new Set(["preact", "preact/hooks", "preact/jsx-runtime"]);
    for (const file of jsFiles()) {
      const specs = [...readFileSync(file, "utf8").matchAll(/from\s*["']([^"']+)["']/g)].map(
        (m) => m[1] as string,
      );
      for (const spec of specs) expect(allowed.has(spec), `${file} imports ${spec}`).toBe(true);
    }
  });

  test("no dist js mentions jsx-dev-runtime", () => {
    for (const file of jsFiles()) {
      expect(readFileSync(file, "utf8"), file).not.toContain("jsx-dev-runtime");
    }
  });
});
