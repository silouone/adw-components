import { afterEach, describe, expect, mock, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { aliasesOf } from "../.storybook/aliases";
import { LAYER_OF_FOLDER, LAYERS } from "../.storybook/layers";
import { THEMES, applyTheme, themeAttribute } from "../.storybook/theme";

const ROOT = join(import.meta.dir, "..");
const COMPONENTS = join(ROOT, "packages", "components");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

const exportsMap = (
  JSON.parse(read("packages/components/package.json")) as {
    exports: Record<string, unknown>;
  }
).exports;

const dirs = (path: string): readonly string[] =>
  readdirSync(join(ROOT, path), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("theme edges", () => {
  test("only the exact lowercase values are themes", () => {
    for (const bad of [
      "",
      " ",
      "Dark",
      "LIGHT",
      "dark ",
      "auto",
      "constructor",
      "__proto__",
      "toString",
    ]) {
      expect(() => themeAttribute(bad)).toThrow("themeAttribute: unknown theme");
    }
  });

  test("the error names the value and every allowed theme", () => {
    expect(() => themeAttribute("")).toThrow("unknown theme '' (expected dark | light | system)");
    for (const theme of THEMES) expect(() => themeAttribute("x")).toThrow(theme);
  });

  test("a rejected theme leaves the document root as it was", () => {
    const root = document.documentElement;
    applyTheme(root, "light");
    expect(() => applyTheme(root, "sepia")).toThrow("sepia");
    expect(root.dataset.theme).toBe("light");
  });

  test("system twice, and system on a root with no theme, are no-ops", () => {
    const root = document.documentElement;
    applyTheme(root, "system");
    applyTheme(root, "system");
    expect(root.dataset.theme).toBeUndefined();
    expect(root.hasAttribute("data-theme")).toBe(false);
  });

  test("switching dark -> system -> light leaves exactly the last attribute", () => {
    const root = document.documentElement;
    applyTheme(root, "dark");
    applyTheme(root, "system");
    expect(root.hasAttribute("data-theme")).toBe(false);
    applyTheme(root, "light");
    expect(root.getAttribute("data-theme")).toBe("light");
  });

  test("applyTheme only touches data-theme", () => {
    const root = document.createElement("div");
    root.setAttribute("class", "keep");
    root.setAttribute("data-other", "1");
    applyTheme(root, "dark");
    applyTheme(root, "system");
    expect(root.getAttribute("class")).toBe("keep");
    expect(root.getAttribute("data-other")).toBe("1");
  });
});

describe("preview decorator", () => {
  for (const name of ["tokens", "tokens.light", "typography", "reset", "motion"]) {
    mock.module(`@adw-factory/tokens/${name}.css`, () => ({}));
  }
  type Decorator = (story: () => unknown, context: { globals: Record<string, unknown> }) => unknown;
  const load = async () => (await import("../.storybook/preview")).default;
  const decoratorOf = async (): Promise<Decorator> => {
    const decorators = [(await load()).decorators ?? []].flat();
    expect(decorators).toHaveLength(1);
    return decorators[0] as unknown as Decorator;
  };

  test("applies the toolbar's theme to the root and returns the story's output", async () => {
    const decorate = await decoratorOf();
    const rendered = { story: true };
    expect(decorate(() => rendered, { globals: { theme: "light" } })).toBe(rendered);
    expect(document.documentElement.dataset.theme).toBe("light");
    decorate(() => rendered, { globals: { theme: "system" } });
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test("a missing or unknown theme global fails fast instead of rendering unthemed", async () => {
    const decorate = await decoratorOf();
    let rendered = false;
    const story = () => {
      rendered = true;
    };
    expect(() => decorate(story, { globals: {} })).toThrow("unknown theme 'undefined'");
    expect(() => decorate(story, { globals: { theme: "sepia" } })).toThrow("sepia");
    expect(rendered).toBe(false);
  });

  test("starts on dark, offers the three themes, and sorts layers in order", async () => {
    const preview = await load();
    expect(preview.initialGlobals).toEqual({ theme: "dark" });
    const theme = preview.globalTypes?.theme as { toolbar: { items: { value: string }[] } };
    expect(theme.toolbar.items.map((i) => i.value)).toEqual(["dark", "light", "system"]);
    const sort = preview.parameters?.options?.storySort as { order: string[] };
    expect(sort.order).toEqual([...LAYERS]);
  });

  test("the default theme is one themeAttribute accepts", async () => {
    const preview = await load();
    expect(() => themeAttribute(String(preview.initialGlobals?.theme))).not.toThrow();
  });
});

describe("aliasesOf edges", () => {
  const find = (aliases: ReturnType<typeof aliasesOf>, specifier: string) =>
    aliases.find((a) => a.find.test(specifier));

  test("no component export leaves only the tokens alias", () => {
    const aliases = aliasesOf("/r", {});
    expect(aliases).toHaveLength(1);
    expect(aliases[0]?.replacement).toBe("/r/packages/tokens/src/$1");
  });

  test("string and null exports are not components", () => {
    expect(
      aliasesOf("/r", { "./components.css": "./dist/components.css", "./x": null }),
    ).toHaveLength(1);
  });

  test("a component alias is exact: no prefix, no sub-path, no other scope", () => {
    const aliases = aliasesOf(ROOT, exportsMap);
    expect(find(aliases, "@adw-factory/components/Kpi")).toBeDefined();
    expect(find(aliases, "@adw-factory/components/KpiExtra")).toBeUndefined();
    expect(find(aliases, "@adw-factory/components/Kpi/deep")).toBeUndefined();
    expect(find(aliases, "@adw-factory/components/kpi")).toBeUndefined();
    expect(find(aliases, "@other/components/Kpi")).toBeUndefined();
  });

  test("the tokens alias keeps the sub-path and does not capture the components scope", () => {
    const [tokens] = aliasesOf(ROOT, exportsMap).filter((a) =>
      a.find.test("@adw-factory/tokens/reset.css"),
    );
    expect(
      "@adw-factory/tokens/reset.css".replace(tokens?.find as RegExp, tokens?.replacement ?? ""),
    ).toBe(join(ROOT, "packages/tokens/src/reset.css"));
    expect(aliasesOf(ROOT, exportsMap).some((a) => a.find.test("@adw-factory/tokenss/x"))).toBe(
      false,
    );
    expect(aliasesOf(ROOT, exportsMap).some((a) => a.find.test("@adw-factory/tokens"))).toBe(false);
  });

  test("component aliases come before the tokens alias, so a broad rule never shadows them", () => {
    const aliases = aliasesOf(ROOT, exportsMap);
    expect(aliases.at(-1)?.find.source).toContain("tokens");
  });

  test("an export whose types or subpath disagree with its import throws naming the key", () => {
    expect(() =>
      aliasesOf(ROOT, {
        "./Kpi": { types: "./dist/atoms/Kpi/Other.d.ts", import: "./dist/atoms/Kpi/Kpi.js" },
      }),
    ).toThrow('"./Kpi"');
    expect(() =>
      aliasesOf(ROOT, {
        "./Other": { types: "./dist/atoms/Kpi/Kpi.d.ts", import: "./dist/atoms/Kpi/Kpi.js" },
      }),
    ).toThrow('"./Other"');
  });

  test("an export with no import at all throws rather than being skipped", () => {
    expect(() => aliasesOf(ROOT, { "./Odd": { types: "./x.d.ts" } })).toThrow('"./Odd"');
  });
});

describe("every component is documented", () => {
  const folders = Object.entries(LAYER_OF_FOLDER).flatMap(([folder]) =>
    existsSync(join(COMPONENTS, "src", folder))
      ? dirs(`packages/components/src/${folder}`).map((name) => ({ folder, name }))
      : [],
  );

  test("there are components to check", () => {
    expect(folders.length).toBeGreaterThanOrEqual(3);
  });

  test("every component folder has its stories file", () => {
    const missing = folders
      .map(({ folder, name }) => `packages/components/src/${folder}/${name}/${name}.stories.tsx`)
      .filter((path) => !existsSync(join(ROOT, path)));
    expect(missing).toEqual([]);
  });

  test("every exported component has its stories file", () => {
    const missing = Object.keys(exportsMap)
      .filter(
        (key) => typeof exportsMap[key] === "object" && key !== "./glyphs" && !key.includes("/", 2),
      )
      .map((key) => key.slice(2))
      .filter(
        (name) =>
          !folders.some(
            (f) =>
              f.name === name &&
              existsSync(join(COMPONENTS, "src", f.folder, name, `${name}.stories.tsx`)),
          ),
      );
    expect(missing).toEqual([]);
  });

  test("no stories file sits outside a component folder or the tokens package", () => {
    const stray = [
      ...new Bun.Glob("packages/*/src/**/*.stories.tsx").scanSync({ cwd: ROOT }),
    ].filter(
      (p) =>
        !/^packages\/components\/src\/[a-z]+\/[A-Za-z0-9]+\/[A-Za-z0-9]+\.stories\.tsx$/.test(p) &&
        !/^packages\/tokens\/src\/[A-Za-z]+\.stories\.tsx$/.test(p),
    );
    expect(stray).toEqual([]);
  });

  test("every component layer folder is a known layer", () => {
    const known = Object.keys(LAYER_OF_FOLDER);
    expect(dirs("packages/components/src").filter((d) => !known.includes(d))).toEqual([]);
  });
});

describe("component stories stay inside the library", () => {
  const stories = [
    ...new Bun.Glob("packages/components/src/**/*.stories.tsx").scanSync({ cwd: ROOT }),
  ];

  test("imports are Storybook, the component beside it, or its own fixture module", () => {
    for (const path of stories) {
      const name = path.split("/").at(-2) as string;
      const imports = [...read(path).matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1] as string);
      expect(
        imports.filter(
          (i) =>
            i !== "@storybook/preact-vite" &&
            i !== `../../../fixtures/${name}` &&
            !i.startsWith("./"),
        ),
      ).toEqual([]);
    }
  });

  test("none reads the world: no fetch, EventSource, storage, location, clock or signal", () => {
    const world =
      /\b(fetch|EventSource|localStorage|sessionStorage|location|history|Date\.now|getComputedStyle|navigator\.clipboard|signal)\b|\bwindow\.|\bdocument\./;
    for (const path of stories) expect(read(path)).not.toMatch(world);
  });

  test("each story file default-exports its meta and exports at least one story", () => {
    for (const path of stories) {
      const source = read(path);
      expect(source).toMatch(/^export default meta;$/m);
      expect(source).toMatch(/^export const [A-Z]\w*: Story\b/m);
    }
  });

  test("every story name is unique inside its file", () => {
    for (const path of stories) {
      const names = [...read(path).matchAll(/^export const ([A-Z]\w*)\b/gm)].map((m) => m[1]);
      expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
    }
  });
});

describe("MDX pages", () => {
  const pages = [...new Bun.Glob("packages/*/docs/**/*.mdx").scanSync({ cwd: ROOT })];

  test("the library has its two Foundations MDX pages", () => {
    expect(pages.sort()).toEqual([
      "packages/components/docs/DesignSystem.mdx",
      "packages/components/docs/Layers.mdx",
    ]);
  });

  test("each imports Meta from the docs addon and declares exactly one Foundations title", () => {
    for (const path of pages) {
      const source = read(path);
      expect(source).toContain('import { Meta } from "@storybook/addon-docs/blocks";');
      const metas = [...source.matchAll(/<Meta\s+title="([^"]+)"\s*\/>/g)];
      expect(metas).toHaveLength(1);
      expect(metas[0]?.[1]).toMatch(/^Foundations\/[A-Z][A-Za-z ]+$/);
    }
  });

  test("Layers.mdx explains the five layers in folder order", () => {
    const source = read("packages/components/docs/Layers.mdx");
    const at = ["Atoms", "Molecules", "Organisms", "Templates", "Pages"].map((l) =>
      source.indexOf(l),
    );
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  test("DesignSystem.mdx lists the four red lines it states in the repo rules", () => {
    const source = read("packages/components/docs/DesignSystem.mdx");
    const red = /^## Red lines\n([\s\S]*?)(?=^## )/m.exec(source)?.[1] ?? "";
    expect(red).toMatch(/stateless|pure view/i);
    expect(red).toMatch(/token/i);
    expect(red).toMatch(/props?|strings?|words?/i);
  });
});

describe("Node for Storybook", () => {
  test(".nvmrc pins Node 22, which both workflows read", () => {
    expect(read(".nvmrc").trim()).toBe("22");
    for (const workflow of [".github/workflows/ci.yml", ".github/workflows/chromatic.yml"]) {
      expect(read(workflow)).toContain("node-version-file: .nvmrc");
    }
  });

  test("chromatic.yml pins the same checkout, node and bun actions as ci.yml", () => {
    const pins = (text: string, name: string): string[] =>
      [...text.matchAll(new RegExp(`uses: (${name}@[0-9a-f]{40})`, "g"))].map(
        (m) => m[1] as string,
      );
    const ci = read(".github/workflows/ci.yml");
    const chromatic = read(".github/workflows/chromatic.yml");
    for (const name of ["actions/checkout", "actions/setup-node", "oven-sh/setup-bun"]) {
      expect(pins(chromatic, name)).toHaveLength(1);
      expect(pins(ci, name)).toContain(pins(chromatic, name)[0] as string);
    }
  });

  test("the README says Node 22 is for Storybook only", () => {
    expect(read("README.md")).toMatch(/Node 22[^.\n]*Storybook|Storybook[^.\n]*Node 22/);
  });
});
