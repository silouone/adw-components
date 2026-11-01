import type {
  SlotBayView,
  SlotRunnerView,
  SlotsPanelLabels,
  SlotsPanelView,
  SlotWaiterView,
} from "../src/organisms/SlotsPanel/SlotsPanel";

// Hand-written view models for `<SlotsPanel/>`: its test, `<SlotsChip/>`'s test and the
// stories of both read these.

export const SLOTS_LABELS: SlotsPanelLabels = {
  slot: "SLOT",
  held: "held",
  queued: "queued",
  since: "since",
  empty: "no slot pool configured",
};

export const FOOT_TEXT =
  "a free slot goes to the most urgent waiter, not the first poller · gate exec timeout 30 min";

/** A held bay: ten of thirty minutes spent, an `ok` gauge at a third. */
export const HOLDER_OK: SlotBayView = {
  index: 2,
  holder: {
    ticketId: "adw-board-13-the-slots-dropdown-da71ba",
    head: "adw-board-13",
    gate: "test",
    pct: 33.33,
    tone: "ok",
    timeoutText: "of 30 min",
    waitText: "10m 0s",
  },
};

/** Twenty-five of thirty minutes spent. */
export const HOLDER_WARN: SlotBayView = {
  index: 0,
  holder: {
    ticketId: "adw-feat-7-other-abc",
    head: "adw-feat-7",
    gate: "gates",
    pct: 83.33,
    tone: "warn",
    timeoutText: "of 30 min",
    waitText: "25m 0s",
  },
};

/** Past the timeout: a full, `bad` gauge. */
export const HOLDER_BAD: SlotBayView = {
  index: 1,
  holder: {
    ticketId: "adw-bug-4-late-gate-c0ffee",
    head: "adw-bug-4",
    gate: "test",
    pct: 100,
    tone: "bad",
    timeoutText: "of 30 min",
    waitText: "31m 0s",
  },
};

/** A free bay with nobody waiting. */
export const FREE_BAY: SlotBayView = { index: 1, freeText: "free" };

/** A free bay that names the head of its runner's queue. */
export const FREE_BAY_NEXT: SlotBayView = { index: 1, freeText: "free · next adw-bug-1" };

export const WAITER_ONE: SlotWaiterView = {
  runId: "w1",
  ticketId: "adw-bug-1-some-title-abcdef",
  position: 1,
  head: "adw-bug-1",
  placeText: "adw-factory · bug",
  sinceText: "11:25",
  waitText: "34m 55s",
};

export const WAITER_TWO: SlotWaiterView = {
  runId: "w2",
  ticketId: "adw-bug-2-some-title-abcdef",
  position: 2,
  head: "adw-bug-2",
  placeText: "adw-factory · bug",
  sinceText: "11:40",
  waitText: "20m 0s",
};

/** A waiter whose project is unread: the place is the lane alone. */
export const WAITER_NO_PROJECT: SlotWaiterView = { ...WAITER_ONE, placeText: "bug" };

export const LOCAL_RUNNER: SlotRunnerView = {
  key: "local",
  kind: "local",
  label: "local",
  note: "this Mac",
  held: 1,
  baysTotal: 3,
  queued: 9,
  bays: [
    HOLDER_OK,
    { index: 3, freeText: "free · next adw-bug-1" },
    { index: 4, freeText: "free" },
  ],
  queue: [WAITER_ONE, WAITER_TWO],
};

export const SSH_RUNNER: SlotRunnerView = {
  key: "m1max",
  kind: "ssh",
  label: "m1max",
  note: "",
  held: 0,
  baysTotal: 2,
  queued: 1,
  bays: [
    { index: 0, freeText: "free · next adw-feat-7" },
    { index: 1, freeText: "free" },
  ],
  queue: [
    {
      runId: "w9",
      ticketId: "adw-feat-7-other-abc",
      position: 1,
      head: "adw-feat-7",
      placeText: "adw-factory · feat",
      sinceText: "10:02",
      waitText: "1h 04m",
    },
  ],
};

/** A runner with a header and nothing under it. */
export const BAYLESS_RUNNER: SlotRunnerView = {
  key: "local",
  kind: "local",
  label: "local",
  note: "",
  held: 0,
  baysTotal: 0,
  queued: 0,
  bays: [],
  queue: [],
};

/** Bays in wire order, a holder between two free rows. */
export const INTERLEAVED_RUNNER: SlotRunnerView = {
  ...BAYLESS_RUNNER,
  held: 1,
  baysTotal: 3,
  bays: [
    { index: 0, freeText: "free" },
    { ...HOLDER_WARN, index: 1 },
    { index: 2, freeText: "free" },
  ],
};

/** A holder whose id carries no number: the head is the id whole. */
export const HOLDER_BARE_ID: SlotBayView = {
  index: 0,
  holder: {
    ticketId: "run-abc",
    head: "run-abc",
    gate: "test",
    pct: 3.33,
    tone: "ok",
    timeoutText: "of 30 min",
    waitText: "1m 0s",
  },
};

/** A queue whose array order is not its position order: the panel never re-sorts. */
export const OUT_OF_ORDER_RUNNER: SlotRunnerView = {
  ...BAYLESS_RUNNER,
  queued: 2,
  queue: [WAITER_TWO, WAITER_ONE],
};

export const TWO_RUNNERS: SlotsPanelView = {
  runners: [LOCAL_RUNNER, SSH_RUNNER],
  footText: FOOT_TEXT,
};

export const ONE_RUNNER: SlotsPanelView = { runners: [LOCAL_RUNNER], footText: FOOT_TEXT };

export const NO_POOL: SlotsPanelView = { runners: [], footText: FOOT_TEXT };
