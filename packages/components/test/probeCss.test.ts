import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR } from "./support/build";

const PROBES = [
  { layer: "atoms", name: "Kpi", prefix: "kpi" },
  { layer: "molecules", name: "ArmButton", prefix: "arm" },
  { layer: "molecules", name: "PhaseStrip", prefix: "tc" },
] as const;

const read = (path: string): string => readFileSync(path, "utf8");
const css = ({ layer, name }: (typeof PROBES)[number]): string =>
  read(join(PACKAGE_DIR, "src", layer, name, `${name}.css`)).replace(/\/\*[\s\S]*?\*\//g, "");

const tokensDir = join(PACKAGE_DIR, "../tokens/src");
const tokenNames = new Set(
  readdirSync(tokensDir)
    .filter((f) => f.endsWith(".css"))
    .flatMap((f) => [...read(join(tokensDir, f)).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1])),
);

describe("probe stylesheets", () => {
  for (const probe of PROBES) {
    const text = css(probe);

    test(`${probe.name}: no hex, rgb() or hsl()`, () => {
      expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(text).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
    });

    test(`${probe.name}: no px length other than 1px, and no rem/pt/vh/vw`, () => {
      const lengths = [...text.matchAll(/(?<![\w-])-?\d*\.?\d+(px|rem|pt|vh|vw)\b/g)];
      for (const m of lengths) expect(m[0].replace(/^-/, ""), `${probe.name}: ${m[0]}`).toBe("1px");
    });

    test(`${probe.name}: every class selector starts with the component prefix`, () => {
      const selectors =
        text
          .replace(/\{[^{}]*\}/g, "{}")
          .match(/[^{}]+(?=\{)/g)
          ?.filter((s) => !s.trim().startsWith("@") && /\./.test(s))
          .flatMap((s) => s.split(",").map((part) => part.trim())) ?? [];
      expect(selectors.length).toBeGreaterThan(0);
      for (const selector of selectors) {
        const first = /\.([A-Za-z][\w-]*)/.exec(selector)?.[1] ?? "";
        expect(first.startsWith(probe.prefix), `${probe.name}: "${selector}"`).toBe(true);
        for (const m of selector.matchAll(/\.(ph-[\w-]+)/g)) {
          expect(selector, `${probe.name}: .${m[1]}`).toMatch(/^\.tc-ph\.ph-/);
        }
      }
    });

    test(`${probe.name}: every var(--x) without fallback is a token or --adw-…`, () => {
      for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/g)) {
        if (m[2] === ",") continue;
        const ok = (m[1] as string).startsWith("--adw-") || tokenNames.has(m[1] as string);
        expect(ok, `${probe.name}: ${m[1]}`).toBe(true);
      }
    });
  }
});
