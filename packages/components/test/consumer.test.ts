import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { buildOnce, PACKAGE_DIR } from "./support/build";

const CONSUMER_DIR = join(PACKAGE_DIR, "../../examples/consumer");

interface Built {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

let built: Built;
let bundle: { readonly js: string; readonly css: string };

beforeAll(() => {
  buildOnce();
  const result = Bun.spawnSync(["bun", "build.ts"], {
    cwd: CONSUMER_DIR,
    stdout: "pipe",
    stderr: "pipe",
  });
  built = {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
  if (built.exitCode === 0) bundle = JSON.parse(built.stdout);
}, 60_000);

describe("examples/consumer build", () => {
  test("the build exits 0 and prints only the JSON", () => {
    expect(built.exitCode, built.stderr).toBe(0);
    expect(Object.keys(bundle).sort()).toEqual(["css", "js"]);
  });

  test("the bundle contains Kpi's code", () => {
    expect(bundle.js).toContain("kpi-link");
  });

  test("the bundle contains none of ArmButton's or PhaseStrip's code", () => {
    for (const marker of ["arm-btn", "armed", "tc-strip", "tc-ph"]) {
      expect(bundle.js, marker).not.toContain(marker);
    }
  });

  test("the bundle has no import.meta, no node: specifier and no css text", () => {
    expect(bundle.js).not.toContain("import.meta");
    expect(bundle.js).not.toContain("node:");
    expect(bundle.js).not.toContain("var(--");
  });

  test("the css string is components.css and carries all three components", () => {
    for (const marker of [".kpi", ".arm-btn", ".tc-strip"]) expect(bundle.css).toContain(marker);
  });
});
