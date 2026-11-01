import type {
  RunScopeLabels,
  RunSummaryView,
} from "../src/organisms/RunScopeSection/RunScopeSection";

// Hand-written view models for `<RunScopeSection/>`: its test and its stories read these.

export const LABELS: RunScopeLabels = {
  ticketTitle: "initial ticket",
  reportTitle: "agent final output",
  notAvailable: "not available",
  noReason: "no reason recorded",
  contentMismatch: "content mismatch",
  notPersisted: "prompt not persisted",
  mismatch: "prompt mismatch",
  expected: "expected",
  actual: "actual",
  bytes: "bytes",
  hash: "hash",
};

export const SUMMARY: RunSummaryView = {
  ticket: { status: "ok", text: "# Add the dock\n\nA **bold** claim with `code`." },
  report: { status: "ok", text: "Built the dock.\n\n- one\n- two" },
};

export const GAPS: RunSummaryView = {
  ticket: { status: "not-persisted", reason: "ENOSPC" },
  report: {
    status: "mismatch",
    expectedBytes: 100,
    expectedHash: "aaa",
    actualBytes: 90,
    actualHash: "bbb",
  },
};
