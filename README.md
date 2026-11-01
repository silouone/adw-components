# adw-components

The design tokens and the stateless Preact components of the adw-factory web console,
atoms to pages, documented in one Storybook. The factory keeps the containers, the signals and
the I/O; this library only renders from props.

| Package | What it holds |
|---|---|
| `@adw-factory/tokens` | CSS custom properties (dark, then light), type and motion scales |
| `@adw-factory/components` | atoms, molecules, organisms, templates, pages |

## Working here

```bash
bun install
bun run lint && bunx tsc --noEmit && bun test && bun run build
bun run format          # write the Biome formatting
```

Bun 1.4.2 for everything; Node 22 only for Storybook. Builder rules: [`CLAUDE.md`](CLAUDE.md).

## Storybook

The library is documented in layer order (Foundations, Atoms, Molecules, Organisms, Templates,
Pages), with a dark / light / system toolbar, at `https://main--<appId>.chromatic.com`. The app id
is the one of the Chromatic project (Chromatic, Manage, Configure); it is not kept in this repo.

```bash
bun run storybook                    # dev server on :6006
bun run build-storybook              # static build into storybook-static/ (not committed)
bun run storybook:publish [branch]   # host a pushed branch on Chromatic, print the two links
```

Storybook runs under Node 22 (`.nvmrc`); everything else is bun. Chromatic hosts; it never gates:
`chromatic.yml` runs on push to `main` and on dispatch, never on a pull request.
