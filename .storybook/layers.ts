export const LAYERS = [
  "Foundations",
  "Atoms",
  "Molecules",
  "Organisms",
  "Templates",
  "Pages",
] as const;

export type Layer = (typeof LAYERS)[number];

/** The story-title layer of each `packages/components/src/<folder>/`. */
export const LAYER_OF_FOLDER: Readonly<
  Record<"atoms" | "molecules" | "organisms" | "templates" | "pages", Layer>
> = {
  atoms: "Atoms",
  molecules: "Molecules",
  organisms: "Organisms",
  templates: "Templates",
  pages: "Pages",
};
