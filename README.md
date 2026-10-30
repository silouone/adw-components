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
