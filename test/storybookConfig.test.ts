import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import remarkGfm from "remark-gfm";
import { aliasesOf } from "../.storybook/aliases";
import { LAYERS } from "../.storybook/layers";
import config from "../.storybook/main";
import { THEMES, applyTheme, themeAttribute } from "../.storybook/theme";
import { VIEWPORTS } from "../.storybook/viewports";

const ROOT = join(import.meta.dir, "..");
const COMPONENTS = join(ROOT, "packages", "components");
const exportsMap = (
  JSON.parse(readFileSync(join(COMPONENTS, "package.json"), "utf8")) as {
    exports: Record<string, unknown>;
  }
).exports;

type Alias = { readonly find: RegExp | string; readonly replacement: string };

const resolveAliases = async (): Promise<readonly Alias[]> => {
  const out = await config.viteFinal?.({}, { configType: "DEVELOPMENT" } as never);
  return (out?.resolve?.alias ?? []) as readonly Alias[];
};

const resolveImport = (aliases: readonly Alias[], specifier: string): string | undefined => {
  for (const { find, replacement } of aliases) {
    if (typeof find === "string" ? find === specifier : find.test(specifier)) {
      return typeof find === "string" ? replacement : specifier.replace(find, replacement);
    }
  }
  return undefined;
};

describe("storybook main.ts", () => {
  test("stories globs cover the packages' stories and docs", () => {
    expect(config.stories).toEqual([
      "../packages/*/src/**/*.stories.tsx",
      "../packages/*/docs/**/*.mdx",
    ]);
  });

  test("framework is preact-vite", () => {
    const framework = config.framework;
    const name = typeof framework === "string" ? framework : framework.name;
    expect(name).toBe("@storybook/preact-vite");
  });

  test("addons: a11y, and docs with remark-gfm", () => {
    const addons = (config.addons ?? []) as readonly unknown[];
    expect(addons).toContain("@storybook/addon-a11y");
    const docs = addons.find(
      (a) =>
        typeof a === "object" && a !== null && "name" in a && a.name === "@storybook/addon-docs",
    ) as
      | { options?: { mdxPluginOptions?: { mdxCompileOptions?: { remarkPlugins?: unknown[] } } } }
      | undefined;
    expect(docs).toBeDefined();
    expect(docs?.options?.mdxPluginOptions?.mdxCompileOptions?.remarkPlugins).toContain(remarkGfm);
  });

  test("telemetry is off", () => {
    expect((config.core as { disableTelemetry?: boolean } | undefined)?.disableTelemetry).toBe(
      true,
    );
  });

  test("viteFinal aliases the workspace packages to their sources", async () => {
    const aliases = await resolveAliases();
    expect(resolveImport(aliases, "@adw-factory/tokens/tokens.css")).toBe(
      join(ROOT, "packages/tokens/src/tokens.css"),
    );
    expect(resolveImport(aliases, "@adw-factory/components/Kpi")).toBe(
      join(COMPONENTS, "src/atoms/Kpi/Kpi.tsx"),
    );
    expect(resolveImport(aliases, "@adw-factory/components/ArmButton")).toBe(
      join(COMPONENTS, "src/molecules/ArmButton/ArmButton.tsx"),
    );
    expect(resolveImport(aliases, "@adw-factory/components/PhaseStrip")).toBe(
      join(COMPONENTS, "src/molecules/PhaseStrip/PhaseStrip.tsx"),
    );
  });
});

describe("aliasesOf", () => {
  test("derives one existing source per component export, skipping components.css", () => {
    const aliases = aliasesOf(ROOT, exportsMap);
    const components = aliases.filter(
      (a) => a.find instanceof RegExp && a.find.source.includes("components"),
    );
    expect(components).toHaveLength(54);
    for (const { replacement } of components) expect(existsSync(replacement)).toBe(true);
    expect(resolveImport(aliases, "@adw-factory/components/components.css")).toBeUndefined();
  });

  test("an import outside ./dist/<layer>/<Name>/<Name>.js throws naming the export key", () => {
    expect(() =>
      aliasesOf(ROOT, { "./Odd": { types: "./x.d.ts", import: "./lib/Odd.js" } }),
    ).toThrow('"./Odd"');
  });
});

describe("theme", () => {
  test("THEMES lists dark, light, system", () => {
    expect([...THEMES]).toEqual(["dark", "light", "system"]);
  });

  test("themeAttribute maps light/dark and leaves system unset", () => {
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("dark")).toBe("dark");
    expect(themeAttribute("system")).toBeUndefined();
  });

  test("themeAttribute throws on an unknown theme, naming it and the allowed list", () => {
    expect(() => themeAttribute("sepia")).toThrow(
      "themeAttribute: unknown theme 'sepia' (expected dark | light | system)",
    );
  });

  test("applyTheme sets data-theme for light/dark and removes it for system", () => {
    const root = document.documentElement;
    applyTheme(root, "light");
    expect(root.dataset.theme).toBe("light");
    applyTheme(root, "dark");
    expect(root.dataset.theme).toBe("dark");
    applyTheme(root, "system");
    expect(root.dataset.theme).toBeUndefined();
    expect(() => applyTheme(root, "sepia")).toThrow("sepia");
  });
});

describe("layers and viewports", () => {
  test("LAYERS is the six layers in documentation order", () => {
    expect([...LAYERS]).toEqual([
      "Foundations",
      "Atoms",
      "Molecules",
      "Organisms",
      "Templates",
      "Pages",
    ]);
  });

  test("viewports are the console's media-query widths", () => {
    const sizes = Object.fromEntries(
      Object.entries(VIEWPORTS).map(([k, v]) => [k, [v.styles.width, v.styles.height]]),
    );
    expect(sizes).toEqual({
      narrow: ["820px", "900px"],
      rail: ["1100px", "900px"],
      desktop: ["1440px", "900px"],
    });
  });
});

describe("storybook preview.ts", () => {
  const source = readFileSync(join(ROOT, ".storybook", "preview.ts"), "utf8");

  test("imports the five stylesheets in order, before any other import", () => {
    const imports = [...source.matchAll(/^import\s+(?:[^;]*?from\s+)?"([^"]+)";?$/gm)].map(
      (m) => m[1],
    );
    const css = ["tokens", "tokens.light", "typography", "reset", "motion"].map(
      (n) => `@adw-factory/tokens/${n}.css`,
    );
    expect(imports.slice(0, 5)).toEqual(css);
    for (const line of source.split("\n").filter((l) => /^import\s+"/.test(l))) {
      expect(line).toMatch(/@adw-factory\/tokens\/[a-z.]+\.css/);
    }
  });

  test("theme toolbar defaults to dark", () => {
    expect(source).toMatch(/initialGlobals:\s*\{\s*theme:\s*"dark"/);
    expect(source).toMatch(/globalTypes:\s*\{\s*theme:\s*themeToolbar/);
  });

  test("a decorator applies the theme to the document root", () => {
    expect(source).toContain("applyTheme(document.documentElement");
  });

  test("stories are sorted by an inline literal equal to LAYERS", () => {
    const literal = /storySort:\s*\{\s*order:\s*(\[[^\]]*\])/.exec(source)?.[1];
    expect(literal).toBeDefined();
    expect(JSON.parse(literal as string)).toEqual([...LAYERS]);
  });

  test("viewports come from VIEWPORTS", () => {
    expect(source).toMatch(/viewport:\s*\{\s*options:\s*VIEWPORTS/);
  });
});
