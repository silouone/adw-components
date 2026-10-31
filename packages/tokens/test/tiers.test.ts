import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDeclarations, resolveToken } from "./support/css";

const read = (file: string): string => readFileSync(join(import.meta.dir, "../src", file), "utf8");
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");
const normaliseQuotes = (css: string): string => css.replace(/'/g, '"');
const squash = (css: string): string => normaliseQuotes(stripComments(css)).replace(/\s+/g, " ");

const tokensCss = read("tokens.css");
const decls = parseDeclarations(tokensCss);

const PRIMITIVE = /^--(grey|blue|green|amber|orange|red|pink|teal|violet|lime)-\d+$/;
const SCALE = /^--(fs|sp|r|z|hue-s|hue-l)-/;
const isPrimitive = (name: string): boolean => PRIMITIVE.test(name);
const isScale = (name: string): boolean => SCALE.test(name);
const isShadow = (name: string): boolean => name.startsWith("--shadow-");

// The only semantic tokens the snapshot declares as hsl() literals; R1 forbids changing them.
const HSL_LITERALS = ["--live-deep", "--live-soft", "--live-fill", "--live-line", "--live-span"];

const colourSemantics = [...decls].filter(
  ([name]) => !isPrimitive(name) && !isScale(name) && !isShadow(name),
);

describe("tiers", () => {
  test("each hex literal appears once, case-insensitively", () => {
    const hexes = [...stripComments(tokensCss).matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) =>
      m[0].toLowerCase(),
    );
    const repeated = hexes.filter((h, i) => hexes.indexOf(h) !== i);
    expect(repeated).toEqual([]);
    expect(hexes.length).toBeGreaterThan(0);
  });

  test("primitives are only hex", () => {
    const primitives = [...decls].filter(([name]) => isPrimitive(name));
    expect(primitives.length).toBeGreaterThan(0);
    for (const [name, value] of primitives) {
      expect({ name, hex: /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value) }).toEqual({
        name,
        hex: true,
      });
    }
  });

  test("every colour token resolves to a primitive or a colour-mix", () => {
    expect(colourSemantics.length).toBeGreaterThan(0);
    for (const [name, value] of colourSemantics) {
      if (HSL_LITERALS.includes(name)) continue;
      if (value.startsWith("color-mix(")) continue;
      const ref = /^var\((--[\w-]+)\)$/.exec(value);
      expect({ name, ref: ref !== null }).toEqual({ name, ref: true });
      const leaf = resolveToken(decls, name);
      expect({ name, hex: /^#[0-9a-fA-F]{3,6}$/.test(leaf) }).toEqual({ name, hex: true });
    }
  });

  test("the hsl allow-list names only tokens that exist and are hsl()", () => {
    for (const name of HSL_LITERALS) expect(decls.get(name)).toMatch(/^hsl\(/);
  });

  test("shadows are colour-mix over --overlay-bg", () => {
    const shadows = [...decls].filter(([name]) => isShadow(name));
    expect(shadows.map(([name]) => name)).toEqual(["--shadow-1", "--shadow-2", "--shadow-3"]);
    for (const [, value] of shadows)
      expect(value).toMatch(
        /color-mix\(in srgb\s*,\s*var\(--overlay-bg\) \d+%\s*,\s*transparent\)/,
      );
  });

  test("scales are plain lengths, numbers and percentages", () => {
    for (const [name, value] of decls) {
      if (/^--(fs|sp|r)-/.test(name))
        expect({ name, ok: /^\d+(\.\d+)?(px|%)$/.test(value) }).toEqual({ name, ok: true });
      if (name.startsWith("--z-"))
        expect({ name, ok: /^\d+$/.test(value) }).toEqual({ name, ok: true });
      if (/^--hue-[sl]-/.test(name))
        expect({ name, ok: /^\d+%$/.test(value) }).toEqual({ name, ok: true });
    }
  });

  test("tokens.css declares color-scheme: dark on :root", () => {
    expect(squash(tokensCss)).toMatch(/:root ?\{[^}]*color-scheme: ?dark;/);
  });

  test("no token is declared outside :root", () => {
    const outside = squash(tokensCss).replace(/:root ?\{[^}]*\}/g, "");
    expect(outside).not.toMatch(/--[\w-]+ ?:/);
  });
});

describe("light layer", () => {
  const light = read("tokens.light.css");
  const body = squash(light);

  test("declares color-scheme: light under both D4.5 selectors", () => {
    expect(body).toMatch(
      /@media \(prefers-color-scheme: ?light\) ?\{ ?:root:not\(\[data-theme="dark"\]\) ?\{ ?color-scheme: ?light; ?\} ?\}/,
    );
    expect(body).toMatch(/:root\[data-theme="light"\] ?\{ ?color-scheme: ?light; ?\}/);
  });

  test("is empty of colour overrides: no custom property", () => {
    expect(body).not.toMatch(/--[\w-]+ ?:/);
  });

  test("the header comment explains the (0,2,0) specificity", () => {
    expect(light).toContain("(0,2,0)");
  });
});
