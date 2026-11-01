import type { RoundLabels } from "../src/atoms/Badge/Badge";

// Hand-written view models for `<RoundBadge/>` / `<WatchdogBadge/>`: their test and
// stories read these.

/** The words the host passes around the attempt numbers. */
export const ROUND_LABELS: RoundLabels = { attempt: "attempt", of: "of" };

/** The lead-in the host passes before a watchdog's reason. */
export const WATCHDOG_LABEL = "lane stalled";
