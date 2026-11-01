import { describe, expect, test } from "bun:test";
import {
  concatCss,
  type Entry,
  entriesOf,
  modulesOf,
  orderEntries,
  stripCssImports,
} from "../tools/entries";

const kpi = {
  types: "./dist/atoms/Kpi/Kpi.d.ts",
  import: "./dist/atoms/Kpi/Kpi.js",
};
const always = () => true;

describe("entriesOf", () => {
  test("maps ./Kpi to src/atoms/Kpi/Kpi.tsx and dist/atoms/Kpi/Kpi.{js,d.ts,css}", () => {
    expect(entriesOf({ "./Kpi": kpi }, always)).toEqual([
      {
        subpath: "./Kpi",
        name: "Kpi",
        layer: "atoms",
        src: "src/atoms/Kpi/Kpi.tsx",
        js: "dist/atoms/Kpi/Kpi.js",
        dts: "dist/atoms/Kpi/Kpi.d.ts",
        css: "dist/atoms/Kpi/Kpi.css",
      },
    ]);
  });

  test("ignores the string export ./components.css", () => {
    const entries = entriesOf(
      { "./Kpi": kpi, "./components.css": "./dist/components.css" },
      always,
    );
    expect(entries.map((e) => e.subpath)).toEqual(["./Kpi"]);
  });

  test("throws naming the export and the expected source when the source is missing", () => {
    const ghost = {
      types: "./dist/atoms/Ghost/Ghost.d.ts",
      import: "./dist/atoms/Ghost/Ghost.js",
    };
    expect(() => entriesOf({ "./Ghost": ghost }, (p) => p !== "src/atoms/Ghost/Ghost.tsx")).toThrow(
      'export "./Ghost" has no source at src/atoms/Ghost/Ghost.tsx',
    );
  });

  test("throws when types and import disagree", () => {
    const bad = { types: "./dist/atoms/Other/Other.d.ts", import: kpi.import };
    expect(() => entriesOf({ "./Kpi": bad }, always)).toThrow('export "./Kpi"');
  });

  test("throws when the dist path has no known layer", () => {
    const bad = { types: "./dist/blobs/Kpi/Kpi.d.ts", import: "./dist/blobs/Kpi/Kpi.js" };
    expect(() => entriesOf({ "./Kpi": bad }, always)).toThrow('export "./Kpi"');
  });

  test("throws when the folder and file name differ", () => {
    const bad = { types: "./dist/atoms/Kpi/Chip.d.ts", import: "./dist/atoms/Kpi/Chip.js" };
    expect(() => entriesOf({ "./Kpi": bad }, always)).toThrow('export "./Kpi"');
  });
});

const glyphs = { types: "./dist/glyphs.d.ts", import: "./dist/glyphs.js" };

describe("modulesOf", () => {
  test("maps ./glyphs to src/glyphs.ts and dist/glyphs.{js,d.ts}, with no stylesheet", () => {
    expect(modulesOf({ "./glyphs": glyphs, "./Kpi": kpi }, always)).toEqual([
      {
        subpath: "./glyphs",
        name: "glyphs",
        src: "src/glyphs.ts",
        js: "dist/glyphs.js",
        dts: "dist/glyphs.d.ts",
      },
    ]);
  });

  test("entriesOf leaves a module export to modulesOf", () => {
    expect(entriesOf({ "./glyphs": glyphs, "./Kpi": kpi }, always).map((e) => e.subpath)).toEqual([
      "./Kpi",
    ]);
  });

  test("throws naming the export and the expected source when the source is missing", () => {
    expect(() => modulesOf({ "./glyphs": glyphs }, () => false)).toThrow(
      'export "./glyphs" has no source at src/glyphs.ts',
    );
  });

  test("throws when the subpath, the types or the import disagree", () => {
    expect(() => modulesOf({ "./icons": glyphs }, always)).toThrow('export "./icons"');
    expect(() =>
      modulesOf({ "./glyphs": { ...glyphs, types: "./dist/other.d.ts" } }, always),
    ).toThrow('export "./glyphs"');
  });
});

const entry = (layer: string, name: string): Entry => ({
  subpath: `./${name}`,
  name,
  layer,
  src: `src/${layer}/${name}/${name}.tsx`,
  js: `dist/${layer}/${name}/${name}.js`,
  dts: `dist/${layer}/${name}/${name}.d.ts`,
  css: `dist/${layer}/${name}/${name}.css`,
});

describe("orderEntries and concatCss", () => {
  test("orders by layer, then name, without mutating its input", () => {
    const input = [
      entry("molecules", "PhaseStrip"),
      entry("pages", "Run"),
      entry("molecules", "ArmButton"),
      entry("atoms", "Kpi"),
    ];
    const snapshot = [...input];
    expect(orderEntries(input).map((e) => e.name)).toEqual([
      "Kpi",
      "ArmButton",
      "PhaseStrip",
      "Run",
    ]);
    expect(input).toEqual(snapshot);
  });

  test("concatCss trims each file and joins with one newline, ending in a newline", () => {
    expect(concatCss(["a{}\n\n", "b{}  \n"])).toBe("a{}\nb{}\n");
  });

  test("stripCssImports removes only the side-effect css import lines of a d.ts", () => {
    const dts = 'import "./Kpi.css";\nimport type { X } from "./x";\nexport declare const k: X;\n';
    expect(stripCssImports(dts)).toBe(
      'import type { X } from "./x";\nexport declare const k: X;\n',
    );
  });
});
