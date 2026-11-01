import { join } from "node:path";
import { entriesOf } from "../packages/components/tools/entries";

export interface Alias {
  readonly find: RegExp;
  readonly replacement: string;
}

/**
 * Resolves the workspace packages to their sources, so no build precedes a story:
 * every `@adw-factory/tokens/*` to `packages/tokens/src/*`, and each component
 * export to the source file its `import` target is built from.
 */

export const aliasesOf = (
  root: string,
  componentExports: Readonly<Record<string, unknown>>,
): readonly Alias[] => {
  const components = join(root, "packages", "components");
  const sources = entriesOf(componentExports, () => true).map(
    ({ name, src }): Alias => ({
      find: new RegExp(`^@adw-factory/components/${name}$`),
      replacement: join(components, src),
    }),
  );
  return [
    ...sources,
    {
      find: /^@adw-factory\/tokens\/(.*)$/,
      replacement: `${join(root, "packages", "tokens", "src")}/$1`,
    },
  ];
};
