// Hand-written view models for `<BacklogFrame/>`: its test and its stories read these.

/** The page measures its sticky head and hands the offset down as a custom property. */
export const BACKLOG_STYLE: Readonly<Record<string, string | number>> = {
  "--bl-head-top": "48px",
};

export const BACKLOG_NOTICE = "stream dropped, showing the last frame";

/** Stand-ins for the page pieces (the project chips, the next-up row) that live above this layer. */
export const BACKLOG_CHIPS: readonly string[] = ["adw-factory", "adw-components", "adw-site"];

export const BACKLOG_HERO = "next up: adw-components-14 · pages join the library";
