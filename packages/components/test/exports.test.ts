import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOnce, PACKAGE_DIR, readManifest } from "./support/build";

beforeAll(buildOnce, 60_000);

const manifest = readManifest();
// Each layered export and the function (and props type) its dist module declares.
const components = [
  ["Kpi", "Kpi"],
  ["Arm", "Arm"],
  ["Badge", "RoundBadge"],
  ["Badge", "WatchdogBadge"],
  ["BaseRedChip", "BaseRedChip"],
  ["CopyId", "CopyId"],
  ["DockStrip", "DockStrip"],
  ["PhaseLegend", "PhaseLegend"],
  ["TabSection", "TabSection"],
  ["UpNext", "UpNext"],
  ["Verdict", "VerdictEvidence"],
  ["ArmButton", "ArmButton"],
  ["PhaseStrip", "PhaseStrip"],
] as const;
// The components whose props are a named `<Name>Props` rather than an inline type.
const namedProps = new Set([
  "Kpi",
  "Arm",
  "CopyId",
  "PhaseLegend",
  "UpNext",
  "ArmButton",
  "PhaseStrip",
]);
const modules = ["glyphs"] as const;
const expectedExports = [
  ...new Set([...components.map(([name]) => name), ...modules]),
  "components.css",
].map((name) => `./${name}`);
const objectExports = Object.entries(manifest.exports).flatMap(([key, value]) =>
  typeof value === "string" ? [] : [{ key, ...value }],
);
const layered = objectExports.filter(({ key }) => !modules.some((m) => key === `./${m}`));
const abs = (p: string): string => join(PACKAGE_DIR, p);

describe("manifest", () => {
  test("the manifest ships only dist, flags css side effects, publishes public", () => {
    expect(manifest.files).toEqual(["dist"]);
    expect(manifest.sideEffects).toEqual(["**/*.css"]);
    expect(manifest.publishConfig.access).toBe("public");
  });

  test("preact is a peer (^10.29) and tokens a workspace dependency", () => {
    expect(manifest.peerDependencies.preact).toBe("^10.29");
    expect(manifest.dependencies["@adw-factory/tokens"]).toBe("workspace:*");
  });

  test('there is no barrel: no "." export, no main, module or types field', () => {
    expect(Object.keys(manifest.exports)).not.toContain(".");
    for (const field of ["main", "module", "types"]) expect(manifest[field]).toBeUndefined();
  });

  test("exports are exactly the components, ./glyphs and ./components.css", () => {
    expect(Object.keys(manifest.exports).sort()).toEqual([...expectedExports].sort());
  });
});

describe("export targets", () => {
  test("every export target exists after the build", () => {
    for (const value of Object.values(manifest.exports)) {
      for (const target of typeof value === "string" ? [value] : [value.types, value.import]) {
        expect(existsSync(abs(target)), `missing ${target}`).toBe(true);
      }
    }
  });

  test("each types target mirrors its import target (same folder, same name)", () => {
    for (const { key, types, import: js } of objectExports) {
      expect(types, `export ${key}`).toBe(js.replace(/\.js$/, ".d.ts"));
    }
  });

  test("each import target resolves to the layer folder that holds its source", () => {
    for (const { key, import: js } of layered) {
      const match = /^\.\/dist\/([a-z]+)\/([A-Za-z0-9]+)\/\2\.js$/.exec(js);
      expect(match, `export ${key}`).not.toBeNull();
      const [, layer, name] = match as RegExpExecArray;
      expect(existsSync(abs(`src/${layer}/${name}/${name}.tsx`)), `source of ${key}`).toBe(true);
    }
  });

  test("each dist module exports its component function and its .d.ts declares it", async () => {
    for (const [name, fn] of components) {
      const entry = objectExports.find((e) => e.key === `./${name}`);
      expect(entry, `export ./${name}`).toBeDefined();
      const mod = (await import(abs((entry as { import: string }).import))) as Record<
        string,
        unknown
      >;
      expect(typeof mod[fn], `${fn} export of the ./${name} dist module`).toBe("function");
      const dts = readFileSync(abs((entry as { types: string }).types), "utf8");
      expect(dts, `${fn} in the ./${name} declarations`).toMatch(
        new RegExp(`export declare function ${fn}\\b`),
      );
      if (namedProps.has(name)) {
        expect(dts).toMatch(new RegExp(`export (interface|type) ${name}Props`));
      }
    }
  });

  test("./glyphs resolves to a module of glyph tables", async () => {
    const mod = (await import(abs("dist/glyphs.js"))) as Record<string, unknown>;
    expect(Object.keys(mod).sort()).toEqual(
      [
        "BAY_GLYPH",
        "NEUTRAL_GLYPH",
        "PROVIDER_GLYPH",
        "RUNNER_GLYPH",
        "SECTION_GLYPH",
        "SLOT_GLYPH",
        "VIEW_TAB_GLYPH",
      ].sort(),
    );
    expect(readFileSync(abs("dist/glyphs.d.ts"), "utf8")).toContain("PROVIDER_GLYPH");
  });
});
