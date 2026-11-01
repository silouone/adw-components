import type {
  CodexView,
  ContribView,
  GaugeView,
  SpendView,
  UsagePanelLabels,
  UsagePanelView,
} from "../src/organisms/UsagePanel/UsagePanel";

// Hand-written view models for `<UsagePanel/>`: its test and its stories read these.

export const USAGE_PANEL_LABELS: UsagePanelLabels = {
  title: "subscription headroom",
  used: "used",
  left: "left",
  resets: "resets",
  week: "week",
  unknown: "unknown",
  loading: "reading usage…",
  unavailable: "⚠ usage unavailable",
  spendControl: "Plan spend control reached",
  spendHeading: "FACTORY SPEND BY PROVIDER",
  spendNote: "factory runs only — interactive sessions are not in the journals",
  last24h: "Last 24h",
  last7d: "Last 7d",
  tokens: "tok",
  contributing: "what's contributing",
  scope: "this machine only — not other devices or claude.ai",
};

export const SESSION_GAUGE: GaugeView = {
  key: "session",
  label: "5-hour session",
  short: "session",
  pct: 14,
  tone: "ok",
  left: 86,
  countdown: "4h 12m",
};

export const WEEK_GAUGE: GaugeView = {
  key: "week",
  label: "week · all models",
  short: "week",
  pct: 60,
  tone: "warn",
  left: 40,
  countdown: "3d 2h",
};

export const FABLE_GAUGE: GaugeView = {
  key: "weekModel",
  label: "week · Fable",
  short: "Fable",
  pct: 85,
  tone: "bad",
  left: 15,
  countdown: "3d 2h",
};

export const OPUS_GAUGE: GaugeView = {
  key: "weekModel",
  label: "week · Opus",
  short: "Opus",
  pct: 22,
  tone: "ok",
  left: 78,
  countdown: "3d 2h",
};

/** A gauge that names its reset and carries the zone as its tooltip. */
export const RESETTING_GAUGE: GaugeView = {
  ...SESSION_GAUGE,
  resetsAt: "Sep 17 at 2:50am",
  title: "resets Sep 17 at 2:50am Europe/Paris",
};

export const CODEX_PRIMARY: GaugeView = {
  key: "primary",
  label: "Codex primary",
  short: "primary",
  pct: 42,
  tone: "ok",
  left: 58,
  countdown: "",
  resetsAt: "2026-09-28T08:00:00Z",
};

export const CODEX_SECONDARY: GaugeView = {
  key: "secondary",
  label: "Codex secondary",
  short: "secondary",
  pct: 15,
  tone: "ok",
  left: 85,
  countdown: "",
  resetsAt: "2026-10-04T00:00:00Z",
};

export const CODEX_ROW_HEADER = "CODEX · business · unlimited credits · read 30s ago";

export const CODEX_BARE: CodexView = { kind: "row", header: CODEX_ROW_HEADER, gauges: [] };
export const CODEX_ONE_GAUGE: CodexView = {
  kind: "row",
  header: "CODEX · plus · read 30s ago",
  gauges: [CODEX_PRIMARY],
};
export const CODEX_TWO_GAUGES: CodexView = {
  kind: "row",
  header: "CODEX · plus · read 30s ago",
  gauges: [CODEX_PRIMARY, CODEX_SECONDARY],
};
export const CODEX_SPEND_CONTROL: CodexView = { kind: "spend-control" };

export const SPEND: SpendView = {
  rows: [
    {
      provider: "claude",
      note: "API-equivalent, you pay a subscription",
      h24: {
        kind: "figures",
        tokens: "1,500",
        runs: "2 runs",
        estimate: { text: "~$3.50", basis: "the-basis" },
      },
      d7: { kind: "nil" },
    },
    {
      provider: "codex",
      note: "API-equivalent, not your plan bill",
      h24: { kind: "figures", tokens: "700", runs: "1 run", unpriced: "700 tok unpriced" },
      d7: { kind: "nil" },
    },
  ],
};

export const SPEND_WITH_UNKNOWN: SpendView = {
  rows: [
    ...SPEND.rows,
    {
      provider: "unknown",
      h24: { kind: "figures", tokens: "9", runs: "1 run", unpriced: "9 tok unpriced" },
      d7: { kind: "figures", tokens: "9", runs: "1 run", unpriced: "9 tok unpriced" },
    },
  ],
};

export const SPEND_EMPTY: SpendView = {
  rows: [
    {
      provider: "claude",
      note: "API-equivalent, you pay a subscription",
      h24: { kind: "nil" },
      d7: { kind: "nil" },
    },
    {
      provider: "codex",
      note: "API-equivalent, not your plan bill",
      h24: { kind: "nil" },
      d7: { kind: "nil" },
    },
  ],
};

const COLS = "grid-template-columns:142px repeat(2,1fr)";

/** Two periods; the second misses a metric and one behaviour spills verbatim. */
export const CONTRIBUTING: ContribView = {
  cols: COLS,
  heads: ["Last 24h", "Last 7d"],
  rows: [
    {
      label: "requests",
      cells: [
        { kind: "value", text: "1,528" },
        { kind: "value", text: "1,940" },
      ],
    },
    {
      label: "sessions",
      cells: [
        { kind: "value", text: "23" },
        { kind: "value", text: "25" },
      ],
    },
    {
      label: "at >150k context",
      cells: [{ kind: "value", text: "75%" }, { kind: "nil" }],
    },
  ],
  tops: [],
  loose: ["Last 24h · 10% of your usage was while 4+ sessions ran in parallel"],
};

/** Skills used in the first period only; MCP in neither. */
export const CONTRIBUTING_TOPS: ContribView = {
  cols: COLS,
  heads: ["Last 24h", "Last 7d"],
  rows: [
    {
      label: "requests",
      cells: [
        { kind: "value", text: "10" },
        { kind: "value", text: "20" },
      ],
    },
  ],
  tops: [
    {
      label: "skills",
      cells: [
        [
          { name: "/prime", pct: 40 },
          { name: "/prototype", pct: 12 },
        ],
        [],
      ],
    },
  ],
  loose: [],
};

/** A skill name with markup in it, to check it renders as text. */
export const MARKUP_SKILL = '<img src=x onerror="alert(1)">';
export const CONTRIBUTING_MARKUP: ContribView = {
  cols: COLS,
  heads: ["Last 24h"],
  rows: [],
  tops: [{ label: "skills", cells: [[{ name: MARKUP_SKILL, pct: 9 }]] }],
  loose: [],
};

export const USAGE_PANEL_LOADING: UsagePanelView = {
  kind: "loading",
  codex: undefined,
  spend: undefined,
};

export const USAGE_PANEL_UNAVAILABLE: UsagePanelView = {
  kind: "unavailable",
  reason: "no usage read",
  codex: undefined,
  spend: undefined,
};

/** The panel with a reading: the `ok` arm of the view. */
export type UsagePanelOk = Extract<UsagePanelView, { readonly kind: "ok" }>;

export const USAGE_PANEL: UsagePanelOk = {
  kind: "ok",
  age: "read 30s ago",
  gauges: [SESSION_GAUGE, WEEK_GAUGE, FABLE_GAUGE, OPUS_GAUGE],
  unknownBuckets: [],
  codex: undefined,
  spend: undefined,
  contributing: undefined,
};

/** The whole panel: plan, reset line, Codex, spend and the contributing grid. */
export const USAGE_PANEL_FULL: UsagePanelOk = {
  ...USAGE_PANEL,
  plan: "You are on the Max plan.",
  gauges: [RESETTING_GAUGE, WEEK_GAUGE, FABLE_GAUGE, OPUS_GAUGE],
  codex: CODEX_TWO_GAUGES,
  spend: SPEND,
  disclaimer: "interactive sessions on other devices are not counted",
  contributing: CONTRIBUTING,
};
