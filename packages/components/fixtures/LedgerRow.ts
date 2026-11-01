import type { LedgerRowLabels, LedgerRowView } from "../src/organisms/LedgerRow/LedgerRow";
import { BASE_RED, BASE_RED_LABELS } from "./BaseRedChip";
import { BLOCKED_CARD, GREEN_CARD, LIVE_CARD, PAUSED_CARD, PR_URL, WAITING_CARD } from "./Card";
import { CHANGES_REQUESTED, prOf } from "./PrChips";

// Hand-written view models for `<LedgerRow/>`: its test and its stories read these.

/** The words of the row, as the host words them. */
export const LEDGER_ROW_LABELS: LedgerRowLabels = {
  baseRed: BASE_RED_LABELS,
  builtBy: "built by",
  attemptsOldestFirst: "attempts, oldest first",
};

export const TICKET_ID = "adw-board-07-a-ledger-view";
export const RUN_HREF = "/run?id=run-2026-09-14-100000&token=tok-abc";

/** One agent bar, one gate bar and the hatched wait for a slot. */
const STRIP: LedgerRowView["strip"] = {
  segments: [
    { cls: "tc-ph ph-build k-agent", place: { left: "0%", width: "55%" }, title: "build · 1m 05s" },
    { cls: "tc-ph ph-test k-det", place: { left: "55%", width: "30%" }, title: "test · 3.0s" },
    { cls: "tc-ph wait", place: { left: "85%", width: "15%" }, title: "waiting for a slot" },
  ],
};

/** A finished green row on a single attempt, the base the other rows override. */
export const GREEN_ROW: LedgerRowView = {
  card: {
    ...GREEN_CARD,
    ticketId: TICKET_ID,
    idHref: RUN_HREF,
    headShort: TICKET_ID,
    headTitle: "A ledger view for the board",
    timeText: "12.3s",
    attempts: GREEN_CARD.attempts.map((a) => ({ ...a, href: RUN_HREF })),
  },
  lane: "feat",
  strip: STRIP,
  where: "this mac",
  costText: "~$1.50",
  costTitle: undefined,
  tokText: "2.24M",
};

/** A run holding slot 1: the live beacon and the gate in flight. */
export const SLOT_HOLDER_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: {
    ...GREEN_ROW.card,
    health: LIVE_CARD.health,
    live: true,
    beacon: LIVE_CARD.beacon,
    beaconTone: LIVE_CARD.beaconTone,
    nowTone: LIVE_CARD.nowTone,
    nowText: "running test (slot 1, 3m)",
    nowTitle: "running test (slot 1, 3m)",
    attempts: LIVE_CARD.attempts.map((a) => ({ ...a, href: RUN_HREF })),
  },
  where: "slot 1",
};

/** A run third in line for a slot. */
export const WAITING_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: {
    ...GREEN_ROW.card,
    health: WAITING_CARD.health,
    beacon: WAITING_CARD.beacon,
    beaconTone: WAITING_CARD.beaconTone,
    nowTone: WAITING_CARD.nowTone,
    nowText: "waiting for a slot (3rd in line, since 10:04, behind run-a, run-b, run-c)",
    nowTitle: "waiting for a slot (3rd in line, since 10:04, behind run-a, run-b, run-c)",
  },
  where: "queue 3",
};

/** A run whose gates ran on another host. */
export const REMOTE_ROW: LedgerRowView = { ...GREEN_ROW, where: "m1max" };

/** A paused run: the beacon at rest, the muted row. */
export const PAUSED_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: {
    ...GREEN_ROW.card,
    health: PAUSED_CARD.health,
    paused: true,
    beacon: PAUSED_CARD.beacon,
    beaconTone: PAUSED_CARD.beaconTone,
    nowTone: PAUSED_CARD.nowTone,
    nowText: "paused at assemble-test · 3m",
    nowTitle: "paused at assemble-test · 3m",
  },
};

/** A blocked run: the cause in the now line. */
export const BLOCKED_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: {
    ...GREEN_ROW.card,
    health: BLOCKED_CARD.health,
    beacon: BLOCKED_CARD.beacon,
    beaconTone: BLOCKED_CARD.beaconTone,
    nowTone: BLOCKED_CARD.nowTone,
    nowText: "gate test failed",
    nowTitle: "gate test failed",
    attempts: BLOCKED_CARD.attempts.map((a) => ({ ...a, href: RUN_HREF })),
  },
};

const FIRST_ATTEMPT = {
  runId: "run-2026-09-14-090000",
  cls: "dot blocked",
  href: "/run?id=run-2026-09-14-090000&token=tok-abc",
  title: "blocked",
  glyph: "✕",
} as const;

/** Two attempts, oldest first: a blocked one, then the green latest. */
export const TWO_ATTEMPTS_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: { ...GREEN_ROW.card, attempts: [FIRST_ATTEMPT, ...GREEN_ROW.card.attempts] },
};

/** Two attempts whose latest is still running. */
export const RUNNING_RETRY_ROW: LedgerRowView = {
  ...SLOT_HOLDER_ROW,
  card: { ...SLOT_HOLDER_ROW.card, attempts: [FIRST_ATTEMPT, ...SLOT_HOLDER_ROW.card.attempts] },
};

/** A PR with passing CI and a reviewer's change request: the ledger draws the compact labels. */
export const PR_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: { ...GREEN_ROW.card, pr: prOf(undefined, CHANGES_REQUESTED) },
};

/** A run that links a PR but has no chips for it: the bare link with its state. */
export const LATEST_PR_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: {
    ...GREEN_ROW.card,
    latestPr: { url: "https://example.test/pr/42", number: 42, state: "merged" },
  },
};

/** The same link without a state. */
export const LATEST_PR_BARE_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: { ...GREEN_ROW.card, latestPr: { url: PR_URL, number: 7 } },
};

/** The latest run was built on a red base. */
export const BASE_RED_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: { ...GREEN_ROW.card, baseRed: BASE_RED },
};

/** A row whose cost carries a tooltip. */
export const COSTED_ROW: LedgerRowView = {
  ...GREEN_ROW,
  costTitle: "~$2.50 with the rounds",
};

/** A provider the glyph table does not know: no mark, but the lane tag stays. */
export const NO_PROVIDER_ROW: LedgerRowView = {
  ...GREEN_ROW,
  card: { ...GREEN_ROW.card, providers: [] },
};
