import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { kindOf, tierOf, tokensOf } from "../docs/tokensOf";

const REAL = readFileSync(join(import.meta.dir, "..", "src", "tokens.css"), "utf8");

describe("tokensOf", () => {
  test("lists declarations in source order and strips comments", () => {
    expect(tokensOf("/* c */ :root {\n  --a: 1px; /* x */\n  --b: #fff;\n}")).toEqual([
      { name: "--a", value: "1px" },
      { name: "--b", value: "#fff" },
    ]);
  });

  test("ignores declarations that are not custom properties", () => {
    expect(tokensOf(":root { color-scheme: dark; --a: 0; }")).toEqual([
      { name: "--a", value: "0" },
    ]);
  });

  test("keeps var() and color-mix() values whole", () => {
    const [mix, ref] = tokensOf(
      ":root { --m: color-mix(in srgb, var(--a) 40%, var(--b)); --r: var(--a, 1px); }",
    );
    expect(mix?.value).toBe("color-mix(in srgb, var(--a) 40%, var(--b))");
    expect(ref?.value).toBe("var(--a, 1px)");
  });

  test("throws naming a token declared twice", () => {
    expect(() => tokensOf(":root { --a: 1; --a: 2; }")).toThrow("tokensOf: --a declared twice");
  });

  test("throws when the stylesheet declares no token", () => {
    expect(() => tokensOf(":root { color-scheme: dark; }")).toThrow("tokensOf: no token");
  });

  test("parses the real tokens.css", () => {
    const tokens = tokensOf(REAL);
    expect(tokens.length).toBeGreaterThan(20);
    expect(tokens.filter((t) => kindOf(t, tokens) === "swatch").length).toBeGreaterThan(10);
  });
});

describe("kindOf and tierOf", () => {
  const tokens = tokensOf(
    ":root { --blue-1: #7CC5FF; --live: var(--blue-1); --mix: color-mix(in srgb, var(--live) 40%, transparent); --sp-3: 3px; --pc-build: var(--live); --shade: 0 8px 24px var(--mix); --gap: var(--sp-3); }",
  );

  test("hex, hsl, color-mix and var() chains to a colour are swatches", () => {
    const kinds = Object.fromEntries(tokens.map((t) => [t.name, kindOf(t, tokens)]));
    expect(kinds).toEqual({
      "--blue-1": "swatch",
      "--live": "swatch",
      "--mix": "swatch",
      "--sp-3": "value",
      "--pc-build": "swatch",
      "--shade": "value",
      "--gap": "value",
    });
  });

  test("a var() to nothing declared throws, naming the token", () => {
    expect(() => kindOf({ name: "--x", value: "var(--ghost)" }, [])).toThrow("--x");
  });

  test("tiers: primitives, phases, scales, then semantic", () => {
    expect(tokens.map((t) => tierOf(t))).toEqual([
      "primitives",
      "semantic",
      "semantic",
      "scales",
      "phases",
      "semantic",
      "semantic",
    ]);
  });
});
