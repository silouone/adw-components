import type { AppHeaderTab } from "../src/templates/AppHeaderFrame/AppHeaderFrame";

// Hand-written view models for `<AppHeaderFrame/>`: its test and its stories read these.

export const APP_HEADER_BRAND = "adw factory";

export const APP_HEADER_TABS: readonly AppHeaderTab[] = [
  { route: "board", label: "Board" },
  { route: "backlog", label: "Backlog" },
];

/** The caller folds the token into every link; the frame only asks for the href. */
export const appHeaderHref = (route: string): string => `/${route}?token=t%20k`;
