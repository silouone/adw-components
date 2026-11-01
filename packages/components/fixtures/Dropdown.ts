// Hand-written view models for `<Dropdown/>`: its test and its stories read these.

/** The chip's face and the panel's body for the first of two dropdowns. */
export const ALPHA = { id: "a", chip: "alpha", panel: "panel a" } as const;

/** The second dropdown, to check that only one is pinned at a time. */
export const BETA = { id: "b", chip: "beta", panel: "panel b" } as const;

/** Rows a story can pour into a panel. */
export const PANEL_ROWS: readonly string[] = ["adw-factory", "adw-components", "adw-tokens"];
