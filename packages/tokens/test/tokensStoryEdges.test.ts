import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { kindOf, tierOf, tokensOf } from "../docs/tokensOf";

const SRC = join(import.meta.dir, "..", "src");
const read = (file: string): string => readFileSync(join(SRC, file), "utf8");

describe("tokensOf edges", () => {
  test("keeps the last declaration of a block that has no trailing semicolon", () => {
    expect(tokensOf(":root { --a: 1px; --b: 2px }")).toEqual([
      { name: "--a", value: "1px" },
      { name: "--b", value: "2px" },
    ]);
  });

  test("an empty stylesheet throws rather than rendering an empty page", () => {
    expect(() => tokensOf("")).toThrow("tokensOf: no token");
    expect(() => tokensOf("/* --a: 1; */")).toThrow("tokensOf: no token");
  });

  test("a declaration inside a comment is not a token", () => {
    expect(tokensOf(":root { /* --ghost: 1; */ --a: 1; }")).toEqual([{ name: "--a", value: "1" }]);
  });

  test("a multi-line value stays one token", () => {
    const [shadow] = tokensOf(":root { --shade:\n    0 0 1px red,\n    0 1px 2px blue;\n}");
    expect(shadow?.name).toBe("--shade");
    expect(shadow?.value).toContain("0 0 1px red,");
    expect(shadow?.value).toContain("0 1px 2px blue");
  });

  test("a var() reference inside a value is not mistaken for a declaration", () => {
    expect(tokensOf(":root { --a: 1; --b: calc(var(--a) * 2); }").map((t) => t.name)).toEqual([
      "--a",
      "--b",
    ]);
  });

  test("the duplicate is reported even when the two declarations are far apart", () => {
    expect(() => tokensOf(":root { --a: 1; --b: 2; }\n.x { --b: 3; }")).toThrow(
      "tokensOf: --b declared twice",
    );
  });
});

describe("kindOf and tierOf edges", () => {
  const kind = (value: string): string => {
    const token = { name: "--t", value };
    return kindOf(token, [token]);
  };

  test("short, long and alpha hex, rgb(), rgba(), hsl() and hsla() are swatches", () => {
    for (const value of [
      "#fff",
      "#FFFFFF",
      "#ffffff80",
      "rgb(0 0 0)",
      "rgba(0,0,0,.5)",
      "hsl(0 0% 0%)",
      "hsla(0,0%,0%,.5)",
    ]) {
      expect(kind(value)).toBe("swatch");
    }
  });

  test("lengths, durations, shadows and var() with a fallback are values", () => {
    for (const value of [
      "12px",
      "120ms",
      "0",
      "0 8px 24px #000",
      "var(--a, #fff)",
      "cubic-bezier(.2,0,0,1)",
    ]) {
      expect(kind(value)).toBe("value");
    }
  });

  test("a var() cycle throws, naming the whole loop", () => {
    const a = { name: "--a", value: "var(--b)" };
    const b = { name: "--b", value: "var(--a)" };
    expect(() => kindOf(a, [a, b])).toThrow("kindOf: --a loops through --a -> --b -> --a");
  });

  test("a token that references itself throws", () => {
    const a = { name: "--a", value: "var(--a)" };
    expect(() => kindOf(a, [a])).toThrow("--a loops");
  });

  test("a long var() chain to a colour is a swatch, to a length is a value", () => {
    const tokens = tokensOf(
      ":root { --c: #123456; --b: var(--c); --a: var(--b); --l: 3px; --k: var(--l); }",
    );
    const kinds = tokens.map((t) => kindOf(t, tokens));
    expect(kinds).toEqual(["swatch", "swatch", "swatch", "value", "value"]);
  });

  test("a color-mix() is a semantic swatch, a hex is a primitive", () => {
    expect(tierOf({ name: "--tint", value: "color-mix(in srgb, #fff 40%, transparent)" })).toBe(
      "semantic",
    );
    expect(tierOf({ name: "--blue-1", value: "#7CC5FF" })).toBe("primitives");
  });

  test("scale prefixes win over a colour-looking value, --pc- wins over the rest", () => {
    expect(tierOf({ name: "--z-top", value: "10" })).toBe("scales");
    expect(tierOf({ name: "--r-2", value: "4px" })).toBe("scales");
    expect(tierOf({ name: "--pc-ship", value: "#fff" })).toBe("phases");
  });

  test("a prefix without the dash is not a scale (--fsx, --radius)", () => {
    expect(tierOf({ name: "--radius", value: "4px" })).toBe("semantic");
  });
});

describe("the real tokens.css as the Tokens story sees it", () => {
  const tokens = tokensOf(read("tokens.css"));

  test("every token classifies without a loop or a dangling var()", () => {
    expect(() => tokens.map((t) => kindOf(t, tokens))).not.toThrow();
  });

  test("every tier the story renders has at least one token", () => {
    const tiers = new Set(tokens.map(tierOf));
    expect([...tiers].sort()).toEqual(["phases", "primitives", "scales", "semantic"]);
  });

  test("every swatch is a colour and every scale token is a value", () => {
    for (const token of tokens) {
      if (tierOf(token) === "scales") expect(kindOf(token, tokens)).toBe("value");
      if (tierOf(token) === "primitives") expect(kindOf(token, tokens)).toBe("swatch");
    }
  });
});

describe("Text styles story against typography.css", () => {
  const story = read("TextStyles.stories.tsx");
  const css = read("typography.css");

  const classes = (prefix: "t" | "c"): readonly string[] =>
    [
      ...new Set(
        [...css.matchAll(new RegExp(`^\\.(${prefix}-[a-z0-9]+)\\b`, "gm"))].map(
          (m) => m[1] as string,
        ),
      ),
    ].sort();

  test("every .t-* size and utility has a row", () => {
    const sizes = [...story.matchAll(/"(2xs|xs|sm|md|base|lg|xl|2xl)"/g)].map((m) => `t-${m[1]}`);
    const utilities = [...story.matchAll(/"(t-[a-z]+)"/g)].map((m) => m[1] as string);
    expect([...new Set([...sizes, ...utilities])].sort()).toEqual([...classes("t")]);
  });

  test("every .c-* colour has a row", () => {
    const colours = [...story.matchAll(/"(c-[a-z]+)"/g)].map((m) => m[1] as string);
    expect([...new Set(colours)].sort()).toEqual([...classes("c")]);
  });
});

describe("Foundations stories use tokens only", () => {
  for (const file of ["Tokens.stories.tsx", "TextStyles.stories.tsx"]) {
    test(`${file}: no colour literal and no raw length`, () => {
      const source = read(file);
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source).not.toMatch(/\b(?:rgba?|hsla?)\(/);
      const lengths = [...source.matchAll(/\b\d+(?:\.\d+)?(?:px|rem|em)\b/g)].map((m) => m[0]);
      expect(lengths.filter((l) => l !== "1px")).toEqual([]);
    });
  }
});
