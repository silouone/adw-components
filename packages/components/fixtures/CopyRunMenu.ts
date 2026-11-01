import type { CopyRunMenuLabels, CopyRunMenuView } from "../src/molecules/CopyRunMenu/CopyRunMenu";

// Hand-written view models for `<CopyRunMenu/>`: its test and its stories read these.

export const LABELS: CopyRunMenuLabels = {
  copy: "copy",
  pick: "copy the run command — pick where the gate runs",
  thisMac: "this mac",
  line: "dispatch line",
};

/** A project with no gate host: one click copies. */
export const NO_HOSTS: CopyRunMenuView = {
  hasMenu: false,
  lastLine: "adw run acme-7",
  items: [{ host: undefined, line: "adw run acme-7" }],
};

/** A project with two gate hosts: « this mac » first, then each host. */
export const WITH_HOSTS: CopyRunMenuView = {
  hasMenu: true,
  lastLine: "adw run acme-7",
  items: [
    { host: undefined, line: "adw run acme-7" },
    { host: "mac-mini", line: "adw run acme-7 --gate-host mac-mini" },
    { host: "build-box", line: "adw run acme-7 --gate-host build-box" },
  ],
};
