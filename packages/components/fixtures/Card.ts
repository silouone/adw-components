import type { CardGateHost, CardLabels, CardView } from "../src/organisms/Card/Card";
import { BASE_RED_LABELS } from "./BaseRedChip";
import { WAIT_LABEL, WAITING as WAITING_THREAD } from "./StepThread";

// Hand-written view models for `<Card/>`: its test and its stories read these.

/** The words of the card, as the host words them. */
export const CARD_LABELS: CardLabels = {
  baseRed: BASE_RED_LABELS,
  copy: "copy",
  copied: "copied",
  waitingForSlot: WAIT_LABEL,
  builtBy: "built by",
  bothProviders: "claude and codex",
  reranLocally: "re-ran on this mac",
  ranOn: "ran on",
  queuedOn: "queued for a slot on",
  attemptsOldestFirst: "attempts, oldest first",
  ship: "ship",
};

export const PR_URL = "https://github.com/acme/widgets/pull/7";

const CLAUDE = { name: "claude", glyph: "✳" } as const;
const CODEX = { name: "codex", glyph: "◉" } as const;
export { CLAUDE, CODEX };

const ATTEMPT = {
  runId: "run-2026-09-14-100000",
  cls: "dot green",
  href: "/run?id=run-2026-09-14-100000",
  title: "green",
  glyph: "✓",
} as const;

/** A finished green card on a single attempt, the base the other cards override. */
export const GREEN_CARD: CardView = {
  ticketId: "adw-render-03",
  health: "green",
  live: false,
  paused: false,
  blockedCause: false,
  beacon: "✓",
  beaconTone: "green",
  nowText: "success",
  nowTone: "ok",
  nowTitle: "success",
  timeText: "1m 05s",
  hue: "210",
  idHref: "/run?id=run-2026-09-14-100000",
  headShort: "adw-render-03",
  headTitle: "adw-render-03",
  title: "Render 03",
  providers: [CLAUDE],
  baseRed: undefined,
  gateHost: undefined,
  ago: "5m ago",
  autoLine: undefined,
  steps: {
    n: 2,
    gaps: 1,
    waits: false,
    dots: [
      { cls: "st-dot ph-build k-agent", tip: "build · build\n1m 05s\nagent" },
      { cls: "st-dot ph-test k-gate gap", tip: "test · test\n3.0s\ngate run" },
    ],
  },
  cost: { value: "~$0.67", title: "estimated at sonnet-4.5 pricing", estNone: false },
  rounds: undefined,
  timeTitle: "wall clock, run-start to run-end",
  tokens: { value: "1.23M", title: "1,234,567 tokens processed" },
  pr: undefined,
  latestPr: undefined,
  attempts: [ATTEMPT],
  shipTitle: undefined,
};

/** A running card: the live sweep, a gate in flight, the live beacon. */
export const LIVE_CARD: CardView = {
  ...GREEN_CARD,
  health: "live",
  live: true,
  beacon: "●",
  beaconTone: "live",
  nowText: "running test (slot 1, 1m)",
  nowTone: "run",
  nowTitle: "running test (slot 1, 1m)",
  timeText: "4m 12s",
  ago: "4m ago",
  cost: { value: "—", title: "no estimate for this run", estNone: true },
  tokens: { value: "~412k", title: "412,000 tokens processed, still counting" },
  attempts: [{ ...ATTEMPT, cls: "dot live", title: "running", glyph: "◌" }],
};

/** A blocked card: the cause line in the bad tone, a ship chip for the green gates. */
export const BLOCKED_CARD: CardView = {
  ...GREEN_CARD,
  health: "blocked",
  blockedCause: true,
  beacon: "✕",
  beaconTone: "blocked",
  nowText: "npm error 404 Not Found",
  nowTone: "bad",
  nowTitle: 'ticket "t" node "provision": npm warn x\nnpm error 404 Not Found',
  shipTitle: "adw publish --target acme --ticket adw-render-03",
  attempts: [{ ...ATTEMPT, cls: "dot blocked", title: "blocked", glyph: "✕" }],
};

/** A deferred card: warn tone, the agent's reason on hover. */
export const DEFERRED_CARD: CardView = {
  ...GREEN_CARD,
  health: "deferred",
  beacon: "↩",
  beaconTone: "deferred",
  nowText: "deferred",
  nowTone: "warn",
  nowTitle: "deferred — the plan is missing",
};

/** A card waiting for a slot: the queue sentence in full and a trailing wait dot. */
export const WAITING_CARD: CardView = {
  ...GREEN_CARD,
  health: "waiting",
  beacon: "⏳",
  beaconTone: "waiting",
  nowText: "waiting for a slot (3rd in line, since 10:04, behind sabado-278)",
  nowTone: "wait",
  nowTitle: "waiting for a slot (3rd in line, since 10:04, behind sabado-278)",
  steps: WAITING_THREAD,
  timeText: "—",
  ago: "just now",
};

/** A paused card: dimmed, the beacon at rest. */
export const PAUSED_CARD: CardView = {
  ...GREEN_CARD,
  health: "paused",
  paused: true,
  beacon: "⏸",
  beaconTone: "paused",
  nowText: "paused",
  nowTone: "wait",
  nowTitle: "paused",
};

/** A gate host the run ran on remotely. */
export const REMOTE_HOST: CardGateHost = { host: "m1max", gates: ["test"], fellBack: [] };
/** A remote host that was unreachable: both gates re-ran locally. */
export const FELL_BACK_HOST: CardGateHost = {
  host: "m1max",
  gates: ["test"],
  fellBack: ["test", "lint"],
};
/** A remote host that has run no gate yet. */
export const QUEUED_HOST: CardGateHost = { host: "m1max", gates: [], fellBack: [] };
/** Gates that all ran here: the card draws no chip. */
export const LOCAL_HOST: CardGateHost = { host: "local", gates: [], fellBack: [] };

/** A card of the same shape with some fields replaced. */
export const cardWith = (overrides: Partial<CardView>): CardView => ({
  ...GREEN_CARD,
  ...overrides,
});
