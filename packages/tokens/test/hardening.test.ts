import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR } from "./support/build";
import { contrastRatio, parseDeclarations, resolveToken } from "./support/css";

const SRC = join(PACKAGE_DIR, "src");
const read = (file: string): string => readFileSync(join(SRC, file), "utf8");
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");
const squash = (css: string): string =>
  stripComments(css).replace(/'/g, '"').replace(/\s+/g, " ").trim();

const SOURCES = ["tokens.css", "tokens.light.css", "typography.css", "reset.css", "motion.css"];

const tokens = parseDeclarations(read("tokens.css"));
const typography = stripComments(read("typography.css"));
const reset = stripComments(read("reset.css"));
const motion = stripComments(read("motion.css"));
const light = read("tokens.light.css");

/** Every selector of every style rule, ignoring @-rule preludes and keyframe steps. */
const selectors = (css: string): readonly string[] =>
  [
    ...stripComments(css)
      .replace(/@[^{]*\{/g, "")
      .matchAll(/([^{};]+)\{/g),
  ].map((m) => (m[1] as string).trim());

/** CSS specificity (ids, classes+attributes+pseudo-classes, types) of one compound selector. */
const specificity = (selector: string): readonly [number, number, number] => {
  let rest = selector;
  // :not() counts as its argument.
  const nots = [...rest.matchAll(/:not\(([^)]*)\)/g)].map((m) => m[1] as string);
  rest = rest.replace(/:not\([^)]*\)/g, "");
  const attrs = (rest.match(/\[[^\]]*\]/g) ?? []).length;
  rest = rest.replace(/\[[^\]]*\]/g, "");
  const ids = (rest.match(/#[\w-]+/g) ?? []).length;
  const classes = (rest.match(/\.[\w-]+|:(?!:)[\w-]+/g) ?? []).length;
  const types = (rest.replace(/#[\w-]+|\.[\w-]+|::?[\w-]+/g, "").match(/[a-zA-Z][\w-]*/g) ?? [])
    .length;
  const inner = nots.map(specificity);
  return [
    ids + inner.reduce((n, s) => n + s[0], 0),
    classes + attrs + inner.reduce((n, s) => n + s[1], 0),
    types + inner.reduce((n, s) => n + s[2], 0),
  ];
};

describe("tokens.css references", () => {
  test("every var(--x) read inside tokens.css names a declared token", () => {
    const dangling = [...tokens.values()]
      .flatMap((value) => [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1] as string))
      .filter((name) => !tokens.has(name));
    expect(dangling).toEqual([]);
  });

  test("every var(--x) read by typography, reset and motion exists in the package", () => {
    const all = new Set([
      ...tokens.keys(),
      ...parseDeclarations(read("typography.css")).keys(),
      ...parseDeclarations(read("motion.css")).keys(),
    ]);
    for (const [file, css] of [
      ["typography.css", typography],
      ["reset.css", reset],
      ["motion.css", motion],
    ] as const) {
      const missing = [...css.matchAll(/var\((--(?!adw-)[\w-]+)/g)]
        .map((m) => m[1] as string)
        .filter((name) => !all.has(name));
      expect({ file, missing }).toEqual({ file, missing: [] });
    }
  });

  test("no sheet declares the page's --zoom", () => {
    for (const file of SOURCES) {
      expect({ file, zoom: parseDeclarations(read(file)).has("--zoom") }).toEqual({
        file,
        zoom: false,
      });
    }
  });

  test("no custom property is declared in two files", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const file of SOURCES) {
      for (const name of parseDeclarations(read(file)).keys()) {
        const first = seen.get(name);
        if (first !== undefined) clashes.push(`${name} in ${first} and ${file}`);
        else seen.set(name, file);
      }
    }
    expect(clashes).toEqual([]);
  });
});

describe("tokens.css structure", () => {
  const body = squash(read("tokens.css"));

  test("holds exactly one rule, :root, and no at-rule", () => {
    expect(selectors(read("tokens.css"))).toEqual([":root"]);
    expect(body).not.toContain("@");
  });

  test("declares color-scheme once, as dark", () => {
    expect(body.match(/color-scheme ?:/g)).toHaveLength(1);
    expect(body).toMatch(/color-scheme: ?dark ?;/);
  });

  test("knows nothing of the light layer or of !important", () => {
    expect(body).not.toContain("data-theme");
    expect(body).not.toContain("prefers-color-scheme");
    expect(body).not.toContain("!important");
  });

  test("declares the surfaces and the text tokens the contrast test reads", () => {
    for (const name of [
      "--bg",
      "--panel",
      "--panel2",
      "--ink",
      "--ink-strong",
      "--dim",
      "--faint",
      "--ok",
      "--bad",
      "--warn",
      "--live",
      "--model",
      "--tool",
    ]) {
      expect({ name, declared: tokens.has(name) }).toEqual({ name, declared: true });
    }
  });

  test("every shadow is a three-step ladder of growing blur and opacity", () => {
    const parsed = ["--shadow-1", "--shadow-2", "--shadow-3"].map((name) => {
      const m = /^0 (\d+)px (\d+)px color-mix\(in srgb ?, ?var\(--overlay-bg\) (\d+)%/.exec(
        tokens.get(name) ?? "",
      );
      expect({ name, matched: m !== null }).toEqual({ name, matched: true });
      return [Number(m?.[1]), Number(m?.[2]), Number(m?.[3])] as const;
    });
    for (let i = 1; i < parsed.length; i++) {
      for (let k = 0; k < 3; k++) {
        expect((parsed[i] as readonly number[])[k] as number).toBeGreaterThan(
          (parsed[i - 1] as readonly number[])[k] as number,
        );
      }
    }
  });
});

describe("scales", () => {
  const px = (prefix: string, only?: readonly string[]): readonly number[] =>
    [...tokens]
      .filter(
        ([n]) => n.startsWith(prefix) && (only === undefined || only.some((o) => n === prefix + o)),
      )
      .map(([, v]) => Number.parseFloat(v));
  const strictlyAscending = (xs: readonly number[]): boolean =>
    xs.every((x, i) => i === 0 || x > (xs[i - 1] as number));

  test("--fs-* ascends from 2xs to 2xl", () => {
    expect(px("--fs-")).toHaveLength(8);
    expect(strictlyAscending(px("--fs-"))).toBe(true);
  });

  test("--sp-* ascends", () => {
    expect(strictlyAscending(px("--sp-"))).toBe(true);
  });

  test("--r-* ascends through the finite radii", () => {
    expect(strictlyAscending(px("--r-", ["xs", "sm", "md", "lg", "pill"]))).toBe(true);
  });

  test("--r-round is a percentage so it works on any box", () => {
    expect(tokens.get("--r-round")).toBe("50%");
  });

  test("--z-* ascends", () => {
    expect(strictlyAscending(px("--z-"))).toBe(true);
  });

  test("every --hue-s/--hue-l is a valid percentage in 0..100", () => {
    const hue = [...tokens].filter(([n]) => /^--hue-[sl]-/.test(n));
    expect(hue.length).toBeGreaterThan(0);
    for (const [name, value] of hue) {
      const n = Number.parseFloat(value);
      expect({ name, ok: n >= 0 && n <= 100 }).toEqual({ name, ok: true });
    }
  });

  test("every --hue-s-x has its --hue-l-x pair and vice versa", () => {
    const s = [...tokens.keys()].filter((n) => n.startsWith("--hue-s-")).map((n) => n.slice(8));
    const l = [...tokens.keys()].filter((n) => n.startsWith("--hue-l-")).map((n) => n.slice(8));
    expect(s.sort()).toEqual(l.sort());
  });
});

describe("contrast boundaries", () => {
  const ratio = (text: string, surface: string): number =>
    contrastRatio(resolveToken(tokens, text), resolveToken(tokens, surface));

  test("the three sub-AA pairs sit at their measured ratios", () => {
    expect(ratio("--dim", "--panel")).toBeCloseTo(4.43, 1);
    expect(ratio("--dim", "--panel2")).toBeCloseTo(4.23, 1);
    expect(ratio("--tool", "--panel2")).toBeCloseTo(4.42, 1);
  });

  test("--dim and --tool clear AA on --bg, so the debt is panel-only", () => {
    expect(ratio("--dim", "--bg")).toBeGreaterThanOrEqual(4.5);
    expect(ratio("--tool", "--bg")).toBeGreaterThanOrEqual(4.5);
  });

  test("--ink-strong is at least as readable as --ink on every surface", () => {
    for (const surface of ["--bg", "--panel", "--panel2"]) {
      expect(ratio("--ink-strong", surface)).toBeGreaterThanOrEqual(ratio("--ink", surface));
    }
  });

  test("--faint stays well under AA, not on its edge", () => {
    for (const surface of ["--bg", "--panel", "--panel2"]) {
      expect(ratio("--faint", surface)).toBeLessThan(3);
    }
  });

  test("every colour utility reads a token the contrast test measures, never --faint", () => {
    const measured = ["--dim", "--ink", "--ok", "--bad", "--warn", "--live"];
    const used = [...typography.matchAll(/\.c-[\w-]+\s*\{[^}]*color:\s*var\((--[\w-]+)\)/g)].map(
      (m) => m[1] as string,
    );
    expect(used.sort()).toEqual([...measured].sort());
    expect(typography).not.toMatch(/var\(--faint\)/);
    expect(reset).not.toMatch(/var\(--faint\)/);
  });
});

describe("light layer structure", () => {
  const rules = selectors(light);

  test("holds exactly the two D4.5 selectors", () => {
    expect(rules.map((r) => r.replace(/'/g, '"'))).toEqual([
      ':root:not([data-theme="dark"])',
      ':root[data-theme="light"]',
    ]);
  });

  test("both selectors have specificity (0,2,0), above tokens.css's :root (0,1,0)", () => {
    expect(specificity(":root")).toEqual([0, 1, 0]);
    for (const selector of rules) {
      expect({ selector, specificity: specificity(selector) }).toEqual({
        selector,
        specificity: [0, 2, 0],
      });
    }
  });

  test("the only declaration anywhere is color-scheme: light", () => {
    const decls = [...squash(light).matchAll(/([\w-]+) ?: ?([^;{}]+);/g)].map((m) => [m[1], m[2]]);
    expect(decls).toEqual([
      ["color-scheme", "light"],
      ["color-scheme", "light"],
    ]);
  });

  test("the OS-following selector sits inside the light media query only", () => {
    const body = squash(light);
    expect(body.match(/@media/g)).toHaveLength(1);
    expect(body).toMatch(/^@media \(prefers-color-scheme: ?light\) ?\{ ?:root:not/);
  });

  test("the force-light selector is outside any media query", () => {
    const outside = squash(light).replace(/@media[^{]*\{ ?[^{]*\{[^}]*\} ?\}/, "");
    expect(outside).toContain(':root[data-theme="light"]');
  });

  test("never mentions a primitive, a colour or a var()", () => {
    expect(stripComments(light)).not.toMatch(/var\(|#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix/);
  });

  test("the specificity helper tells (0,2,0) from its neighbours", () => {
    expect(specificity(":root[data-theme='light']")).toEqual([0, 2, 0]);
    expect(specificity("html:root")).toEqual([0, 1, 1]);
    expect(specificity(".a .b")).toEqual([0, 2, 0]);
    expect(specificity("#a")).toEqual([1, 0, 0]);
  });
});

describe("typography coverage", () => {
  const fsSteps = [...tokens.keys()].filter((n) => n.startsWith("--fs-")).map((n) => n.slice(5));

  test("every --fs-* step has a .t-<step> class and every ladder class has a step", () => {
    const ladder = [...typography.matchAll(/\.t-([\w]+)\s*\{\s*font-size:\s*var\(--fs-([\w]+)\)/g)]
      .filter((m) => m[1] === m[2])
      .map((m) => m[1] as string);
    expect(ladder.sort()).toEqual([...fsSteps].sort());
  });

  test("a class is defined once: no selector repeats", () => {
    const sels = selectors(typography).filter((s) => s !== ":root");
    expect(sels.filter((s, i) => sels.indexOf(s) !== i)).toEqual([]);
  });

  test("every class carries the t- or c- prefix", () => {
    const names = [...typography.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1] as string);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect({ name, ok: /^[tc]-/.test(name) }).toEqual({ name, ok: true });
    }
  });

  test(".t-truncate is the full ellipsis recipe and .t-clamp the full line-clamp recipe", () => {
    const body = squash(typography);
    for (const decl of ["overflow: hidden", "text-overflow: ellipsis", "white-space: nowrap"])
      expect(body).toContain(decl);
    for (const decl of [
      "display: -webkit-box",
      "-webkit-box-orient: vertical",
      "-webkit-line-clamp:",
    ])
      expect(body).toContain(decl);
  });

  test(".t-clamp falls back to two lines when the component sets nothing", () => {
    expect(typography).toMatch(/-webkit-line-clamp:\s*var\(--adw-t-clamp-lines,\s*2\)/);
  });

  test(".t-eyebrow tracks with a token and is no larger than --fs-xs", () => {
    expect(typography).toMatch(/\.t-eyebrow\s*\{[^}]*font-size:\s*var\(--fs-xs\)/);
    expect(typography).toMatch(/\.t-eyebrow\s*\{[^}]*letter-spacing:\s*var\(--tracking-eyebrow\)/);
    const tracking = parseDeclarations(read("typography.css")).get("--tracking-eyebrow");
    expect(tracking).toMatch(/^0?\.\d+em$/);
  });

  test("font stacks end in a generic family", () => {
    const decls = parseDeclarations(read("typography.css"));
    expect(decls.get("--font-mono")).toMatch(/,\s*monospace$/);
    expect(decls.get("--font-sans")).toMatch(/,\s*sans-serif$/);
  });

  test("raw lengths stay out of typography: only the 0 and 1 allowed", () => {
    const lengths = typography.match(/(?<![\w.-])\d*\.?\d+(px|rem|em|pt)\b/g) ?? [];
    // 0.08em tracking is a declared token value; every other length must be a token read.
    expect(lengths.filter((l) => l !== "0.08em")).toEqual([]);
  });
});

describe("reset.css edge cases", () => {
  test("never removes the focus outline", () => {
    expect(reset).not.toMatch(/outline:\s*(none|0)\b/);
    expect(reset).not.toMatch(/:focus\s*\{/);
  });

  test("the reduced-motion floor lives inside its media query, on every element", () => {
    const m = /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\*\s*\{([^}]*)\}\s*\}/.exec(
      reset,
    );
    expect(m).not.toBeNull();
    expect(squash(m?.[1] ?? "")).toBe("transition: none !important; animation: none !important;");
  });

  test("!important appears only in the reduced-motion floor", () => {
    const outside = reset.replace(/@media \(prefers-reduced-motion[\s\S]*$/, "");
    expect(outside).not.toContain("!important");
  });

  test("sets no colour or font as a literal: body reads tokens", () => {
    const body = /body\s*\{([^}]*)\}/.exec(reset)?.[1] ?? "";
    expect(body).toMatch(/background:\s*var\(--bg\)/);
    expect(body).toMatch(/color:\s*var\(--ink\)/);
    expect(body).toMatch(/var\(--fs-base\)/);
    expect(body).toMatch(/var\(--font-mono\)/);
  });

  test("selects no component class", () => {
    expect(selectors(reset).filter((s) => s.includes("."))).toEqual([]);
  });
});

describe("motion.css edge cases", () => {
  const decls = parseDeclarations(read("motion.css"));
  const seconds = (v: string): number =>
    v.endsWith("ms") ? Number.parseFloat(v) / 1000 : Number.parseFloat(v);

  test("holds no @keyframes and no arm-drain token (keyframes stay in components)", () => {
    expect(motion).not.toContain("@keyframes");
    expect([...decls.keys()].filter((n) => /(^|-)arm(-|$)/.test(n))).toEqual([]);
  });

  test("names a timing for each looping keyframe the factory runs", () => {
    for (const name of [
      "--dur-wk-pulse",
      "--dur-beacon",
      "--dur-sweep",
      "--dur-dg-sweep",
      "--dur-dg-spin",
      "--dur-dg-alarm",
      "--dur-dg-flow",
    ]) {
      expect({ name, declared: decls.has(name) }).toEqual({ name, declared: true });
    }
    expect([...decls.keys()].filter((n) => n.startsWith("--dur-live-edge"))).toHaveLength(3);
  });

  test("the three transition steps ascend and stay under 200ms", () => {
    const steps = ["--dur-instant", "--dur-fast", "--dur-base"].map((n) =>
      seconds(decls.get(n) ?? "NaN"),
    );
    expect(steps.every(Number.isFinite)).toBe(true);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(3);
    expect(Math.max(...steps)).toBeLessThanOrEqual(0.2);
  });

  test("every loop is a positive duration under 10s", () => {
    for (const [name, value] of decls) {
      if (!name.startsWith("--dur-")) continue;
      const s = seconds(value);
      expect({ name, ok: s > 0 && s < 10 }).toEqual({ name, ok: true });
    }
  });

  test("every --ease-* is a CSS easing keyword or function", () => {
    const easings = [...decls].filter(([n]) => n.startsWith("--ease-"));
    expect(easings.length).toBeGreaterThan(0);
    for (const [name, value] of easings) {
      expect({
        name,
        ok: /^(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\([^)]*\)|steps\([^)]*\))$/.test(
          value,
        ),
      }).toEqual({ name, ok: true });
    }
  });
});

describe("package hygiene", () => {
  const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;

  test("src/ holds the five css files and the two Foundations stories", () => {
    expect(readdirSync(SRC).sort()).toEqual(
      [...SOURCES, "Tokens.stories.tsx", "TextStyles.stories.tsx"].sort(),
    );
  });

  test("has no runtime dependency, no main and no bin", () => {
    for (const key of ["dependencies", "peerDependencies", "main", "module", "bin", "types"])
      expect({ key, present: key in manifest }).toEqual({ key, present: false });
  });

  test("is public, scoped, Apache-2.0 and not marked private", () => {
    expect(manifest.name).toBe("@adw-factory/tokens");
    expect(manifest.license).toBe("Apache-2.0");
    expect(manifest.private).toBeUndefined();
  });

  test("the build script only copies src css into dist", () => {
    const scripts = manifest.scripts as Record<string, string>;
    expect(scripts.build).toContain("cp src/*.css dist/");
    expect(scripts.build).not.toMatch(/\bnpm\b|\bcurl\b|\bsed\b/);
  });

  test("a pack leaves no tarball behind", () => {
    const stray = readdirSync(PACKAGE_DIR).filter((f) => f.endsWith(".tgz"));
    expect(stray).toEqual([]);
    expect(existsSync(join(PACKAGE_DIR, "..", "..", "adw-factory-tokens-0.0.0.tgz"))).toBe(false);
  });

  test("README names the five files, the tier rule and that --zoom is the page's", () => {
    const readme = readFileSync(join(PACKAGE_DIR, "README.md"), "utf8");
    for (const file of SOURCES)
      expect({ file, named: readme.includes(file) }).toEqual({ file, named: true });
    expect(readme).toContain("--zoom");
    expect(readme).toMatch(/color-mix/);
  });
});
