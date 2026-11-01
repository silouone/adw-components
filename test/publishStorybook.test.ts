import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "publish-storybook.sh");

// `git`, `gh` and `sleep` are stubs on PATH: the script is run for real, nothing leaves the machine.
const STUBS: Readonly<Record<string, string>> = {
  git: `#!/usr/bin/env bash
case "$1" in
  branch) echo "\${STUB_BRANCH:-}" ;;
  ls-remote) exit "\${STUB_LSREMOTE:-0}" ;;
esac
`,
  gh: `#!/usr/bin/env bash
echo "gh $*" >> "$STUB_LOG"
case "$1 $2" in
  "run list")
    n=$(cat "$STUB_DIR/n" 2>/dev/null || echo 0)
    echo $((n + 1)) > "$STUB_DIR/n"
    if [ "$n" -eq 0 ]; then echo "\${STUB_BEFORE:-0}"; else echo "\${STUB_AFTER:-0}"; fi ;;
  "run watch") exit "\${STUB_WATCH:-0}" ;;
  "run view") cat "$STUB_RUNLOG" ;;
esac
`,
  sleep: "#!/usr/bin/env bash\nexit 0\n",
};

const RUN_LOG = [
  "chromatic\tLinks\t2026-11-01T10:00:00Z STORYBOOK_URL=https://main--app.chromatic.com/",
  "chromatic\tLinks\t2026-11-01T10:00:00Z BUILD_URL=https://www.chromatic.com/build?appId=app&number=7",
  "chromatic\tLinks\t2026-11-01T10:00:01Z STORYBOOK_URL=https://main--app.chromatic.com/",
  "chromatic\tLinks\t2026-11-01T10:00:01Z BUILD_URL=https://www.chromatic.com/build?appId=app&number=7",
  "chromatic\tPublish\t2026-11-01T10:00:02Z unrelated line",
].join("\n");

let dir = "";
let seq = 0;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "publish-storybook-"));
  for (const [name, body] of Object.entries(STUBS)) {
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  }
  writeFileSync(join(dir, "run.log"), RUN_LOG);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

interface Outcome {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly calls: readonly string[];
}

const publish = (args: readonly string[], env: Readonly<Record<string, string>>): Outcome => {
  seq += 1;
  const state = mkdtempSync(join(dir, `case${seq}-`));
  const log = join(state, "calls.log");
  writeFileSync(log, "");
  const done = Bun.spawnSync(["bash", SCRIPT, ...args], {
    env: {
      PATH: `${dir}:/usr/bin:/bin`,
      STUB_DIR: state,
      STUB_LOG: log,
      STUB_RUNLOG: join(dir, "run.log"),
      ...env,
    },
  });
  return {
    code: done.exitCode,
    stdout: done.stdout.toString(),
    stderr: done.stderr.toString(),
    calls: readFileSync(log, "utf8").split("\n").filter(Boolean),
  };
};

describe("publish-storybook.sh refusals", () => {
  test("a branch that is not on origin exits 1, names the branch, dispatches nothing", () => {
    const out = publish(["feature/x"], { STUB_LSREMOTE: "2" });
    expect(out.code).toBe(1);
    expect(out.stderr).toContain("'feature/x' is not on origin");
    expect(out.calls).toEqual([]);
  });

  test("a detached HEAD with no argument exits 1 and dispatches nothing", () => {
    const out = publish([], { STUB_BRANCH: "" });
    expect(out.code).toBe(1);
    expect(out.stderr).toContain("detached");
    expect(out.calls).toEqual([]);
  });

  test("an empty argument falls back to the current branch, not to an empty ref", () => {
    const out = publish([""], { STUB_BRANCH: "" });
    expect(out.code).toBe(1);
    expect(out.calls).toEqual([]);
  });
});

describe("publish-storybook.sh publishes", () => {
  const ok = { STUB_BEFORE: "10", STUB_AFTER: "11" };

  test("dispatches once on the given branch, watches the new run, prints both links once", () => {
    const out = publish(["feature/x"], ok);
    expect(out.code).toBe(0);
    expect(out.calls.filter((c) => c.startsWith("gh workflow run"))).toEqual([
      "gh workflow run chromatic.yml --ref feature/x",
    ]);
    expect(out.calls).toContain("gh run watch 11 --exit-status");
    expect(out.calls.some((c) => c.startsWith("gh run view 11 --log"))).toBe(true);
    expect(out.stdout.trim().split("\n").sort()).toEqual([
      "BUILD_URL=https://www.chromatic.com/build?appId=app&number=7",
      "STORYBOOK_URL=https://main--app.chromatic.com/",
    ]);
  });

  test("without an argument it publishes the current branch", () => {
    const out = publish([], { ...ok, STUB_BRANCH: "adw/some-branch" });
    expect(out.code).toBe(0);
    expect(out.calls).toContain("gh workflow run chromatic.yml --ref adw/some-branch");
  });

  test("a first-ever dispatch (no earlier run, id 0) is picked up", () => {
    const out = publish(["b"], { STUB_BEFORE: "0", STUB_AFTER: "5" });
    expect(out.code).toBe(0);
    expect(out.calls).toContain("gh run watch 5 --exit-status");
  });

  test("it only looks at dispatch runs of the workflow on that branch", () => {
    const lists = publish(["feature/x"], ok).calls.filter((c) => c.startsWith("gh run list"));
    expect(lists.length).toBeGreaterThanOrEqual(2);
    for (const list of lists) {
      expect(list).toContain("--workflow chromatic.yml");
      expect(list).toContain("--branch feature/x");
      expect(list).toContain("--event workflow_dispatch");
    }
  });
});

describe("publish-storybook.sh failures", () => {
  test("no newer run appears: exits 1 and never watches", () => {
    const out = publish(["b"], { STUB_BEFORE: "10", STUB_AFTER: "10" });
    expect(out.code).toBe(1);
    expect(out.stderr).toContain("no new chromatic.yml run appeared for 'b'");
    expect(out.calls.some((c) => c.startsWith("gh run watch"))).toBe(false);
  });

  test("the wait is bounded: 31 listings at most (the one before, then 30 tries)", () => {
    const out = publish(["b"], { STUB_BEFORE: "10", STUB_AFTER: "10" });
    expect(out.calls.filter((c) => c.startsWith("gh run list"))).toHaveLength(31);
  });

  test("a failed run exits non-zero and prints no link", () => {
    const out = publish(["b"], { STUB_BEFORE: "1", STUB_AFTER: "2", STUB_WATCH: "1" });
    expect(out.code).not.toBe(0);
    expect(out.stdout).toBe("");
    expect(out.calls.some((c) => c.startsWith("gh run view"))).toBe(false);
  });
});
