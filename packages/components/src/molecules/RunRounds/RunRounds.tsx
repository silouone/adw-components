import "./RunRounds.css";

// `<RunRounds/>`: the run screen's side of the maintenance-round family. A round links back
// to the build run it belongs to; the build run lists its rounds with outcome, duration and
// cost. The words arrive as `labels`, every run's address from `hrefFor`.

/** One round of a build run: duration and cost arrive already formatted. */
export interface RoundRowView {
  readonly runId: string;
  readonly round: "rebase" | "ci" | "feedback";
  readonly state: "running" | "finished" | "unknown";
  readonly outcome?: string;
  readonly dur: string;
  readonly cost: string;
}

export interface RunRoundsView {
  /** Set on a round's screen: the build run it belongs to. */
  readonly build?: string;
  /** Set on the build run's screen: its rounds, newest first. */
  readonly rounds: readonly RoundRowView[];
}

/** The words of the family. */
export interface RunRoundsLabels {
  /** The link from a round back to its build run. */
  readonly back: string;
  /** A rebase round's link text. */
  readonly rebase: string;
  /** The link text of every other round (CI, feedback). */
  readonly ci: string;
  /** What a running round shows in place of its outcome. */
  readonly live: string;
}

export interface RunRoundsProps {
  readonly family: RunRoundsView | undefined;
  readonly labels: RunRoundsLabels;
  /** The address of a run's screen. */
  readonly hrefFor: (runId: string) => string;
}

export function RunRounds({ family, labels, hrefFor }: RunRoundsProps) {
  if (family === undefined) return null;
  return (
    <>
      {family.build !== undefined && (
        <a class="round-back" href={hrefFor(family.build)}>
          {labels.back}
        </a>
      )}
      {family.rounds.length > 0 && (
        <div class="round-list">
          {family.rounds.map((r) => (
            <div key={r.runId} class="round-row">
              <a href={hrefFor(r.runId)}>{r.round === "rebase" ? labels.rebase : labels.ci}</a>
              <span>{r.state === "running" ? labels.live : (r.outcome ?? r.state)}</span>
              <span>{r.dur}</span>
              <span>{r.cost}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
