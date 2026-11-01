import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PATH = join(import.meta.dir, "..", ".github", "workflows", "ci.yml");

type Step = { readonly uses?: string; readonly run?: string };
type Job = { readonly needs?: string | readonly string[]; readonly steps: readonly Step[] };
type Workflow = {
  readonly on: {
    readonly pull_request?: unknown;
    readonly push?: { readonly branches?: readonly string[] };
  };
  readonly jobs: Readonly<Record<string, Job>>;
};

const raw = (): string => readFileSync(PATH, "utf8");
const workflow = (): Workflow => Bun.YAML.parse(raw()) as Workflow;
const runs = (job: string): string[] =>
  (workflow().jobs[job]?.steps ?? []).flatMap((s) => (s.run === undefined ? [] : [s.run]));

const INSTALL = "bun install --frozen-lockfile";

describe("ci.yml mirrors the target's gates", () => {
  test("runs on pull requests and on push to main", () => {
    const on = workflow().on;
    expect(on.pull_request).toBeDefined();
    expect(on.push?.branches).toEqual(["main"]);
  });

  test("check runs lint, format and typecheck in the gate's order", () => {
    expect(runs("check")).toEqual([
      INSTALL,
      "bun run lint",
      "bun run format:check",
      "bunx tsc --noEmit",
    ]);
  });

  test("build runs the packages build, then storybook if present, after check", () => {
    expect(runs("build")).toEqual([
      INSTALL,
      "bun run build",
      "bun run --if-present build-storybook",
    ]);
    expect(workflow().jobs.build?.needs).toBe("check");
  });

  test("test builds first (the tests read dist/ and storybook-static/), then runs bun test, after build", () => {
    expect(runs("test")).toEqual([INSTALL, "bun run build", "bun run build-storybook", "bun test"]);
    expect(workflow().jobs.test?.needs).toBe("build");
  });

  test("build and test set up node for Storybook", () => {
    for (const job of ["build", "test"]) {
      const uses = (workflow().jobs[job]?.steps ?? []).flatMap((s) =>
        s.uses === undefined ? [] : [s.uses],
      );
      expect(uses.some((u) => u.startsWith("actions/setup-node@"))).toBe(true);
    }
  });

  test("every action is pinned by a full commit sha", () => {
    const uses = Object.values(workflow().jobs).flatMap((j) =>
      j.steps.flatMap((s) => (s.uses === undefined ? [] : [s.uses])),
    );
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((u) => !/@[0-9a-f]{40}$/.test(u))).toEqual([]);
  });

  test("reads no secret", () => {
    expect(raw()).not.toMatch(/secrets\./);
  });
});
