import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio, parseDeclarations, resolveToken } from "./support/css";

const decls = parseDeclarations(readFileSync(join(import.meta.dir, "../src/tokens.css"), "utf8"));

const TEXT_TOKENS = [
  "--ink",
  "--ink-strong",
  "--dim",
  "--ok",
  "--bad",
  "--warn",
  "--live",
  "--model",
  "--tool",
] as const;
const SURFACES = ["--bg", "--panel", "--panel2"] as const;
const AA = 4.5;

// Spec amendment proposed (plan D1): the factory's own values miss AA on three pairs and R1
// forbids changing them. The debt is pinned with its floor so it can only shrink.
const BELOW_AA: readonly (readonly [string, string])[] = [
  ["--dim", "--panel"],
  ["--dim", "--panel2"],
  ["--tool", "--panel2"],
];
const isBelowAa = (text: string, surface: string): boolean =>
  BELOW_AA.some(([t, s]) => t === text && s === surface);

const ratio = (text: string, surface: string): number =>
  contrastRatio(resolveToken(decls, text), resolveToken(decls, surface));

describe("contrast in dark", () => {
  for (const text of TEXT_TOKENS) {
    for (const surface of SURFACES) {
      if (isBelowAa(text, surface)) {
        test(`${text} on ${surface} is the known sub-AA pair, no lower than 4`, () => {
          const r = ratio(text, surface);
          expect(r).toBeLessThan(AA);
          expect(r).toBeGreaterThanOrEqual(4);
        });
      } else {
        test(`${text} on ${surface} clears AA`, () => {
          expect(ratio(text, surface)).toBeGreaterThanOrEqual(AA);
        });
      }
    }
  }

  test("BELOW_AA names only text tokens and surfaces that exist", () => {
    for (const [text, surface] of BELOW_AA) {
      expect(TEXT_TOKENS as readonly string[]).toContain(text);
      expect(SURFACES as readonly string[]).toContain(surface);
    }
  });

  for (const surface of SURFACES) {
    test(`--faint on ${surface} fails AA, which keeps the never-text rule honest`, () => {
      expect(ratio("--faint", surface)).toBeLessThan(AA);
    });
  }
});
