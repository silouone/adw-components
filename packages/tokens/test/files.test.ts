import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDeclarations } from "./support/css";

const read = (file: string): string => readFileSync(join(import.meta.dir, "../src", file), "utf8");
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

const typography = stripComments(read("typography.css"));
const reset = stripComments(read("reset.css"));
const motion = stripComments(read("motion.css"));

const rule = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[}\\s,])${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
};

describe("typography.css", () => {
  const CLASSES = [
    ".t-2xs",
    ".t-xs",
    ".t-sm",
    ".t-md",
    ".t-base",
    ".t-lg",
    ".t-xl",
    ".t-2xl",
    ".t-mono",
    ".t-sans",
    ".t-tabular",
    ".t-eyebrow",
    ".t-truncate",
    ".t-clamp",
  ];

  test("defines the ladder and the utility classes", () => {
    for (const cls of CLASSES) {
      expect({ cls, defined: rule(typography, cls) !== "" }).toEqual({ cls, defined: true });
    }
  });

  test("each ladder step reads its --fs token", () => {
    for (const step of ["2xs", "xs", "sm", "md", "base", "lg", "xl", "2xl"]) {
      expect(rule(typography, `.t-${step}`)).toContain(`font-size: var(--fs-${step})`);
    }
  });

  test(".t-eyebrow is uppercase and tracked", () => {
    const body = rule(typography, ".t-eyebrow");
    expect(body).toContain("text-transform: uppercase");
    expect(body).toContain("letter-spacing");
  });

  test("colour utilities exist and .c-faint does not", () => {
    for (const name of ["dim", "ink", "ok", "bad", "warn", "live"]) {
      expect(rule(typography, `.c-${name}`)).toContain(`color: var(--${name})`);
    }
    expect(typography).not.toContain(".c-faint");
  });
});

describe("reset.css", () => {
  test("carries box-sizing, body, :focus-visible in --live and the reduced-motion floor", () => {
    expect(reset).toMatch(/\*\s*\{\s*box-sizing:\s*border-box/);
    expect(rule(reset, "body")).toContain("background: var(--bg)");
    expect(reset).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--live\)/);
    expect(reset).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
    expect(reset).toContain("animation: none !important");
    expect(reset).toContain("transition: none !important");
  });

  test("leaves the page's zoom and the component rules out", () => {
    expect(reset).not.toMatch(/zoom|\.chip|\.kpi|\.ph-|\.cause/);
  });
});

describe("typography, reset and motion", () => {
  const declared = new Set([
    ...parseDeclarations(read("tokens.css")).keys(),
    ...parseDeclarations(read("typography.css")).keys(),
    ...parseDeclarations(read("motion.css")).keys(),
  ]);

  // --adw-<component>-<thing> properties are set by the component, with a fallback at the read.
  test("every var(--x) resolves to a declared token", () => {
    for (const css of [typography, reset, motion]) {
      for (const [, name] of css.matchAll(/var\((--(?!adw-)[\w-]+)/g)) {
        expect({ name, declared: declared.has(name as string) }).toEqual({ name, declared: true });
      }
    }
  });

  test("no hex, rgb( or hsl(", () => {
    for (const css of [typography, reset, motion]) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    }
  });
});
