import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR } from "./support/build";

// The templates are new, derived frames: their CSS holds to CLAUDE.md #3 and #5 literally. Every value
// resolves to a token, and every class carries the component's own prefix.

const TEMPLATES_DIR = join(PACKAGE_DIR, "src", "templates");

/** The kebab-case class prefix of a template folder: `ShellFrame` → `shell-frame`. */
const prefixOf = (name: string): string => name.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase();

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations only: `@media (max-width: …)` conditions are not values. */
const valuesOf = (css: string): string =>
  stripComments(css)
    .replace(/@media[^{]*\{/g, "{")
    .replace(/[^{};]*\{/g, "");

const classesOf = (css: string): readonly string[] =>
  [
    ...stripComments(css)
      .replace(/\{[^}]*\}/g, "{}")
      .matchAll(/\.([A-Za-z_][\w-]*)/g),
  ].map((m) => m[1] as string);

const templates = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

describe("template CSS", () => {
  test("the folder lists the five batch-6 templates", () => {
    for (const name of [
      "ShellFrame",
      "AppHeaderFrame",
      "BoardGrid",
      "RunPageFrame",
      "BacklogFrame",
    ]) {
      expect(templates).toContain(name);
    }
  });

  test.each(templates)("%s: no hex, rgb(), hsl() or raw length in a declaration", (name) => {
    const values = valuesOf(readFileSync(join(TEMPLATES_DIR, name, `${name}.css`), "utf8"));
    expect(values.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(values.match(/\b(?:rgba?|hsla?)\(/g) ?? []).toEqual([]);
    const lengths = [...values.matchAll(/(?<![\w.-])(\d*\.?\d+)(px|rem)\b/g)].filter(
      (m) => !(m[1] === "1" && m[2] === "px") && Number(m[1]) !== 0,
    );
    expect(lengths.map((m) => m[0])).toEqual([]);
  });

  test.each(templates)("%s: every class carries the component's prefix", (name) => {
    const prefix = prefixOf(name);
    const css = readFileSync(join(TEMPLATES_DIR, name, `${name}.css`), "utf8");
    const stray = classesOf(css).filter((c) => c !== prefix && !c.startsWith(`${prefix}-`));
    // `.on` is the active-tab modifier, only ever written beside the prefixed tab class.
    const allowed = stray.filter((c) => !(name === "AppHeaderFrame" && c === "on"));
    expect(allowed).toEqual([]);
  });

  test.each(templates)("%s: its stylesheet is the only CSS import of its component", (name) => {
    const source = readFileSync(join(TEMPLATES_DIR, name, `${name}.tsx`), "utf8");
    expect(source.match(/import\s+["'][^"']+\.css["']/g)).toEqual([`import "./${name}.css"`]);
  });
});
