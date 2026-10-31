import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { diffRoots, extractSnapshotRoot } from "./support/css";

const SNAPSHOT = join(import.meta.dir, "../../../.adw/adw-ref/src/web/theme.ts");
const TOKENS = join(import.meta.dir, "../src/tokens.css");

// --zoom is the page's scale (spec D3.4): it stays in the factory's themeCss().
const FACTORY_ONLY = ["--zoom"] as const;

const mine = (): string => readFileSync(TOKENS, "utf8");
const snapshotRoot = (): string => extractSnapshotRoot(readFileSync(SNAPSHOT, "utf8"));

// The snapshot lives under the gitignored .adw/, so it is absent in CI (plan D2).
const withSnapshot = test.skipIf(!existsSync(SNAPSHOT));

describe("parity with the factory snapshot", () => {
  withSnapshot("every snapshot custom property is declared with the same value", () => {
    const { changed, missing } = diffRoots(snapshotRoot(), mine(), FACTORY_ONLY);
    expect({ changed, missing }).toEqual({ changed: [], missing: [] });
  });

  withSnapshot("tokens.css declares nothing the snapshot does not", () => {
    expect(diffRoots(snapshotRoot(), mine(), FACTORY_ONLY).extra).toEqual([]);
  });

  test("--zoom is not declared here", () => {
    expect(mine()).not.toMatch(/--zoom\s*:/);
  });
});
