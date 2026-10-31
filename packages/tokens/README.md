# @adw-factory/tokens

The console's palette, type, space, radius, shadow and motion, as CSS custom properties.

| Import                                 | Holds                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@adw-factory/tokens/tokens.css`       | `:root` with `color-scheme: dark`: primitives, semantic tokens, and the `--fs-*`, `--sp-*`, `--r-*`, `--z-*`, `--shadow-*` scales |
| `@adw-factory/tokens/tokens.light.css` | the light layer's two selectors (`prefers-color-scheme` and `[data-theme='light']`); load after `tokens.css`                      |
| `@adw-factory/tokens/typography.css`   | font stacks, `.t-2xs … .t-2xl`, `.t-mono`, `.t-sans`, `.t-tabular`, `.t-eyebrow`, `.t-truncate`, `.t-clamp`, `.c-dim … .c-live`   |
| `@adw-factory/tokens/reset.css`        | `box-sizing`, `body`, `:focus-visible` in `--live`, the reduced-motion floor; needs `typography.css` for `--font-mono`            |
| `@adw-factory/tokens/motion.css`       | `--dur-*` and `--ease-*`                                                                                                          |

## The tier rule

A primitive is declared once; a semantic token resolves to a primitive or a `color-mix`. Nothing
component-level lives here: a component declares `--adw-<component>-<thing>` with a token fallback.

`--zoom` is the page's, not the library's. `--faint` has no `.c-` utility: it is never text.
