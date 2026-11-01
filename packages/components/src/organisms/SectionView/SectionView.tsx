import "./SectionView.css";

// `<SectionView/>`: the board's project section. The collapse flag is REAL component
// state (`useState`), initialised once from `view.initialOpen` and never reset after that,
// so a host must render it with a stable key (the project's target): that is what makes
// the instance — and its flag — survive a view update rather than being rebuilt.
//
// The project filter forces the section open via a rendered OR (`forcedOpen || open`),
// never by writing the forced value back into the state, so the section returns to its
// user-chosen collapsed/expanded state when the filter is cleared.
//
// Two distinct tallies, deliberately not the same one:
// - `liveTally` (unfiltered) drives the `live` badge, so a health filter cannot hide the one
//   thing happening right now.
// - `visibleTally` (health-filtered) drives the meter bars, the shown-ticket count and the
//   green rate.
//
// Every control is a callback; every word that is not in the view arrives as `labels`.

import { useState } from "preact/hooks";
import { ArmButton } from "../../molecules/ArmButton/ArmButton";
import { Card, type CardLabels, type CardView } from "../Card/Card";
import { LedgerRow, type LedgerRowLabels, type LedgerRowView } from "../LedgerRow/LedgerRow";

export interface CardTally {
  readonly total: number;
  readonly green: number;
  readonly blocked: number;
  readonly unfinished: number;
  /** Not one of the three filter buckets — a live run always also counts as
   * `unfinished` (no run-end yet). Exposed for the section rail's
   * `● N live` marker and the live-hue slice of the health meter. */
  readonly live: number;
}

export type PauseVerb = "pause" | "resume" | "kill" | "requeue" | "boost" | "continue" | "retry";

export interface PauseScope {
  readonly target: string;
  /** Absent = the whole project. */
  readonly ticket?: string;
}

export interface SectionView {
  readonly target: string;
  readonly legacy: boolean;
  /** Unfiltered tally — drives the default-open rule and the `live` badge. */
  readonly liveTally: CardTally;
  /** Health-filtered tally — drives the meter, the count and the green rate. */
  readonly visibleTally: CardTally;
  readonly pauseTally: {
    readonly paused: number;
    readonly projectPaused: boolean;
  };
  readonly activityTally: {
    readonly running: number;
    readonly waiting: number;
  };
  readonly autoOn: boolean;
  /** Mount-time open flag: `!legacy || live > 0`. */
  readonly initialOpen: boolean;
  readonly hiddenByProj: boolean;
  readonly forcedOpen: boolean;
  readonly layout: "cards" | "ledger";
  /** The visible tickets, one entry each; `card` or `row` per `layout`. */
  readonly items: readonly {
    readonly ticketId: string;
    readonly card: CardView;
    readonly row: LedgerRowView;
  }[];
}

/** The words of the section that its view does not carry. */
export interface SectionLabels {
  /** The heading of a section with no target, e.g. `unrecorded`. */
  readonly unrecorded: string;
  /** After the live count, e.g. `live`. */
  readonly live: string;
  /** After the running count, e.g. `running`. */
  readonly running: string;
  /** After the waiting count, e.g. `waiting for a slot`. */
  readonly waitingForSlot: string;
  /** After the paused count, e.g. `paused`. */
  readonly paused: string;
  readonly projectPaused: string;
  readonly pauseProject: string;
  readonly resumeProject: string;
  /** Before the target in the armed pause question, e.g. `Pause`. */
  readonly pauseAsk: string;
  /** Before the target in the armed resume question, e.g. `Resume`. */
  readonly resumeAsk: string;
  readonly autoContinueOn: string;
  readonly autoContinueOff: string;
  /** Before the target in the armed question that turns auto-continue off. */
  readonly turnAutoContinueOffFor: string;
  /** Before the target in the armed question that turns auto-continue on. */
  readonly turnAutoContinueOnFor: string;
  /** The legacy note reads `<before> <code>…</code> <after>`. */
  readonly legacyBefore: string;
  readonly legacyCode: string;
  readonly legacyAfter: string;
  /** After the shown-ticket count, e.g. `tickets`. */
  readonly tickets: string;
  /** After the green count, in the meter's tooltip and the rate, e.g. `green`. */
  readonly green: string;
  readonly blocked: string;
  /** After the unfinished count, e.g. `without a run-end`. */
  readonly withoutRunEnd: string;
  /** Shown instead of the rate when no ticket is visible. */
  readonly noRate: string;
  /** Shown when the active filter hides every ticket of the project. */
  readonly empty: string;
  /** The caret of the disclosure. */
  readonly caret: string;
  readonly card: CardLabels;
  readonly row: LedgerRowLabels;
}

export interface SectionViewProps {
  readonly view: SectionView;
  readonly labels: SectionLabels;
  /** Pause or resume a scope (the container posts it with the token). */
  readonly onPause: (verb: PauseVerb, scope: PauseScope) => Promise<string | undefined>;
  /** Turn a project's automatic Continue on or off. */
  readonly onContinue: (target: string, on: boolean) => Promise<string | undefined>;
  /** Copies a ticket id (the container owns the clipboard). */
  readonly onCopy: (text: string) => void;
  /** The selected ticket, drawn as an outline on its card. */
  readonly selected?: string | null;
  /** Called with a ticket id when its card or row body is clicked. */
  readonly onSelect?: (ticketId: string) => void;
}

export function SectionView({
  view: v,
  labels,
  onPause,
  onContinue,
  onCopy,
  selected = null,
  onSelect,
}: SectionViewProps) {
  const { liveTally, visibleTally, pauseTally, activityTally, autoOn } = v;
  const [open, setOpen] = useState(v.initialOpen);
  const pct = (n: number) => (visibleTally.total > 0 ? (n / visibleTally.total) * 100 : 0);
  const displayOpen = v.forcedOpen || open;

  return (
    <details
      class={v.layout === "ledger" ? "grp lg grp-ledger" : "grp"}
      open={displayOpen}
      hidden={v.hiddenByProj}
      data-proj={v.target}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is a
       native, keyboard-operable disclosure control (implicit ARIA role
       "button") — biome's static-element check just doesn't recognise it.
       The onClick only takes over the DEFAULT native toggle behavior;
       keyboard activation (Enter/Space) still dispatches the same click
       event, so nothing accessible is lost. */}
      <summary
        class="grp-hd"
        onClick={(e) => {
          // Fully controlled — never the browser's own default toggle: a native `toggle`
          // event also fires when Preact itself flips the `open` PROP (e.g. the project
          // filter forcing this section open), not only on a real user click. `onClick` +
          // `preventDefault` only ever reacts to an actual user gesture.
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <i class="caret">{labels.caret}</i>
        <b>{v.legacy ? labels.unrecorded : v.target}</b>
        {liveTally.live > 0 && (
          <span class="grp-live">
            <i class="beacon grp-beacon" />
            {liveTally.live} {labels.live}
          </span>
        )}
        {liveTally.live > 0 && (
          <span class="grp-activity">
            {activityTally.running} {labels.running} · {activityTally.waiting}{" "}
            {labels.waitingForSlot}
          </span>
        )}
        {pauseTally.paused > 0 && (
          <span class="grp-paused">
            {liveTally.live > 0 ? "· " : ""}
            {pauseTally.paused} {labels.paused}
          </span>
        )}
        {pauseTally.projectPaused && <span class="grp-project-paused">{labels.projectPaused}</span>}
        {!v.legacy && (
          <ArmButton
            label={pauseTally.projectPaused ? labels.resumeProject : labels.pauseProject}
            armedLabel={`${pauseTally.projectPaused ? labels.resumeAsk : labels.pauseAsk} ${v.target}?`}
            onFire={() =>
              onPause(pauseTally.projectPaused ? "resume" : "pause", { target: v.target })
            }
          />
        )}
        {!v.legacy && (
          <ArmButton
            label={autoOn ? labels.autoContinueOn : labels.autoContinueOff}
            armedLabel={`${autoOn ? labels.turnAutoContinueOffFor : labels.turnAutoContinueOnFor} ${v.target}?`}
            onFire={() => onContinue(v.target, !autoOn)}
          />
        )}
        {v.legacy && (
          <span class="legacy-note">
            {labels.legacyBefore} <code>{labels.legacyCode}</code> {labels.legacyAfter}
          </span>
        )}
        <span class="grp-n">
          <span class="grp-shown">{visibleTally.total}</span> {labels.tickets}
        </span>
        <span
          class="meter"
          title={`${visibleTally.green} ${labels.green} · ${visibleTally.blocked} ${labels.blocked} · ${visibleTally.unfinished} ${labels.withoutRunEnd}`}
        >
          <u class="m-ok" style={`width:${pct(visibleTally.green).toFixed(2)}%`} />
          <u class="m-bad" style={`width:${pct(visibleTally.blocked).toFixed(2)}%`} />
          <u class="m-none" style={`width:${pct(visibleTally.unfinished).toFixed(2)}%`} />
        </span>
        <span class="grp-rate">
          {visibleTally.total > 0
            ? `${Math.round(pct(visibleTally.green))}% ${labels.green}`
            : labels.noRate}
        </span>
      </summary>
      {v.layout === "ledger" ? (
        <div class="lrs">
          {v.items.map((it) => (
            <LedgerRow
              key={it.ticketId}
              view={it.row}
              labels={labels.row}
              selected={selected === it.ticketId}
              {...(onSelect === undefined ? {} : { onSelect })}
            />
          ))}
        </div>
      ) : (
        <div class="grid grp-grid">
          {v.items.map((it) => (
            <Card
              key={it.ticketId}
              view={it.card}
              labels={labels.card}
              onCopy={onCopy}
              selected={selected === it.ticketId}
              {...(onSelect === undefined ? {} : { onSelect })}
            />
          ))}
        </div>
      )}
      <p class="grp-empty" hidden={visibleTally.total > 0}>
        {labels.empty}
      </p>
    </details>
  );
}
