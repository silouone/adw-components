import "./Badge.css";

// `<RoundBadge/>` / `<WatchdogBadge/>`: the round and watchdog badge pair. Two call
// sites — a lane's drawn boxes and a drawer's card body — share this one file rather
// than each carrying its own copy.

/** Attempt `round` of `of`. */
export interface RoundView {
  readonly round: number;
  readonly of: number;
}

/** The words around the numbers: `<attempt> N <of> M`. */
export interface RoundLabels {
  readonly attempt: string;
  readonly of: string;
}

/** Why a lane's watchdog tripped. */
export interface WatchdogView {
  readonly reason: string;
}

export function RoundBadge({
  round,
  labels,
}: {
  readonly round: RoundView | undefined;
  readonly labels: RoundLabels;
}) {
  if (round === undefined) return null;
  return (
    <span class="badge round badge-round">
      {labels.attempt} {round.round} {labels.of} {round.of}
    </span>
  );
}

export function WatchdogBadge({
  watchdog,
  label,
}: {
  readonly watchdog: WatchdogView | undefined;
  /** The lead-in before the reason, e.g. the words for "lane stalled". */
  readonly label: string;
}) {
  if (watchdog === undefined) return null;
  return (
    <span class="badge watchdog">
      {label}: {watchdog.reason}
    </span>
  );
}
