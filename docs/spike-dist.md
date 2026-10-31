Verdict: bun build works for the dist; no fallback needed.

Caveat: the `examples/consumer` test (`packages/components/test/consumer.test.ts`) needs the
workspace links that `bun install` creates. It could not run in the workspace this was written in
(install was refused there); the consumer path below was measured in a scratch directory, and the
test is the check of record once the links exist.

# Spike: a per-component dist with `bun build`

Spec: `specs/adw-components/design-system-split.md` §0 P3, §D7.1, Part B §B4. The consumer is the
factory's `server.ts`, which runs `Bun.build({ entrypoints: [entry.tsx], target: "browser",
minify: true })` once at launch and inlines CSS it reads from the package. Three probes cover one
concern each: `Kpi` (props only), `ArmButton` (interface state, a lapsing timer), `PhaseStrip` (hue
maths through tokens).

## What worked

- One `Bun.build` per `exports` entry: `outdir: dist`, `root: src`, `naming: "[dir]/[name].[ext]"`,
  `splitting: false`, `target: "browser"`, `format: "esm"` gives `dist/atoms/Kpi/Kpi.js`, the layer
  path kept.
- `preact`, `preact/hooks` and `preact/jsx-runtime` are external, so the consumer brings one Preact.
- **The `jsx.development: false` trap.** Without
  `jsx: { runtime: "automatic", importSource: "preact", development: false }`, `Bun.build` emits
  `jsxDEV` from `preact/jsx-dev-runtime`, which is not in the external list. Both the package build
  and the consumer build set it.
- A Bun consumer resolves `@adw-factory/components/Kpi` through the `import` condition of
  `exports`. Preact is bundled in, and the output has no `import.meta` and no `node:` specifier.
- `build.ts` derives its entries from `exports` (`tools/entries.ts`, pure) and fails fast naming the
  export that has no source.
- The dist layout is `dist/<layer>/<Name>/<Name>.{js,d.ts,css}` (the ticket and P6). Spec B4.1 says
  `dist/<Name>/<Name>.js`; the ticket wins and no amendment is needed, because the import path
  (`@adw-factory/components/<Name>`) stays layer-free.

## `.d.ts` layout

`tsc --emitDeclarationOnly -p tsconfig.build.json` (`rootDir: src`, `outDir: dist`,
`incremental: false`, so no tsbuildinfo) emits `dist/<layer>/<Name>/<Name>.d.ts` beside the `.js`.
Tests, stories and the `.tsx` sources are not shipped. `tsc` keeps `import "./Kpi.css";` at the top of
each `.d.ts`; `build.ts` strips that line.

## How CSS ships

- Each `<Name>.css` is copied beside its `.js` (`dist/atoms/Kpi/Kpi.css`).
- `dist/components.css` concatenates every stylesheet in layer order (atoms, molecules, organisms,
  templates, pages), then by name inside a layer.
- It is exported as `@adw-factory/components/components.css`. The consumer reads it and inlines it
  itself, as `server.ts` does. It is not tree-shaken: the consumer gets every component's CSS.
- `sideEffects: ["**/*.css"]` keeps a bundler from dropping a CSS import.

## The stripped import

Each source starts with `import "./Kpi.css";` so Storybook can load the styles. The dist strips that
line from the `.js` (a `Bun.build` plugin that loads every `.css` as empty) and from the `.d.ts`
(a regex per file). This is the one deliberate difference from sabado: the consumer inlines CSS
itself, so a JS import of a stylesheet would make `Bun.build` emit a CSS asset the consumer does not
want.

## Limit

`splitting: false` inlines a sibling component into each entry that imports it. A context such as
`KpiToneContext`, imported relatively by another component, would then exist twice, and a provider
in one copy would not reach a consumer in the other. The three probes import no sibling, so this
does not bite yet. For the copy batches: mark sibling imports external and rewrite them to the
package subpath (`@adw-factory/components/Kpi`).

## Fallback

If the built dist ever fails a consumer, publish source instead: `files: ["src"]`, the same
`exports` map pointing at `./src/<layer>/<Name>/<Name>.tsx`, and let the consumer's `Bun.build`
compile the TSX and its CSS imports.
