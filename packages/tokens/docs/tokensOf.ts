// Pure core of the Foundations/Tokens story. It lives beside the story, not in src/
// (src/ ships as-is to dist/), and not in the story itself: `bun test` cannot import
// the story's `tokens.css?raw`.

export interface Token {
  readonly name: string;
  readonly value: string;
}

export type Kind = "swatch" | "value";
export type Tier = "primitives" | "semantic" | "phases" | "scales";

const DECLARATION = /(--[A-Za-z0-9-]+)\s*:\s*([^;}]+)(?:;|(?=\}))/g;

/** Every custom property the stylesheet declares, in source order. */

export const tokensOf = (css: string): readonly Token[] => {
  const tokens = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(DECLARATION)].map(
    (m): Token => ({ name: m[1] as string, value: (m[2] as string).trim() }),
  );
  const seen = new Set<string>();
  for (const { name } of tokens) {
    if (seen.has(name)) throw new Error(`tokensOf: ${name} declared twice`);
    seen.add(name);
  }
  if (tokens.length === 0) throw new Error("tokensOf: no token declared in the stylesheet");
  return tokens;
};

const LITERAL_COLOUR = /^(#[0-9A-Fa-f]{3,8}|hsla?\(|rgba?\(|color-mix\()/;
const WHOLE_VAR = /^var\((--[A-Za-z0-9-]+)\)$/;

/** A swatch when the value is a colour, or a `var()` chain that ends in one. */
export const kindOf = (token: Token, all: readonly Token[]): Kind => {
  const resolve = (value: string, via: readonly string[]): Kind => {
    if (LITERAL_COLOUR.test(value)) return "swatch";
    const ref = WHOLE_VAR.exec(value)?.[1];
    if (ref === undefined) return "value";
    if (via.includes(ref)) {
      throw new Error(`kindOf: ${token.name} loops through ${[...via, ref].join(" -> ")}`);
    }
    const target = all.find((t) => t.name === ref);
    if (target === undefined) {
      throw new Error(`kindOf: ${token.name} references ${ref}, which is not declared`);
    }
    return resolve(target.value, [...via, ref]);
  };
  return resolve(token.value, [token.name]);
};

/** The group a token is shown under. */
export const tierOf = ({ name, value }: Token): Tier =>
  /^--(fs|sp|r|z)-/.test(name)
    ? "scales"
    : name.startsWith("--pc-")
      ? "phases"
      : LITERAL_COLOUR.test(value) && !value.startsWith("color-mix(")
        ? "primitives"
        : "semantic";
