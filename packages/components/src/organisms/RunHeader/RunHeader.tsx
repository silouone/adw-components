import "./RunHeader.css";

// `<RunHeader/>`: the status pill + the stat chips of the run screen, then the verdict and the
// work left behind when the run is blocked.
//
// Pure: a `RunHeaderView` (the pill, the chips, the failed node, the verdict) and the run's
// identity in, markup out; a running run's elapsed time arrives already formatted in a chip.
// The subscription-headroom chip is not a slot here: the app header carries it. A chip click
// lands outside the bar's toggle gesture only because the toggle ignores clicks on controls.

import { Ci, type CiView } from "../../molecules/PrChips/PrChips";
import { type ViewTab, ViewTabs, type RunViewTab } from "../../molecules/ViewTabs/ViewTabs";
import { VerdictEvidence, type VerdictView } from "../../atoms/Verdict/Verdict";

/** The run's own identity: what the bar names, never a derived figure. */
export interface RunIdentity {
  readonly ticketId: string;
  /** A maintenance round: its kind is drawn next to the title. */
  readonly round?: "rebase" | "ci";
  readonly factory?: { readonly sha: string; readonly dirty: boolean };
  /** The failing gate of a blocked run, when one is known. */
  readonly gate?: string;
}

/** The status pill: its colour class (`ok`, `bad`, `live`, `dim`) and its text. */
export interface RunStatusView {
  readonly cls: string;
  readonly text: string;
  /** The failing node of a blocked run; absent draws no failure chip. */
  readonly failedNode?: string;
}

export interface RunHeaderChip {
  readonly key: string;
  readonly value: string;
  readonly title?: string;
}

export interface RunHeaderView extends RunStatusView {
  readonly chips: readonly RunHeaderChip[];
  readonly verdict?: VerdictView;
}

/** A blocked run's uncommitted work. */
export interface LeftBehind {
  readonly files: number;
  readonly path: string;
}

/** The run's PR CI verdict, from GitHub: it sits beside the pill and never replaces it. */
export interface RunPrChip {
  readonly ci: CiView;
  /** The PR has moved past the commit this run pushed. */
  readonly laterHead?: boolean;
}

export interface RunHeaderLabels {
  /** The tooltip of the failure chip when it opens the failing node. */
  readonly failureChip: string;
  readonly rebaseRound: string;
  readonly ciRound: string;
  readonly dirty: string;
  readonly laterHead: string;
  readonly laterHeadTitle: string;
  /** After the count, for one file: `uncommitted file left in the workspace`. */
  readonly uncommittedOne: string;
  /** After the count, for several files. */
  readonly uncommittedMany: string;
  /** Appended to the verdict's cause when it is salvageable. */
  readonly salvageable: string;
  /** The accessible name of the view tablist. */
  readonly tabsLabel: string;
  readonly tabs: readonly ViewTab[];
}

export interface RunHeaderProps {
  readonly header: RunIdentity;
  readonly head: RunHeaderView;
  /** Absent renders nothing, never a zero. */
  readonly leftBehind?: LeftBehind;
  /** Every provider that ran; empty or absent renders no label. */
  readonly providers?: readonly string[];
  readonly prChip?: RunPrChip;
  /** The rail key of a blocked run's failing node: the failure chip opens the dock there.
   * Absent, the chip only states the failure. */
  readonly failureScope?: string;
  /** A dropped stream: the root takes `stale` and the notice renders above it. */
  readonly stale?: boolean;
  readonly staleNotice?: string;
  /** On the board's stage: the root takes `ch-embed`. */
  readonly embedded?: boolean;
  readonly tab: RunViewTab;
  readonly labels: RunHeaderLabels;
  readonly onViewTab: (tab: RunViewTab) => void;
  readonly onFullScreen: () => void;
  readonly onScope: (scope: string) => void;
}

/** Whether a click on a collapsible bar should toggle it: a click inside a `button`, `a` or
 * `input` keeps that control's own action.
 *
 */
export function isToggleClick(target: EventTarget | null): boolean {
  if (target === null) return false;
  const closest = (target as { readonly closest?: unknown }).closest;
  return !(typeof closest === "function" && closest.call(target, "button,a,input") !== null);
}

/** `✕ <node> · <gate>`: where a blocked run failed, never why — the reason lives in the dock.
 *
 */
export function FailureChip({
  node,
  gate,
  failureScope,
  title,
  onScope,
}: {
  readonly node: string;
  readonly gate?: string;
  readonly failureScope?: string;
  /** The tooltip of the chip when it is a button. */
  readonly title: string;
  readonly onScope: (scope: string) => void;
}) {
  const text = `✕ ${node}${gate !== undefined ? ` · ${gate}` : ""}`;
  if (failureScope === undefined) return <span class="fv-chip ch-fail">{text}</span>;
  return (
    <button
      type="button"
      class="fv-chip ch-fail"
      title={title}
      onClick={() => {
        onScope(failureScope);
      }}
    >
      {text}
    </button>
  );
}

export function RunHeader({
  header,
  head,
  leftBehind,
  providers = [],
  prChip,
  failureScope,
  stale = false,
  staleNotice,
  embedded = false,
  tab,
  labels,
  onViewTab,
  onFullScreen,
  onScope,
}: RunHeaderProps) {
  const failedNode = head.failedNode;
  const showWhy = leftBehind !== undefined || head.verdict !== undefined;

  return (
    <>
      {stale && staleNotice !== undefined && (
        <p class="stale-notice ch-stale-notice" role="status">
          {staleNotice}
        </p>
      )}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: same reason */}
      <header
        class={`ch${stale ? " stale" : ""}${embedded ? " ch-embed" : ""}`}
        onClick={(e) => {
          if (isToggleClick(e.target)) onFullScreen();
        }}
      >
        <span class="chev ch-chev" aria-hidden="true">
          ▾
        </span>
        <div class="ch-l">
          <span class={`st ch-st ${head.cls}`}>{head.text}</span>
          {prChip !== undefined && (
            <span class="tc-pr ch-pr">
              <Ci ci={prChip.ci} />
              {prChip.laterHead === true && (
                <span class="pr-later ch-later" title={labels.laterHeadTitle}>
                  {labels.laterHead}
                </span>
              )}
            </span>
          )}
          <h2>{header.ticketId}</h2>
          {providers.length > 0 && <span class="ch-providers">{providers.join(" + ")}</span>}
          {header.round !== undefined && (
            <span class="round-kind ch-round">
              {header.round === "rebase" ? labels.rebaseRound : labels.ciRound}
            </span>
          )}
          {header.factory !== undefined && (
            <span class="sha ch-sha" title={header.factory.sha}>
              {header.factory.sha.slice(0, 7)}
            </span>
          )}
          {header.factory?.dirty === true && (
            <span class="badge dirty ch-dirty">{labels.dirty}</span>
          )}
          {failedNode !== undefined && (
            <FailureChip
              node={failedNode}
              {...(header.gate !== undefined ? { gate: header.gate } : {})}
              {...(failureScope !== undefined ? { failureScope } : {})}
              title={labels.failureChip}
              onScope={onScope}
            />
          )}
        </div>
        <ViewTabs active={tab} tabs={labels.tabs} label={labels.tabsLabel} onPick={onViewTab} />
        <div class="ch-r">
          {head.chips.map((c) => (
            <span
              key={c.key}
              class="chip ch-chip"
              {...(c.title !== undefined ? { title: c.title } : {})}
            >
              <i>{c.key}</i>
              <b>{c.value}</b>
            </span>
          ))}
        </div>
      </header>
      {showWhy && (
        <div class="ch-why">
          {head.verdict !== undefined && (
            <VerdictEvidence verdict={head.verdict} salvageableLabel={labels.salvageable} />
          )}
          {leftBehind !== undefined && (
            <div class="left-behind ch-left-behind">
              {leftBehind.files}{" "}
              {leftBehind.files === 1 ? labels.uncommittedOne : labels.uncommittedMany}
              {" — "}
              <code>{leftBehind.path}</code>
            </div>
          )}
        </div>
      )}
    </>
  );
}
