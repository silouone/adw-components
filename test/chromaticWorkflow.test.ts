import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PATH = join(import.meta.dir, "..", ".github", "workflows", "chromatic.yml");

type Step = {
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Readonly<Record<string, unknown>>;
};
type Workflow = {
  readonly on: Readonly<Record<string, unknown>> & {
    readonly push?: { readonly branches?: readonly string[]; readonly paths?: readonly string[] };
  };
  readonly jobs: Readonly<Record<string, { readonly steps: readonly Step[] }>>;
};

const raw = (): string => readFileSync(PATH, "utf8");
const workflow = (): Workflow => Bun.YAML.parse(raw()) as Workflow;
const steps = (): readonly Step[] => Object.values(workflow().jobs).flatMap((j) => j.steps);
const action = (name: string): Step | undefined => steps().find((s) => s.uses?.startsWith(name));

describe("chromatic.yml", () => {
  test("runs on push to main for the library's paths, and on dispatch", () => {
    const on = workflow().on;
    expect(on.push?.branches).toEqual(["main"]);
    for (const path of ["packages/**", ".storybook/**", "package.json", "bun.lock"]) {
      expect(on.push?.paths).toContain(path);
    }
    expect(on.workflow_dispatch).toBeDefined();
  });

  test("never runs on a pull request", () => {
    expect(Object.keys(workflow().on).filter((k) => k.startsWith("pull_request"))).toEqual([]);
    expect(raw()).not.toMatch(/pull_request/);
  });

  test("sets up node from .nvmrc and bun, and installs from the lockfile", () => {
    expect(action("actions/setup-node@")?.with?.["node-version-file"]).toBe(".nvmrc");
    expect(action("oven-sh/setup-bun@")).toBeDefined();
    expect(steps().some((s) => s.run === "bun install --frozen-lockfile")).toBe(true);
  });

  test("checks out the full history for TurboSnap", () => {
    expect(action("actions/checkout@")?.with?.["fetch-depth"]).toBe(0);
  });

  test("the chromatic action uses the secret and never fails on changes", () => {
    const w = action("chromaui/action@")?.with;
    expect(w?.projectToken).toBe(`\${{ secrets.CHROMATIC_PROJECT_TOKEN }}`);
    expect(w?.onlyChanged).toBe(true);
    expect(w?.exitZeroOnChanges).toBe(true);
    expect(w?.autoAcceptChanges).toBe(true);
  });

  test("every action is pinned by a full commit sha", () => {
    const uses = steps().flatMap((s) => (s.uses === undefined ? [] : [s.uses]));
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((u) => !/@[0-9a-f]{40}$/.test(u))).toEqual([]);
  });

  test("echoes both links to the step summary", () => {
    expect(raw()).toContain("STORYBOOK_URL=");
    expect(raw()).toContain("BUILD_URL=");
    expect(raw()).toContain("GITHUB_STEP_SUMMARY");
  });

  test("the only secret it reads is CHROMATIC_PROJECT_TOKEN", () => {
    const secrets = [...raw().matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]);
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets.filter((s) => s !== "CHROMATIC_PROJECT_TOKEN")).toEqual([]);
  });
});
