// Hand-written view models for `<CostTab/>`: a finished ticket with three attempts (the ci
// round never priced) and a run whose summary never reached the wire.

import type { CostTabLabels, CostView } from "../src/organisms/CostTab/CostTab";

export const COST_TAB_LABELS: CostTabLabels = {
  thisRun: "this run",
  estCost: "est. cost",
  tokens: "tokens",
  turns: "turns",
  byStage: "by stage",
  agent: "agent",
  ticketSoFar: "the ticket so far",
  ticketTotal: "ticket total",
};

/** Build $1.00, a rebase round $0.25, a ci round never priced; 390 s of agent time in 600 s. */
export const COST_TAB: CostView = {
  thisRun: {
    usd: "~$1.00",
    tokens: "1K",
    turns: "12",
    meter: "91% cache reads · 70 in · 2K out",
  },
  byStage: {
    rows: [
      { node: "build", ms: 240_000, share: 0.4, tokens: 600, msText: "4m 00s", tokensText: "600" },
      {
        node: "repair",
        ms: 120_000,
        share: 0.2,
        tokens: 150,
        msText: "2m 00s",
        tokensText: "150",
      },
      { node: "plan", ms: 30_000, share: 0.05, msText: "30.0s", tokensText: "—" },
    ],
    agentShare: 0.65,
  },
  ticket: {
    count: "3 attempts",
    rows: [
      { kind: "ci round", ago: "5m ago", model: "—", cost: "—" },
      { kind: "rebase round", ago: "20m ago", model: "opus-4.5", cost: "~$0.25" },
      { kind: "build", ago: "1h ago", model: "sonnet-4.5", cost: "~$1.00" },
    ],
    total: "~$1.25",
    time: "agent 2m 00s · factory 1m 00s · wait 30.0s",
  },
  basis: "sonnet list price, 2026-10-01",
};

/** A run with no summary on the wire: every figure is a dash, not a zero. */
export const COST_TAB_EMPTY: CostView = {
  thisRun: { usd: "—", tokens: "—", turns: "—", meter: "—" },
  byStage: { rows: [], agentShare: 0 },
  ticket: { count: "1 attempt", rows: [], total: "—", time: "elapsed 1m 30s" },
  basis: "—",
};
