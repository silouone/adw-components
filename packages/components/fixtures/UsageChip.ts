import type { GaugeView, UsageChipView } from "../src/molecules/UsageChip/UsageChip";

// Hand-written view models for `<UsageChip/>`: its test and its stories read these.

export const USAGE_LABEL = "usage";

export const SESSION: GaugeView = {
  key: "session",
  short: "session",
  pct: 14,
  tone: "ok",
  countdown: "4h 12m",
};

export const WEEK: GaugeView = {
  key: "week",
  short: "week",
  pct: 30,
  tone: "ok",
  countdown: "3d 2h",
};

export const WEEK_WARN: GaugeView = { ...WEEK, pct: 72, tone: "warn" };

export const SESSION_BAD: GaugeView = { ...SESSION, pct: 91, tone: "bad", countdown: "58m" };

/** A gauge that reports no reset: the countdown is empty. */
export const SESSION_NO_RESET: GaugeView = { ...SESSION, countdown: "" };

/** A gauge at both ends of its range. */
export const EMPTY_GAUGE: GaugeView = { ...SESSION, pct: 0, tone: "ok" };
export const FULL_GAUGE: GaugeView = { ...SESSION, pct: 100, tone: "bad" };

/** A countdown text with markup in it, to check it renders as text. */
export const MARKUP_COUNTDOWN: GaugeView = { ...SESSION, countdown: "A&B<script>" };

export const LOADING: UsageChipView = { kind: "loading" };
export const UNAVAILABLE: UsageChipView = { kind: "unavailable" };
export const TWO_GAUGES: UsageChipView = { kind: "gauges", gauges: [SESSION, WEEK] };
export const ONE_GAUGE: UsageChipView = { kind: "gauges", gauges: [WEEK] };
export const WARN_GAUGES: UsageChipView = { kind: "gauges", gauges: [SESSION_BAD, WEEK_WARN] };
