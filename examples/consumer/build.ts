// What the factory's `server.ts` does at launch: bundle one browser entry with `Bun.build`
// and read the package's `components.css` to inline it. Prints `{ js, css }` as JSON on
// stdout (nothing else) and writes no file.

import { join } from "node:path";

const result = await Bun.build({
  entrypoints: [join(import.meta.dir, "entry.tsx")],
  target: "browser",
  minify: true,
  jsx: { runtime: "automatic", importSource: "preact", development: false },
});
if (!result.success) {
  throw new Error(`consumer Bun.build failed:\n${result.logs.map(String).join("\n")}`);
}

const [output] = result.outputs;
if (output === undefined) throw new Error("consumer Bun.build produced no output");

const js = await output.text();
const css = await Bun.file(
  Bun.resolveSync("@adw-factory/components/components.css", import.meta.dir),
).text();

console.log(JSON.stringify({ js, css }));
