import "./RunPage.css";

import { UpNext } from "../../atoms/UpNext/UpNext";
import type { UpNextEntry } from "../../atoms/UpNext/UpNext";
import {
  RunRounds,
  type RunRoundsLabels,
  type RunRoundsView,
} from "../../molecules/RunRounds/RunRounds";
import type { RunViewTab } from "../../molecules/ViewTabs/ViewTabs";
import { Dock, type DockFailure, type DockLabels, type DockView } from "../../organisms/Dock/Dock";
import { GanttStrip, type GanttStripView } from "../../organisms/GanttStrip/GanttStrip";
import {
  HoverCard,
  type HoverAt,
  type HoverCardLabels,
  type Hovered,
  type StepFaces,
} from "../../organisms/HoverCard/HoverCard";
import { Journey, type JourneyLabels, type JourneyView } from "../../organisms/Journey/Journey";
import {
  Lanes,
  type LanesLabels,
  type LanesView,
  type TimelineLayout,
} from "../../organisms/Lanes/Lanes";
import { Ledger, type LedgerLabels, type LedgerView } from "../../organisms/Ledger/Ledger";
import {
  type LeftBehind,
  RunHeader,
  type RunHeaderLabels,
  type RunHeaderView,
  type RunIdentity,
  type RunPrChip,
} from "../../organisms/RunHeader/RunHeader";
import type { RunSummaryView } from "../../organisms/RunScopeSection/RunScopeSection";
import { RunPageFrame } from "../../templates/RunPageFrame/RunPageFrame";

// `<RunPage/>`: the run screen as a view. It renders one `RunPageView` and reports through
// `RunPageActions`; the run container owns every signal, key and measurement. It composes the run
// page frame with the header, the rounds, the lanes, ledger or journey, the hover card and the
// dock. No clock reaches it: the header figures arrive already derived, and `viewNow` is the clamped
// clock an open step's bar runs to. Every word arrives in `view.labels`.

export interface RunPageLabels {
  /** The words of the crumb after its arrow, on the run route. */
  readonly crumb: string;
  readonly header: RunHeaderLabels;
  readonly rounds: RunRoundsLabels;
  readonly lanes: LanesLabels;
  readonly ledger: LedgerLabels;
  readonly journey: JourneyLabels;
  readonly hover: HoverCardLabels;
  readonly dock: DockLabels;
  /** The up-next strip's lead-in word. */
  readonly upNext: string;
  /** The tooltip of the strip's failure chip. */
  readonly failureTitle: string;
}

/** Present once the first frame arrived. */
export interface RunScreenView {
  readonly identity: RunIdentity;
  readonly head: RunHeaderView;
  readonly strip: GanttStripView;
  readonly providers: readonly string[];
  readonly failureScope?: string;
  /** The blocked run's failure, for the dock's overview banner. */
  readonly failure?: DockFailure;
  readonly leftBehind?: LeftBehind;
  readonly prChip?: RunPrChip;
  readonly rounds: RunRoundsView | undefined;
  readonly layout: TimelineLayout;
  readonly lanes: LanesView;
  readonly ledger: LedgerView;
  readonly journey: JourneyView;
  readonly faces: StepFaces;
  readonly upNext: readonly UpNextEntry[];
  /** The clamped clock an open step's bar runs to. */
  readonly viewNow: number;
  readonly dock: DockView;
  readonly summary: RunSummaryView;
}

export interface RunPageView {
  readonly labels: RunPageLabels;
  /** On the board's stage: no crumb back to the board. */
  readonly embedded: boolean;
  /** The stream dropped, embedded or not. */
  readonly stale: boolean;
  /** The way back to the board; shown when not embedded. */
  readonly gridUrl: string;
  readonly error?: string;
  readonly staleNotice?: string;
  readonly run?: RunScreenView;
  readonly scope: string | undefined;
  readonly shut: boolean;
  readonly full: boolean;
  readonly md: boolean;
  readonly tab: RunViewTab;
  readonly hovered?: Hovered;
  readonly viewport: { readonly w: number; readonly h: number };
  readonly zoom: number;
}

export interface RunPageActions {
  readonly onScope: (scope: string) => void;
  readonly onClose: () => void;
  readonly onHover: (at: HoverAt | null) => void;
  readonly onViewTab: (tab: RunViewTab) => void;
  readonly onFullScreen: () => void;
  readonly onShutDock: () => void;
  readonly onMarkdownToggle: () => void;
  /** The address of a run's screen, for the rounds strip. */
  readonly hrefFor: (runId: string) => string;
}

export interface RunPageProps {
  readonly view: RunPageView;
  readonly actions: RunPageActions;
}

export function RunPage({ view, actions }: RunPageProps) {
  const { run, scope, full, tab, labels } = view;
  const open = (r: RunScreenView) => (
    <RunPageFrame
      {...(view.embedded ? {} : { crumbHref: view.gridUrl, crumbLabel: labels.crumb })}
      {...(view.error === undefined ? {} : { notice: view.error })}
      full={full}
      shut={view.shut}
      embedded={view.embedded}
      dockOpen={scope !== undefined}
      strip={
        <GanttStrip
          header={r.identity}
          strip={r.strip}
          {...(r.failureScope === undefined ? {} : { failureScope: r.failureScope })}
          failureTitle={labels.failureTitle}
          onFullScreen={actions.onFullScreen}
          onScope={actions.onScope}
        />
      }
      header={
        <>
          <RunHeader
            header={r.identity}
            head={r.head}
            providers={r.providers}
            {...(view.staleNotice === undefined
              ? {}
              : { stale: true, staleNotice: view.staleNotice })}
            embedded={view.embedded}
            {...(r.leftBehind === undefined ? {} : { leftBehind: r.leftBehind })}
            {...(r.prChip === undefined ? {} : { prChip: r.prChip })}
            {...(r.failureScope === undefined ? {} : { failureScope: r.failureScope })}
            tab={tab}
            labels={labels.header}
            onViewTab={actions.onViewTab}
            onFullScreen={actions.onFullScreen}
            onScope={actions.onScope}
          />
          <RunRounds family={r.rounds} labels={labels.rounds} hrefFor={actions.hrefFor} />
        </>
      }
      stage={
        <>
          {tab === "gantt" && (
            <>
              <Lanes
                layout={r.layout}
                lanes={r.lanes}
                faces={r.faces}
                scope={scope}
                stale={view.stale}
                docked={!view.embedded}
                grow={!view.embedded && view.shut && !full}
                labels={labels.lanes}
                onScope={actions.onScope}
                onHover={actions.onHover}
              />
              <UpNext entries={r.upNext} label={labels.upNext} />
            </>
          )}
          {tab === "ledger" && (
            <Ledger
              ledger={r.ledger}
              upNext={r.upNext}
              faces={r.faces}
              now={r.viewNow}
              scope={scope}
              labels={labels.ledger}
              onScope={actions.onScope}
              onHover={actions.onHover}
            />
          )}
          {tab === "journey" && (
            <Journey
              journey={r.journey}
              upNext={r.upNext}
              faces={r.faces}
              scope={scope}
              stale={view.stale}
              labels={labels.journey}
              onScope={actions.onScope}
              onHover={actions.onHover}
            />
          )}
        </>
      }
      card={
        <HoverCard
          faces={r.faces}
          hovered={view.hovered}
          viewport={view.viewport}
          zoom={view.zoom}
          labels={labels.hover}
        />
      }
      dock={
        <Dock
          {...(r.failure === undefined ? {} : { failure: r.failure })}
          view={r.dock}
          summary={r.summary}
          scope={scope}
          shut={view.shut}
          full={full}
          md={view.md}
          labels={labels.dock}
          onScope={actions.onScope}
          onClose={actions.onClose}
          onShutDock={actions.onShutDock}
          onFullScreen={actions.onFullScreen}
          onMarkdownToggle={actions.onMarkdownToggle}
        />
      }
    />
  );
  return run === undefined ? (
    <RunPageFrame
      {...(view.embedded ? {} : { crumbHref: view.gridUrl, crumbLabel: labels.crumb })}
      {...(view.error === undefined ? {} : { notice: view.error })}
      full={full}
      shut={view.shut}
      embedded={view.embedded}
    />
  ) : (
    open(run)
  );
}
