import type {
  CardTally,
  SectionLabels,
  SectionView,
} from "../src/organisms/SectionView/SectionView";
import { BLOCKED_CARD, CARD_LABELS, GREEN_CARD, LIVE_CARD, WAITING_CARD } from "./Card";
import {
  BLOCKED_ROW,
  GREEN_ROW,
  LEDGER_ROW_LABELS,
  SLOT_HOLDER_ROW,
  WAITING_ROW,
} from "./LedgerRow";

// Hand-written view models for `<SectionView/>`: its test and its stories read these.

/** The words of the section, as the host words them. */
export const SECTION_LABELS: SectionLabels = {
  unrecorded: "unrecorded",
  live: "live",
  running: "running",
  waitingForSlot: "waiting for a slot",
  paused: "paused",
  projectPaused: "project paused",
  pauseProject: "Pause project",
  resumeProject: "Resume project",
  pauseAsk: "Pause",
  resumeAsk: "Resume",
  autoContinueOn: "Auto-continue on",
  autoContinueOff: "Auto-continue off",
  turnAutoContinueOffFor: "Turn auto-continue off for",
  turnAutoContinueOnFor: "Turn auto-continue on for",
  legacyBefore: "pre-dates the",
  legacyCode: "target",
  legacyAfter: "field — backfillable",
  tickets: "tickets",
  green: "green",
  blocked: "blocked",
  withoutRunEnd: "without a run-end",
  noRate: "—",
  empty: "nothing matches the active filter in this project",
  caret: "▸",
  card: CARD_LABELS,
  row: LEDGER_ROW_LABELS,
};

export const TARGET = "acme-widgets";

const TALLY: CardTally = { total: 3, green: 0, blocked: 1, unfinished: 2, live: 1 };

/** One ticket of each kind, as both its card and its ledger row. */
export const ITEMS: SectionView["items"] = [
  {
    ticketId: "adw-live-01",
    card: { ...LIVE_CARD, ticketId: "adw-live-01", headShort: "adw-live-01" },
    row: {
      ...SLOT_HOLDER_ROW,
      card: { ...SLOT_HOLDER_ROW.card, ticketId: "adw-live-01", headShort: "adw-live-01" },
    },
  },
  {
    ticketId: "adw-blocked-02",
    card: { ...BLOCKED_CARD, ticketId: "adw-blocked-02", headShort: "adw-blocked-02" },
    row: {
      ...BLOCKED_ROW,
      card: { ...BLOCKED_ROW.card, ticketId: "adw-blocked-02", headShort: "adw-blocked-02" },
    },
  },
  {
    ticketId: "adw-waiting-03",
    card: { ...WAITING_CARD, ticketId: "adw-waiting-03", headShort: "adw-waiting-03" },
    row: {
      ...WAITING_ROW,
      card: { ...WAITING_ROW.card, ticketId: "adw-waiting-03", headShort: "adw-waiting-03" },
    },
  },
];

/** A project holding a live run, its tickets drawn as cards. */
export const SECTION_CARDS: SectionView = {
  target: TARGET,
  legacy: false,
  liveTally: TALLY,
  visibleTally: TALLY,
  pauseTally: { paused: 0, projectPaused: false },
  activityTally: { running: 1, waiting: 1 },
  autoOn: false,
  initialOpen: true,
  hiddenByProj: false,
  forcedOpen: false,
  layout: "cards",
  items: ITEMS,
};

/** The same project in ledger mode. */
export const SECTION_LEDGER: SectionView = { ...SECTION_CARDS, layout: "ledger" };

/** A project whose pause is on, one ticket paused, automatic Continue on. */
export const SECTION_PAUSED: SectionView = {
  ...SECTION_CARDS,
  pauseTally: { paused: 1, projectPaused: true },
  autoOn: true,
};

/** The tickets that pre-date the `target` field: no pause controls, a note instead. */
export const SECTION_LEGACY: SectionView = {
  ...SECTION_CARDS,
  target: "legacy",
  legacy: true,
  liveTally: { total: 1, green: 1, blocked: 0, unfinished: 0, live: 0 },
  visibleTally: { total: 1, green: 1, blocked: 0, unfinished: 0, live: 0 },
  activityTally: { running: 0, waiting: 0 },
  initialOpen: false,
  items: [
    {
      ticketId: "adw-old-01",
      card: { ...GREEN_CARD, ticketId: "adw-old-01", headShort: "adw-old-01" },
      row: {
        ...GREEN_ROW,
        card: { ...GREEN_ROW.card, ticketId: "adw-old-01", headShort: "adw-old-01" },
      },
    },
  ],
};

/** A health filter that hides every ticket, while the unfiltered tally still holds the live run. */
export const SECTION_FILTERED_OUT: SectionView = {
  ...SECTION_CARDS,
  visibleTally: { total: 0, green: 0, blocked: 0, unfinished: 0, live: 0 },
  items: [],
};

/** A project that is collapsed by the user but forced open by the project filter. */
export const SECTION_COLLAPSED: SectionView = { ...SECTION_CARDS, initialOpen: false };
