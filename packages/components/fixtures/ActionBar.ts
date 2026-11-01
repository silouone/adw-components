// Hand-written view models for `<ActionBar/>`: one bar per state of a ticket.

import type {
  ActionBarLabels,
  ActionBarView,
  ActionSpec,
} from "../src/organisms/ActionBar/ActionBar";

export const ACTION_BAR_LABELS: ActionBarLabels = { copied: "copied" };

export const FULL_ID = "sabado-276-strip-tags-0a1b2c";
const SCOPE = { target: "sabado", ticket: FULL_ID };

const OPEN: ActionSpec = { id: "open", glyph: "▸", verb: "open run", tone: "dim", mode: "open" };

const REQUEUE: ActionSpec = {
  id: "requeue",
  glyph: "↻",
  verb: "requeue",
  tone: "live",
  mode: "post",
  post: "requeue",
  busyLabel: "requeuing…",
  armedLabel: "requeue sabado-276? it goes back in line",
};

const RETRY: ActionSpec = {
  id: "retry",
  glyph: "⟲",
  verb: "retry",
  tone: "live",
  mode: "post",
  post: "retry",
  busyLabel: "retrying…",
  armedLabel: "retry sabado-276? start over from plan on a fresh worktree",
};

/** A live ticket mid-node: pause and kill on the left, open run on the right. */
export const ACTION_BAR_RUNNING: ActionBarView = {
  left: [
    {
      id: "pause",
      glyph: "⏸",
      verb: "pause",
      tone: "live",
      mode: "post",
      post: "pause",
      armedLabel: "pause sabado-276 after strip-tags?",
    },
    {
      id: "kill",
      glyph: "✕",
      verb: "kill",
      tone: "bad",
      mode: "post",
      post: "kill",
      busyLabel: "killing…",
      armedLabel: "kill sabado-276? the ticket goes to blocked",
    },
  ],
  right: [OPEN],
  scope: SCOPE,
};

/** The same ticket once a pause was requested and has not landed. */
export const ACTION_BAR_PAUSING: ActionBarView = {
  ...ACTION_BAR_RUNNING,
  left: [
    { id: "pausing", glyph: "⏸", verb: "pausing…", tone: "dim", mode: "disabled" },
    ...ACTION_BAR_RUNNING.left.slice(1),
  ],
};

export const ACTION_BAR_PAUSED: ActionBarView = {
  left: [
    {
      id: "resume",
      glyph: "▶",
      verb: "resume",
      tone: "live",
      mode: "post",
      post: "resume",
      armedLabel: "resume sabado-276 at 14:30?",
    },
  ],
  right: [OPEN],
  scope: SCOPE,
};

/** Blocked with green gates and no PR: publish copies on one click. */
export const ACTION_BAR_PUBLISH: ActionBarView = {
  left: [
    {
      id: "publish",
      glyph: "⧉",
      verb: "publish",
      tone: "ok",
      mode: "copy",
      dashed: true,
      copy: `adw publish --target sabado --ticket ${FULL_ID}`,
    },
    REQUEUE,
    RETRY,
  ],
  right: [OPEN],
  scope: SCOPE,
};

export const ACTION_BAR_BLOCKED: ActionBarView = {
  left: [REQUEUE, RETRY],
  right: [OPEN],
  scope: SCOPE,
};

/** Blocked and resumable: continue re-enters at the failed node. */
export const ACTION_BAR_CONTINUE: ActionBarView = {
  left: [
    REQUEUE,
    {
      id: "continue",
      glyph: "⏵",
      verb: "continue",
      tone: "live",
      mode: "post",
      post: "continue",
      busyLabel: "continuing…",
      armedLabel: "continue sabado-276? re-enter at the failed node on the kept worktree",
    },
    RETRY,
  ],
  right: [OPEN],
  scope: SCOPE,
};

export const ACTION_BAR_DEFERRED: ActionBarView = {
  left: [
    {
      id: "boost",
      glyph: "⇡",
      verb: "boost",
      tone: "live",
      mode: "post",
      post: "boost",
      busyLabel: "boosting…",
      armedLabel: "boost sabado-276 to the front of the queue?",
    },
    RETRY,
  ],
  right: [OPEN],
  scope: SCOPE,
};

/** A published ticket: nothing to act on, a link to the PR beside open run. */
export const ACTION_BAR_WITH_PR: ActionBarView = {
  left: [],
  right: [
    OPEN,
    {
      id: "pr",
      glyph: "⇗",
      verb: "PR #12",
      tone: "dim",
      mode: "link",
      href: "https://github.com/acme/sabado/pull/12",
    },
  ],
  scope: SCOPE,
};
