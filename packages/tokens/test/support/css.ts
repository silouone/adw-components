// Pure helpers the token tests share: no I/O, no globals.

export type Rgb = readonly [number, number, number];

export type RootDiff = {
  readonly changed: readonly string[];
  readonly missing: readonly string[];
  readonly extra: readonly string[];
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const parseColor = (value: string): Rgb => {
  const match = HEX.exec(value.trim());
  if (match === null) throw new Error(`parseColor: unsupported colour '${value}'`);
  const digits = match[1] as string;
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
  const channel = (i: number): number => Number.parseInt(full.slice(i, i + 2), 16);
  return [channel(0), channel(2), channel(4)];
};

const linear = (channel: number): number => {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour: string): number => {
  const [r, g, b] = parseColor(colour);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/** WCAG 2.x contrast ratio, independent of argument order. */
export const contrastRatio = (a: string, b: string): number => {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Splits at `;`, `{` and `}` outside parentheses; a `${…}` interpolation is one atom. */
const statements = (css: string): readonly string[] => {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i] as string;
    if (ch === "$" && css[i + 1] === "{") {
      const end = css.indexOf("}", i);
      const stop = end === -1 ? css.length - 1 : end;
      current += css.slice(i, stop + 1);
      i = stop;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && (ch === ";" || ch === "{" || ch === "}")) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
};

/** Every `--name: value` in the css, comments stripped, values trimmed and whitespace-collapsed. */
export const parseDeclarations = (css: string): ReadonlyMap<string, string> => {
  const decls = new Map<string, string>();
  for (const statement of statements(stripComments(css))) {
    const match = /^\s*(--[\w-]+)\s*:([\s\S]*)$/.exec(statement);
    if (match === null) continue;
    const name = match[1] as string;
    if (decls.has(name)) throw new Error(`parseDeclarations: ${name} declared twice`);
    decls.set(name, (match[2] as string).trim().replace(/\s+/g, " "));
  }
  return decls;
};

/** The body of the `:root{…}` inside `themeCss()`, `${…}` interpolations kept verbatim. */
export const extractSnapshotRoot = (ts: string): string => {
  const start = ts.indexOf("function themeCss");
  const match = /:root\s*\{((?:\$\{[^}]*\}|[^}])*)\}/.exec(start === -1 ? ts : ts.slice(start));
  if (match === null) throw new Error("extractSnapshotRoot: no :root block found in themeCss()");
  return match[1] as string;
};

/** Follows `var(--x)` chains to a leaf value; names the token on a missing target or a cycle. */
export const resolveToken = (decls: ReadonlyMap<string, string>, name: string): string => {
  const walk = (token: string, path: readonly string[]): string => {
    if (path.includes(token))
      throw new Error(`resolveToken: cycle ${[...path, token].join(" -> ")}`);
    const value = decls.get(token);
    if (value === undefined) {
      const via = path.length > 0 ? ` (referenced by ${path[path.length - 1]})` : "";
      throw new Error(`resolveToken: ${token} is not declared${via}`);
    }
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    return ref === null ? value : walk(ref[1] as string, [...path, token]);
  };
  return walk(name, []);
};

// Formatters add spaces after commas; a value is the same value either way.
const canonical = (value: string): string => value.replace(/\s*,\s*/g, ",");

/** How `mine` differs from `snapshot` (both the text of a `:root` body), `ignore` names set aside. */
export const diffRoots = (
  snapshot: string,
  mine: string,
  ignore: readonly string[] = [],
): RootDiff => {
  const keep = (decls: ReadonlyMap<string, string>): ReadonlyMap<string, string> =>
    new Map([...decls].filter(([name]) => !ignore.includes(name)));
  const [a, b] = [keep(parseDeclarations(snapshot)), keep(parseDeclarations(mine))];
  return {
    changed: [...a]
      .filter(([n, v]) => b.has(n) && canonical(b.get(n) as string) !== canonical(v))
      .map(([n]) => n),
    missing: [...a.keys()].filter((n) => !b.has(n)),
    extra: [...b.keys()].filter((n) => !a.has(n)),
  };
};
