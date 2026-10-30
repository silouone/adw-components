import { beforeAll, expect, test } from "bun:test";
import { buildOnce, run } from "./support/build";

beforeAll(buildOnce);

test("bun pm pack lists exactly package.json, README.md and the five dist css files", () => {
  const out = run(["bun", "pm", "pack", "--dry-run"]);
  const listed = [...out.matchAll(/^packed\s+\S+\s+(.+)$/gm)].map((m) => m[1] as string).sort();
  expect(listed).toEqual(
    [
      "package.json",
      "README.md",
      "dist/tokens.css",
      "dist/tokens.light.css",
      "dist/typography.css",
      "dist/reset.css",
      "dist/motion.css",
    ].sort(),
  );
  expect(out).toContain("Total files: 7");
});
