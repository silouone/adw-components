// Every glyph the library draws for a provider, runner, section, slot or
// view tab — one module, so a glyph is defined once.

export type ResolvedProvider = "claude" | "codex";

export type HostKind = "local" | "ssh" | "e2b";

export type SectionKey =
  | "blocked"
  | "waiting"
  | "ready"
  | "running"
  | "in-flight"
  | "other"
  | "closed";

export type FocusTab = "run" | "walk" | "gates" | "tools" | "cost" | "route" | "result";

export const PROVIDER_GLYPH: Readonly<Record<ResolvedProvider, string>> = {
  claude: "✳",
  codex: "◉",
};

/** The Apple mark (private-use U+F8FF) for the Mac-hosted runners, a hexagon
 * for the remote sandbox. */
export const RUNNER_GLYPH = (kind: HostKind): string => (kind === "e2b" ? "⬡" : "");

export const SECTION_GLYPH: Readonly<Record<SectionKey, string>> = {
  blocked: "✕",
  waiting: "◷",
  ready: "●",
  running: "◌",
  "in-flight": "◐",
  other: "◇",
  closed: "✓",
};

export const NEUTRAL_GLYPH = "◌";

export const SLOT_GLYPH: Readonly<Record<HostKind, string>> = {
  local: "▣",
  ssh: "⇄",
  e2b: "☁",
};

export const BAY_GLYPH = { holder: "●", agent: "✳", waiter: "⏳" } as const;

export const VIEW_TAB_GLYPH: Readonly<Record<FocusTab, string>> = {
  run: "◉",
  walk: "∿",
  gates: "⊟",
  tools: "⚒",
  cost: "$",
  route: "⇶",
  result: "⇥",
};
