import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const text = (): string => readFileSync(join(import.meta.dir, "..", "CLAUDE.md"), "utf8");

const RULES: readonly string[] = [
  "TDD",
  "Stateless",
  "Tokens only",
  "English",
  "One component, one folder",
  "Conventional commits and PR titles",
  "No byproduct beside sources",
];

// What a library component may never touch (spec D2.1).
const BANNED: readonly string[] = [
  "signal",
  "fetch",
  "EventSource",
  "location",
  "history",
  "localStorage",
  "navigator.clipboard",
  "document",
  "window",
  "Date.now",
  "getComputedStyle",
  "adw-factory",
];

describe("CLAUDE.md writes the builder rules", () => {
  test("names the seven non-negotiables as numbered headings", () => {
    const headings = [...text().matchAll(/^\d\. \*\*(.+?)\.\*\*/gm)].map((m) => m[1]);
    expect(headings).toEqual([...RULES]);
  });

  test("lists every banned identifier in code font", () => {
    const missing = BANNED.filter((id) => !text().includes(`\`${id}\``));
    expect(missing).toEqual([]);
  });

  test("states the verify line", () => {
    expect(text()).toContain("`bun run lint && bunx tsc --noEmit && bun test && bun run build`");
  });
});
