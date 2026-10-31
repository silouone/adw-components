import { beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOnce, DIST, readManifest, run } from "./support/build";

beforeAll(buildOnce, 60_000);

const manifest = readManifest();
const targets = Object.values(manifest.exports).flatMap((v) =>
  typeof v === "string" ? [v] : [v.types, v.import],
);
const rel = (p: string): string => p.replace(/^\.\//, "");

const listDist = (): string[] =>
  readdirSync(DIST, { recursive: true, encoding: "utf8", withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => join(d.parentPath, d.name).slice(DIST.length + 1))
    .sort();

describe("dist hygiene", () => {
  test("every dist/**/*.js corresponds to an export", () => {
    const exported = new Set(targets.map(rel));
    const js = listDist()
      .filter((f) => f.endsWith(".js"))
      .map((f) => `dist/${f}`);
    expect(js.length).toBeGreaterThan(0);
    for (const file of js) expect(exported.has(file), `${file} has no export`).toBe(true);
  });

  test("dist holds exactly the exports' js and d.ts, one css per component, and components.css", () => {
    const expected = [
      ...targets.map((t) => rel(t).replace(/^dist\//, "")),
      ...targets
        .filter((t) => t.endsWith(".js"))
        .map((t) =>
          rel(t)
            .replace(/^dist\//, "")
            .replace(/\.js$/, ".css"),
        ),
    ];
    expect(listDist()).toEqual([...new Set(expected)].sort());
  });

  test("no .d.ts points into src", () => {
    for (const file of listDist().filter((f) => f.endsWith(".d.ts"))) {
      const specs = [
        ...readFileSync(join(DIST, file), "utf8").matchAll(/from\s*["'](\.[^"']*)["']/g),
      ];
      for (const m of specs) expect(m[1], file).not.toContain("src/");
    }
  });

  test("no sourcemap, tsbuildinfo or *.map ships", () => {
    for (const file of listDist()) expect(file, file).not.toMatch(/\.map$|tsbuildinfo/);
    for (const file of listDist().filter((f) => f.endsWith(".js"))) {
      expect(readFileSync(join(DIST, file), "utf8"), file).not.toContain("sourceMappingURL");
    }
  });

  test("bun pm pack --dry-run lists package.json and dist/ files only", () => {
    const out = run(["bun", "pm", "pack", "--dry-run"]);
    const listed = [...out.matchAll(/^packed\s+\S+\s+(.+)$/gm)].map((m) => m[1] as string);
    expect(listed).toContain("package.json");
    for (const file of listed) {
      expect(file === "package.json" || file.startsWith("dist/"), file).toBe(true);
    }
    expect(listed.filter((f) => f.startsWith("dist/")).sort()).toEqual(
      listDist().map((f) => `dist/${f}`),
    );
  });

  test("the build is repeatable: a second build leaves an identical file list", () => {
    const first = listDist();
    run(["bun", "run", "build"]);
    expect(listDist()).toEqual(first);
  }, 60_000);
});
