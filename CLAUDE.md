# adw-components — builder ground rules

Binding decisions: the design-system split spec (`specs/adw-components/design-system-split.md`,
staged by the factory when a ticket cites it). This file is the short version.

## Non-negotiables

1. **TDD.** No implementation before a red test. Each requirement names its test.
2. **Stateless.** A component renders from its props and reports through callbacks. It may hold
   interface state nobody else reads (hover, open/closed, an arm timer, a "copied" flash). It
   never reads or writes a `signal`, never calls `fetch`, opens an `EventSource`, touches
   `location`, `history`, `localStorage`, `navigator.clipboard`, `document` or `window`, calls
   `Date.now`, reads `getComputedStyle`, nor imports from `adw-factory`. What it needs from the
   world arrives as a prop (`now`, `zoom`, `tz`, `onCopy`, `onNavigate`, `hrefFor`). Typed
   view-models are the contract; no derivation function lives here.
3. **Tokens only.** No hex, `rgb()`, `hsl()` or raw length (other than `0`, `1px` hairlines and
   `100%`) in component CSS: every value resolves to a `@adw-factory/tokens` custom property or a
   `--adw-<component>-<thing>` property declared with a token fallback.
4. **English.** Code, docs, story titles (`Atoms/…`, `Molecules/…`, `Organisms/…`, `Templates/…`,
   `Pages/…`) and descriptions. Every human-readable string is a prop; a component may default a
   glyph, never a word.
5. **One component, one folder.** `<Name>.tsx`, `<Name>.css`, `<Name>.stories.tsx`,
   `<Name>.test.tsx` under its layer folder (`src/atoms/`, `src/molecules/`, `src/organisms/`,
   `src/templates/`, `src/pages/`). Its CSS is the only definition of its classes, every class
   carries the component's prefix, and no folder imports another folder's CSS.
6. **Conventional commits and PR titles.** `feat(components): …`, `fix(tokens): …`: the release
   derives the version from the squash-merge title.
7. **No byproduct beside sources.** `tsBuildInfoFile` lives under `node_modules/.tmp/`; delete
   `storybook-static/` after a manual Storybook build; `dist/` is never committed.

## Verify before done

`bun run lint && bunx tsc --noEmit && bun test && bun run build` — all green.
