// Hand-written view models for `<ResultTab/>`: a merged PR, a PR known only by its link, a live
// run, a blocked run, a deferred run and a run that taught something.

import type { ResultTabLabels, ResultView } from "../src/organisms/ResultTab/ResultTab";
import { MERGED, prOf } from "./PrChips";

export const RESULT_TAB_LABELS: ResultTabLabels = {
  pullRequest: "pull request",
  factoryReview: "factory review",
  standards: "standards",
  spec: "spec",
  findings: "findings",
  whyItStopped: "why it stopped",
  deferred: "deferred",
  whatItTaught: "what it taught",
};

const REVIEW_NOTE = "a hard or wrong finding sends the work to review-fix (≤2)";

/** A green run whose PR merged: the CI and validation chips, the state word, the review read. */
export const RESULT_TAB_MERGED: ResultView = {
  pullRequest: { kind: "chips", pr: prOf(undefined, MERGED), state: "merged" },
  review: { standards: "read", spec: "—", findings: "1 hard · 2 wrong", note: REVIEW_NOTE },
  taught: { ledger: "—", artifacts: [] },
};

/** A green run whose PR the wire has not described: the number links, the state says open. */
export const RESULT_TAB_LINK: ResultView = {
  ...RESULT_TAB_MERGED,
  pullRequest: {
    kind: "link",
    number: 9,
    url: "https://github.com/silouone/adw-factory/pull/9",
    state: "open",
  },
  review: { standards: "—", spec: "—", findings: "—", note: REVIEW_NOTE },
};

/** A live run: no PR yet, no review, the ledger not written. */
export const RESULT_TAB_LIVE: ResultView = {
  pullRequest: { kind: "text", text: "opens when the tail is green" },
  review: { standards: "—", spec: "—", findings: "—", note: REVIEW_NOTE },
  taught: { ledger: "written at run-end", artifacts: [] },
};

/** A finished run with no PR. */
export const RESULT_TAB_NO_PR: ResultView = {
  ...RESULT_TAB_LIVE,
  pullRequest: { kind: "text", text: "none" },
  taught: { ledger: "—", artifacts: [] },
};

export const BLOCKED_REASON = "line one\nline two\nline three";

/** A run blocked on a failing node, with its full reason. */
export const RESULT_TAB_BLOCKED: ResultView = {
  ...RESULT_TAB_NO_PR,
  stopped: { kind: "blocked", cause: "node-fail", node: "build", reason: BLOCKED_REASON },
};

/** A run set aside until the next dispatch. */
export const RESULT_TAB_DEFERRED: ResultView = {
  ...RESULT_TAB_NO_PR,
  stopped: { kind: "deferred", rule: "queued — the next dispatch starts it again" },
};

/** A green run whose run-end ledger counted friction, failures and learnings. */
export const RESULT_TAB_TAUGHT: ResultView = {
  ...RESULT_TAB_MERGED,
  taught: {
    ledger: "2 friction · 1 failures · 3 learnings",
    artifacts: [{ node: "plan", file: "plan.md" }],
  },
};
