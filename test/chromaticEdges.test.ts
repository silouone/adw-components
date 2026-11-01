import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PATH = join(import.meta.dir, "..", ".github", "workflows", "chromatic.yml");

type Step = {
  readonly id?: string;
  readonly name?: string;
  readonly if?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly env?: Readonly<Record<string, unknown>>;
  readonly with?: Readonly<Record<string, unknown>>;
};
type Job = { readonly "runs-on"?: string; readonly steps: readonly Step[]; readonly if?: string };
type Workflow = {
  readonly on: Readonly<Record<string, unknown>>;
  readonly jobs: Readonly<Record<string, Job>>;
  readonly permissions?: Readonly<Record<string, string>>;
  readonly env?: Readonly<Record<string, unknown>>;
};

const raw = readFileSync(PATH, "utf8");
const workflow = Bun.YAML.parse(raw) as Workflow;
const jobs = Object.values(workflow.jobs);
const steps = jobs.flatMap((j) => j.steps);

describe("chromatic.yml triggers", () => {
  test("the only triggers are push and workflow_dispatch", () => {
    expect(Object.keys(workflow.on).sort()).toEqual(["push", "workflow_dispatch"]);
  });

  test("push is filtered to main only: no tags, no other branches, no ignore list", () => {
    const push = workflow.on.push as Record<string, unknown>;
    expect(Object.keys(push).sort()).toEqual(["branches", "paths"]);
    expect(push.branches).toEqual(["main"]);
  });

  test("the path filter is exactly the four inputs of a Storybook build", () => {
    const push = workflow.on.push as { paths: readonly string[] };
    expect([...push.paths].sort()).toEqual([
      ".storybook/**",
      "bun.lock",
      "package.json",
      "packages/**",
    ]);
  });

  test("no event that a pull request could fire: pull_request(_target), workflow_run, merge_group", () => {
    expect(raw).not.toMatch(/pull_request|workflow_run|merge_group|issue_comment/);
  });

  test("the workflow file does not trigger itself or gate on ci.yml", () => {
    const push = workflow.on.push as { paths: readonly string[] };
    expect(push.paths.some((p) => p.includes("workflows"))).toBe(false);
    expect(raw).not.toMatch(/needs:/);
  });
});

describe("chromatic.yml job", () => {
  test("a single job", () => {
    expect(jobs).toHaveLength(1);
  });

  test("no permissions are widened beyond read access", () => {
    const granted = Object.values(workflow.permissions ?? {});
    expect(granted.filter((p) => p !== "read")).toEqual([]);
    expect(raw).not.toMatch(/contents:\s*write|pull-requests:\s*write|id-token:\s*write/);
  });

  test("the token is referenced once, as the action's projectToken, never in a run step or env", () => {
    expect([...raw.matchAll(/CHROMATIC_PROJECT_TOKEN/g)]).toHaveLength(1);
    for (const step of steps) {
      expect(step.run ?? "").not.toContain("secrets.");
      expect(JSON.stringify(step.env ?? {})).not.toContain("secrets.");
    }
    expect(JSON.stringify(workflow.env ?? {})).not.toContain("secrets.");
  });

  test("no step is conditional on a branch or an event, so a dispatch runs everything", () => {
    expect(steps.filter((s) => s.if !== undefined)).toEqual([]);
    expect(jobs.filter((j) => j.if !== undefined)).toEqual([]);
  });

  test("steps run in order: checkout, node, bun, install, chromatic, links", () => {
    const kinds = steps.map(
      (s) => s.uses?.split("@")[0] ?? (s.run?.startsWith("bun install") ? "install" : "run"),
    );
    expect(kinds).toEqual([
      "actions/checkout",
      "actions/setup-node",
      "oven-sh/setup-bun",
      "install",
      "chromaui/action",
      "run",
    ]);
  });

  test("the bun version matches ci.yml's", () => {
    const ci = readFileSync(join(import.meta.dir, "..", ".github", "workflows", "ci.yml"), "utf8");
    const version = (text: string) => /bun-version:\s*([0-9.]+)/.exec(text)?.[1];
    expect(version(raw)).toBeDefined();
    expect(version(raw)).toBe(version(ci));
  });
});

describe("chromatic.yml links", () => {
  const chromatic = steps.find((s) => s.uses?.startsWith("chromaui/action@"));
  const links = steps.at(-1);

  test("the chromatic step has the id the links step reads", () => {
    expect(chromatic?.id).toBe("chromatic");
    const referenced = [...(links?.run ?? "").matchAll(/steps\.([a-z-]+)\.outputs\.(\w+)/g)];
    expect(referenced.length).toBeGreaterThan(0);
    expect(referenced.filter((m) => m[1] !== chromatic?.id)).toEqual([]);
  });

  test("it reads storybookUrl and buildUrl, the outputs the action defines", () => {
    const outputs = new Set([...(links?.run ?? "").matchAll(/outputs\.(\w+)/g)].map((m) => m[1]));
    expect([...outputs].sort()).toEqual(["buildUrl", "storybookUrl"]);
  });

  test("each link is printed to stdout (the publish script greps logs) and to the summary", () => {
    const lines = (links?.run ?? "").split("\n");
    for (const key of ["STORYBOOK_URL", "BUILD_URL"]) {
      expect(lines.filter((l) => l.includes(`echo "${key}=`))).toHaveLength(2);
    }
    expect(links?.run).toContain('>> "$GITHUB_STEP_SUMMARY"');
  });

  test("the summary redirect is quoted, so a path with a space cannot split it", () => {
    expect(links?.run).not.toMatch(/>>\s*\$GITHUB_STEP_SUMMARY/);
  });

  test("the lines the publish script greps for match the lines this step prints", () => {
    const script = readFileSync(
      join(import.meta.dir, "..", "scripts", "publish-storybook.sh"),
      "utf8",
    );
    for (const key of ["STORYBOOK_URL", "BUILD_URL"]) {
      expect(script).toContain(key);
      expect(links?.run).toContain(`${key}=`);
    }
  });
});

describe("chromatic action inputs", () => {
  const w = steps.find((s) => s.uses?.startsWith("chromaui/action@"))?.with ?? {};

  test("no input turns Chromatic into a gate or a checker", () => {
    expect(Object.keys(w).sort()).toEqual([
      "autoAcceptChanges",
      "exitZeroOnChanges",
      "onlyChanged",
      "projectToken",
    ]);
  });

  test("the three flags are the boolean true, not the string 'true' or a branch filter", () => {
    for (const flag of ["onlyChanged", "exitZeroOnChanges", "autoAcceptChanges"]) {
      expect(w[flag]).toBe(true);
    }
  });

  test("the pin carries its version as a comment", () => {
    expect(raw).toMatch(/chromaui\/action@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
  });
});
