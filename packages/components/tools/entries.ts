// Pure core of the build: which components the manifest exports, where their
// sources live, and how their CSS is ordered and cleaned. No I/O here; `build.ts`
// is the edge.

export const LAYERS = ["atoms", "molecules", "organisms", "templates", "pages"] as const;

/** Every path is package-relative, e.g. `src/atoms/Kpi/Kpi.tsx`. */
export interface Entry {
  readonly subpath: string;
  readonly name: string;
  readonly layer: string;
  readonly src: string;
  readonly js: string;
  readonly dts: string;
  readonly css: string;
}

/**
 * A module export: no stylesheet of its own. Either a bare `src/<name>.ts` (`./glyphs`) or a
 * sub-part of a component folder, `src/<layer>/<Folder>/<file>.ts[x]` (`./FocusPanel/focusTabs`).
 */
export interface ModuleEntry {
  readonly subpath: string;
  readonly name: string;
  readonly src: string;
  readonly js: string;
  readonly dts: string;
}

const IMPORT_TARGET = new RegExp(`^\\./dist/(${LAYERS.join("|")})/([A-Za-z0-9]+)/\\2\\.js$`);
const MODULE_TARGET = new RegExp(
  `^\\./dist/(?:(${LAYERS.join("|")})/([A-Za-z0-9]+)/)?([A-Za-z0-9]+)\\.js$`,
);

const importOf = (value: Readonly<Record<string, unknown>>): string | undefined =>
  typeof value.import === "string" ? value.import : undefined;

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const entryOf = (
  key: string,
  value: Readonly<Record<string, unknown>>,
  exists: (path: string) => boolean,
): Entry => {
  const target = value.import;
  const match = typeof target === "string" ? IMPORT_TARGET.exec(target) : null;
  if (match === null) {
    throw new Error(
      `export "${key}": "import" must be ./dist/<${LAYERS.join("|")}>/<Name>/<Name>.js, got ${JSON.stringify(target)}`,
    );
  }
  const layer = match[1] as string;
  const name = match[2] as string;
  const base = `${layer}/${name}/${name}`;
  if (key !== `./${name}`) {
    throw new Error(`export "${key}": the subpath must be "./${name}" to match ${String(target)}`);
  }
  if (value.types !== `./dist/${base}.d.ts`) {
    throw new Error(
      `export "${key}": "types" must be ./dist/${base}.d.ts to mirror "import", got ${JSON.stringify(value.types)}`,
    );
  }
  const src = `src/${base}.tsx`;
  if (!exists(src)) throw new Error(`export "${key}" has no source at ${src}`);
  return {
    subpath: key,
    name,
    layer,
    src,
    js: `dist/${base}.js`,
    dts: `dist/${base}.d.ts`,
    css: `dist/${base}.css`,
  };
};

/** A bare `./name`, or a sub-part `./Folder/file`; a layered target under a one-segment subpath is a component export. */
const isModuleExport = (key: string, value: unknown): boolean => {
  const target = isObject(value) ? importOf(value) : undefined;
  if (target === undefined) return false;
  const match = MODULE_TARGET.exec(target);
  if (match === null || IMPORT_TARGET.test(target)) return false;
  return match[1] === undefined || key.includes("/", 2);
};

const moduleOf = (
  key: string,
  value: Readonly<Record<string, unknown>>,
  exists: (path: string) => boolean,
): ModuleEntry => {
  const [, layer, folder, file] = MODULE_TARGET.exec(importOf(value) ?? "") as RegExpExecArray;
  const base = layer === undefined ? `${file}` : `${layer}/${folder}/${file}`;
  const name = layer === undefined ? `${file}` : `${folder}/${file}`;
  if (key !== `./${name}`) {
    throw new Error(
      `export "${key}": the subpath must be "./${name}" to match ${String(value.import)}`,
    );
  }
  if (value.types !== `./dist/${base}.d.ts`) {
    throw new Error(
      `export "${key}": "types" must be ./dist/${base}.d.ts to mirror "import", got ${JSON.stringify(value.types)}`,
    );
  }
  const src = [`src/${base}.ts`, `src/${base}.tsx`].find(exists);
  if (src === undefined) throw new Error(`export "${key}" has no source at src/${base}.ts[x]`);
  return { subpath: key, name, src, js: `dist/${base}.js`, dts: `dist/${base}.d.ts` };
};

/** One entry per layered component export; string exports (`./components.css`) and module exports (`./glyphs`) are not. */
export const entriesOf = (
  exportsMap: Readonly<Record<string, unknown>>,
  exists: (path: string) => boolean,
): readonly Entry[] =>
  Object.entries(exportsMap).flatMap(([key, value]) =>
    !isObject(value) || isModuleExport(key, value) ? [] : [entryOf(key, value, exists)],
  );

/**
 * One entry per module export (`./glyphs` → `src/glyphs.ts`,
 * `./FocusPanel/focusTabs` → `src/organisms/FocusPanel/focusTabs.tsx`).
 */
export const modulesOf = (
  exportsMap: Readonly<Record<string, unknown>>,
  exists: (path: string) => boolean,
): readonly ModuleEntry[] =>
  Object.entries(exportsMap).flatMap(([key, value]) =>
    isObject(value) && isModuleExport(key, value) ? [moduleOf(key, value, exists)] : [],
  );

const layerRank = (layer: string): number => LAYERS.indexOf(layer as (typeof LAYERS)[number]);

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Layer order, then name by code point. */
export const orderEntries = (entries: readonly Entry[]): readonly Entry[] =>
  [...entries].sort((a, b) => layerRank(a.layer) - layerRank(b.layer) || compare(a.name, b.name));

export const concatCss = (cssByEntry: readonly string[]): string =>
  `${cssByEntry.map((css) => css.trimEnd()).join("\n")}\n`;

/** Drops the side-effect `import "./X.css";` lines `tsc` keeps in a `.d.ts`. */
export const stripCssImports = (dts: string): string =>
  dts.replace(/^import "\.\/[^"]+\.css";\n/gm, "");
