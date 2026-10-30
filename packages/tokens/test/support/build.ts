import { join } from "node:path";

export const PACKAGE_DIR = join(import.meta.dir, "../..");

/** Runs a command in the package, failing with its full output (command named) on non-zero. */
export const run = (cmd: readonly string[]): string => {
  const result = Bun.spawnSync([...cmd], { cwd: PACKAGE_DIR, stdout: "pipe", stderr: "pipe" });
  const out = `${result.stdout.toString()}${result.stderr.toString()}`;
  if (result.exitCode !== 0) {
    throw new Error(`\`${cmd.join(" ")}\` exited ${result.exitCode} in ${PACKAGE_DIR}:\n${out}`);
  }
  return out;
};

let built = false;

/** Builds the package once per process; the build itself is idempotent (rm -rf dist first). */
export const buildOnce = (): void => {
  if (built) return;
  run(["bun", "run", "build"]);
  built = true;
};
