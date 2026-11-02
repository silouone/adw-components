import "./BoardPage.css";

import type { AutonomyChip } from "../../molecules/AutonomyChips/AutonomyChips";
import type { DropdownChange } from "../../molecules/Dropdown/Dropdown";
import {
  StageHeader,
  type Crumb,
  type StageHeaderLabels,
} from "../../molecules/StageHeader/StageHeader";
import type { BoardView } from "../../molecules/ViewToggle/ViewToggle";
import { PhaseLegend, type PhaseLegendLabels } from "../../atoms/PhaseLegend/PhaseLegend";
import type { PauseAction } from "../../organisms/ActionBar/ActionBar";
import {
  BoardChips,
  type BoardChipsDropdown,
  type BoardChipsLabels,
  type BoardChipsView,
} from "../../organisms/BoardChips/BoardChips";
import type { BoardFilters, OnFilter } from "../../organisms/FiltersPanel/FiltersPanel";
import {
  FocusPanel,
  type FocusPanelLabels,
  type FocusPanelView,
} from "../../organisms/FocusPanel/FocusPanel";
import { type FocusBody, focusBodyOf } from "../../organisms/FocusPanel/focusTabs";
import {
  type FocusRailLabels,
  type FocusRailTab,
  FocusRail,
  type FocusTab,
} from "../../organisms/FocusRail/FocusRail";
import {
  type NetworkRunner,
  type NetworkTally,
  NetworkTree,
  type NetworkTreeLabels,
} from "../../organisms/NetworkTree/NetworkTree";
import {
  RunnerRail,
  type RunnerRailLabels,
  type RunnerRailView,
} from "../../organisms/RunnerRail/RunnerRail";
import {
  type PauseScope,
  type PauseVerb,
  SectionView,
  type SectionLabels,
} from "../../organisms/SectionView/SectionView";
import { BoardGrid } from "../../templates/BoardGrid/BoardGrid";
import { ShellFrame } from "../../templates/ShellFrame/ShellFrame";
import type { ComponentChildren } from "preact";

// `<BoardPage/>`: the board as a pure view. It takes everything the board shows as one
// `BoardPageView` and every gesture as a `BoardPageActions` callback, composes the shell frame, the
// grid and the organisms, and imports no signal module. The container reads the signals, builds the
// view, and writes the signals from the actions. The board route's header chips mount in the app
// header, which stays in the app root across routes, so they are a second export (`BoardPageChips`)
// of the same view and actions. Every word is in `view.labels`.

export type { BoardFilters };

export interface BoardPageLabels {
  readonly network: NetworkTreeLabels;
  readonly runnerRail: RunnerRailLabels;
  readonly focusRail: FocusRailLabels;
  readonly focusPanel: FocusPanelLabels;
  readonly stage: StageHeaderLabels;
  readonly phaseLegend: PhaseLegendLabels;
  readonly section: SectionLabels;
  /** The paragraph shown when data has loaded and there are no runs. */
  readonly empty: string;
  /** The message shown when the filters hide every ticket. */
  readonly noMatch: string;
  /** The ledger's column names, one cell each. */
  readonly columns: readonly string[];
}

/** Everything the grid shows. */
export interface BoardGridView {
  readonly notices: readonly string[];
  /** Data has loaded and there are no views. */
  readonly empty: boolean;
  readonly phases: readonly string[];
  /** The ledger header row replaces the card grid's legend-only head. */
  readonly ledger: boolean;
  readonly sections: readonly SectionView[];
  /** The filters hide every card. */
  readonly noMatch: boolean;
}

export interface ShellView {
  readonly stale: boolean;
  readonly staleNotice?: string;
  readonly hostOpen: boolean;
  readonly net: readonly NetworkRunner[];
  readonly tally: NetworkTally;
  readonly runnerRail: RunnerRailView;
  readonly hostFilter: string;
  readonly projFilter: string;
  readonly selected: string | null;
  readonly expandedRunners: ReadonlySet<string>;
  readonly collapsedProjects: ReadonlySet<string>;
  readonly focusTab: FocusTab;
  readonly focusOpen: boolean;
  readonly focusTabs: readonly FocusRailTab[];
  /** Undefined = no selected card. */
  readonly focus?: {
    readonly panel: FocusPanelView;
    readonly body: FocusBody;
  };
  readonly crumbs: readonly Crumb[];
  /** Set iff the stage shows a run for the focused card. */
  readonly run?: { readonly runId: string; readonly label: string };
}

export interface BoardPageView {
  readonly labels: BoardPageLabels;
  readonly token: string;
  readonly grid: BoardGridView;
  readonly shell: ShellView;
}

export interface BoardPageChipsView {
  readonly labels: BoardChipsLabels;
  readonly chips: BoardChipsView;
  readonly autonomy: Readonly<Record<string, AutonomyChip>> | undefined;
  readonly filters: BoardFilters;
  readonly boardView: BoardView;
  /** The dropdown whose panel is showing, by hover or pin. */
  readonly open: BoardChipsDropdown | undefined;
  /** The dropdown pinned open, if any. */
  readonly pinned: BoardChipsDropdown | undefined;
}

export interface BoardPageActions {
  readonly onSelect: (ticketId: string) => void;
  readonly onFilter: OnFilter;
  readonly onWindow: (days: string, pinned: boolean) => void;
  readonly onView: (kind: BoardView) => void;
  readonly onDropdown: (id: BoardChipsDropdown, change: DropdownChange) => void;
  readonly onToggleRail: (open: boolean) => void;
  readonly onHoverRunner: (key: string | undefined) => void;
  readonly onToggleRunner: (key: string) => void;
  readonly onToggleProject: (key: string) => void;
  readonly onFocusTab: (tab: FocusTab) => void;
  readonly onFocusOpen: (open: boolean) => void;
  readonly onOpenRun: (ticketId: string) => void;
  /** The slots panel's row: open the run and let the dropdown go. */
  readonly onOpenSlotRun: (ticketId: string) => void;
  readonly onStage: (stage: "board" | "run") => void;
  readonly onCloseRun: () => void;
  readonly onFullScreen: () => void;
  readonly onAction: PauseAction;
  readonly onPause: (verb: PauseVerb, scope: PauseScope) => Promise<string | undefined>;
  readonly onContinue: (target: string, on: boolean) => Promise<string | undefined>;
  readonly onCopy: (text: string) => void;
}

export interface BoardPageProps {
  readonly view: BoardPageView;
  readonly actions: BoardPageActions;
  /** The run screen on the stage; the container mounts it. */
  readonly runSlot?: ComponentChildren;
}

export function BoardPage({ view, actions, runSlot }: BoardPageProps) {
  const { labels, grid, shell } = view;
  const { focus } = shell;
  const rail1 = shell.hostOpen ? (
    <NetworkTree
      net={shell.net}
      tally={shell.tally}
      labels={labels.network}
      hostFilter={shell.hostFilter}
      projFilter={shell.projFilter}
      selected={shell.selected}
      expandedRunners={shell.expandedRunners}
      collapsedProjects={shell.collapsedProjects}
      onFilter={actions.onFilter}
      onToggleRail={actions.onToggleRail}
      onToggleRunner={actions.onToggleRunner}
      onToggleProject={actions.onToggleProject}
      onOpenRun={actions.onOpenRun}
    />
  ) : (
    <RunnerRail
      view={shell.runnerRail}
      labels={labels.runnerRail}
      hostFilter={shell.hostFilter}
      expandedRunners={shell.expandedRunners}
      onHoverRunner={actions.onHoverRunner}
      onFilter={actions.onFilter}
      onToggleRail={actions.onToggleRail}
      onToggleRunner={actions.onToggleRunner}
    />
  );
  const panel =
    focus === undefined ? undefined : (
      <FocusPanel
        view={focus.panel}
        labels={labels.focusPanel}
        token={view.token}
        onFocusTab={actions.onFocusTab}
        onFocusOpen={actions.onFocusOpen}
        onAction={actions.onAction}
        onCopy={actions.onCopy}
        onStage={actions.onStage}
        density="rail"
      >
        {focusBodyOf(focus.body)}
      </FocusPanel>
    );
  const rail2 = (
    <FocusRail
      selected={shell.selected}
      tab={shell.focusTab}
      open={shell.focusOpen}
      tabs={shell.focusTabs}
      labels={labels.focusRail}
      panel={panel}
      onFocusTab={actions.onFocusTab}
      onFocusOpen={actions.onFocusOpen}
    />
  );
  const stageActions = {
    labels: labels.stage,
    onCloseRun: actions.onCloseRun,
    onFullScreen: actions.onFullScreen,
    onCopy: actions.onCopy,
  };
  const board = (
    <BoardGrid
      notices={grid.notices}
      {...(grid.empty ? { empty: labels.empty } : {})}
      legend={
        grid.sections.length > 0 ? (
          <PhaseLegend phases={grid.phases} labels={labels.phaseLegend} />
        ) : undefined
      }
      {...(grid.ledger && grid.sections.length > 0 ? { columns: labels.columns } : {})}
      {...(grid.sections.length > 0 && grid.noMatch ? { noMatch: labels.noMatch } : {})}
    >
      {grid.sections.length > 0
        ? grid.sections.map((v) => (
            <SectionView
              key={v.target}
              view={v}
              labels={labels.section}
              selected={shell.selected}
              onSelect={actions.onSelect}
              onPause={actions.onPause}
              onContinue={actions.onContinue}
              onCopy={actions.onCopy}
            />
          ))
        : undefined}
    </BoardGrid>
  );
  return (
    <ShellFrame
      rail1={rail1}
      rail2={rail2}
      rail1Open={shell.hostOpen}
      rail2Open={shell.focusOpen}
      stale={shell.stale}
      {...(shell.staleNotice === undefined ? {} : { staleNotice: shell.staleNotice })}
      stage={
        shell.run !== undefined ? (
          <>
            <StageHeader crumbs={shell.crumbs} run={shell.run} {...stageActions} />
            {runSlot}
          </>
        ) : (
          <>
            <StageHeader crumbs={shell.crumbs} {...stageActions} />
            {board}
          </>
        )
      }
    />
  );
}

export interface BoardPageChipsProps {
  readonly view: BoardPageChipsView;
  readonly actions: BoardPageActions;
}

export function BoardPageChips({ view, actions }: BoardPageChipsProps) {
  return (
    <BoardChips
      view={view.chips}
      labels={view.labels}
      autonomy={view.autonomy}
      filters={view.filters}
      boardView={view.boardView}
      open={view.open}
      pinned={view.pinned}
      onDropdown={actions.onDropdown}
      onFilter={actions.onFilter}
      onWindow={actions.onWindow}
      onView={actions.onView}
      onOpenRun={actions.onOpenSlotRun}
    />
  );
}
