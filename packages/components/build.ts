// Builds the per-component dist: one `Bun.build` per `exports` entry, the CSS copied
// beside each `.js` and concatenated into `components.css`, then `tsc` for the `.d.ts`.
// Runs from any cwd: every path hangs off this file's directory.

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { concatCss, type Entry, entriesOf, orderEntries, stripCssImports } from "./tools/entries";

const PACKAGE_DIR = import.meta.dir;
const DIST = join(PACKAGE_DIR, "dist");
const at = (path: string): string => join(PACKAGE_DIR, path);

// The consumer inlines the CSS itself, so the `import "./X.css"` of a source is dropped from the JS.
const stripCss: Bun.BunPlugin = {
  name: "strip-css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  },
};

const bundle = async (entry: Entry): Promise<void> => {
  const result = await Bun.build({
    entrypoints: [at(entry.src)],
    outdir: DIST,
    root: at("src"),
    naming: "[dir]/[name].[ext]",
    target: "browser",
    format: "esm",
    splitting: false,
    external: ["preact", "preact/hooks", "preact/jsx-runtime"],
    jsx: { runtime: "automatic", importSource: "preact", development: false },
    plugins: [stripCss],
  });
  if (!result.success) {
    throw new Error(
      `Bun.build failed for export "${entry.subpath}" (${entry.src}):\n${result.logs.map(String).join("\n")}`,
    );
  }
};

const emitDeclarations = (entries: readonly Entry[]): void => {
  const tsc = Bun.spawnSync(
    [process.execPath, "x", "tsc", "--emitDeclarationOnly", "-p", "tsconfig.build.json"],
    {
      cwd: PACKAGE_DIR,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  if (tsc.exitCode !== 0) {
    throw new Error(
      `tsc -p tsconfig.build.json exited ${tsc.exitCode}:\n${tsc.stdout}${tsc.stderr}`,
    );
  }
  for (const { subpath, dts } of entries) {
    if (!existsSync(at(dts)))
      throw new Error(`tsc emitted no declaration for export "${subpath}" at ${dts}`);
    writeFileSync(at(dts), stripCssImports(readFileSync(at(dts), "utf8")));
  }
};

const manifest = JSON.parse(readFileSync(at("package.json"), "utf8")) as {
  readonly exports: Readonly<Record<string, unknown>>;
};
const entries = orderEntries(entriesOf(manifest.exports, (path) => existsSync(at(path))));

rmSync(DIST, { recursive: true, force: true });
for (const entry of entries) await bundle(entry);

for (const entry of entries) {
  const sourceCss = at(entry.src.replace(/\.tsx$/, ".css"));
  mkdirSync(dirname(at(entry.css)), { recursive: true });
  copyFileSync(sourceCss, at(entry.css));
}
writeFileSync(
  join(DIST, "components.css"),
  concatCss(entries.map((entry) => readFileSync(at(entry.css), "utf8"))),
);

emitDeclarations(entries);
