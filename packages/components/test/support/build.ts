import { readFileSync } from "node:fs";
import { join } from "node:path";

export const PACKAGE_DIR = join(import.meta.dir, "../..");
export const DIST = join(PACKAGE_DIR, "dist");

export interface Manifest {
  readonly files: readonly string[];
  readonly sideEffects: readonly string[];
  readonly publishConfig: { readonly access: string };
  readonly peerDependencies: Readonly<Record<string, string>>;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly exports: Readonly<
    Record<string, string | { readonly types: string; readonly import: string }>
  >;
  readonly [key: string]: unknown;
}

export const readManifest = (): Manifest =>
  JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as Manifest;

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
