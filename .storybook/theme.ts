export const THEMES = ["dark", "light", "system"] as const;

export type Theme = (typeof THEMES)[number];

const isTheme = (theme: string): theme is Theme => (THEMES as readonly string[]).includes(theme);

/** The `data-theme` value of a theme; `undefined` for `system`, which sets none. */

export const themeAttribute = (theme: string): "light" | "dark" | undefined => {
  if (!isTheme(theme)) {
    throw new Error(`themeAttribute: unknown theme '${theme}' (expected ${THEMES.join(" | ")})`);
  }
  return theme === "system" ? undefined : theme;
};

/** Edge: sets or removes `data-theme` on the document root. */
export const applyTheme = (root: HTMLElement, theme: string): void => {
  const attribute = themeAttribute(theme);
  if (attribute === undefined) delete root.dataset.theme;
  else root.dataset.theme = attribute;
};

export const themeToolbar = {
  name: "Theme",
  description: "Colour theme of the stories",
  toolbar: {
    title: "Theme",
    icon: "circlehollow",
    dynamicTitle: true,
    items: THEMES.map((value) => ({ value, title: value })),
  },
} as const;
