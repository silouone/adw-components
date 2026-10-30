import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

// The target's gates, minus `bun test` itself: this file runs inside it.
const GATES: readonly (readonly string[])[] = [
  ["bun", "run", "lint"],
  ["bun", "run", "format:check"],
  ["bunx", "tsc", "--noEmit"],
  ["bun", "run", "build"],
];

describe("the skeleton passes the target's gates", () => {
  for (const cmd of GATES) {
    test(`${cmd.join(" ")} exits 0`, () => {
      const res = Bun.spawnSync([...cmd], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
      const out = `${res.stdout.toString()}${res.stderr.toString()}`;
      expect({ exitCode: res.exitCode, out }).toEqual({ exitCode: 0, out: expect.any(String) });
    }, 60_000);
  }
});
