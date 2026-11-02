import "./BacklogPage.css";

import { Fragment, type RefObject } from "preact";
import { useRef, useState } from "preact/hooks";
import { SECTION_GLYPH, type SectionKey } from "../../glyphs";
import { BucketHint } from "../../molecules/BucketHint/BucketHint";
import {
  CopyRunMenu,
  type CopyRunMenuLabels,
  type CopyRunMenuView,
} from "../../molecules/CopyRunMenu/CopyRunMenu";
import {
  FeatureMenu,
  type FeatureMenuLabels,
  type FeatureTree,
  ProjectFeaturePanel,
} from "../../molecules/FeatureMenu/FeatureMenu";
import {
  BacklogPanel,
  type BacklogPanelLabels,
  type BacklogPanelView,
} from "../../organisms/BacklogPanel/BacklogPanel";
import type {
  BacklogRowData,
  BacklogRowLabels,
  BacklogRowView,
} from "../../organisms/BacklogRow/BacklogRow";
import { BacklogSection } from "../../organisms/BacklogSection/BacklogSection";
import {
  GraphDrawerView,
  type GraphDrawerLabels,
  type GraphDrawerModel,
  type GraphDrawerViewProps,
} from "../../organisms/GraphDrawerView/GraphDrawerView";
import {
  type DeskView,
  ReviewDesk,
  type ReviewDeskLabels,
} from "../../organisms/ReviewDesk/ReviewDesk";
import { BacklogFrame } from "../../templates/BacklogFrame/BacklogFrame";

// `<BacklogPage/>`: the backlog as a pure view. It takes everything the page shows as one
// `BacklogPageView` and every gesture as a `BacklogPageActions` callback, composes the frame and the
// organisms, and imports no signal module. The container reads the signals, builds the view, and
// writes the signals from the actions. The page keeps only the open flags of its three menus (the
// next-up copy menu, the feature picker, the drawer's feature picker). Every word is in `view.labels`.

export interface BacklogProjectChipView {
  readonly name: string;
  readonly hue: number;
  readonly on: boolean;
  readonly out: boolean;
  readonly counts: readonly {
    readonly state: "blocked" | "ready" | "running" | "in-flight" | "waiting";
    readonly n: number;
  }[];
  readonly bar?: { readonly done: number; readonly total: number } | undefined;
  readonly tree: FeatureTree;
}

export interface BacklogHeadView {
  readonly chips: {
    readonly open: number;
    readonly allOn: boolean;
    readonly projects: readonly BacklogProjectChipView[];
    readonly noStore: readonly string[];
    readonly showNoStore: boolean;
    readonly graphOn: boolean;
  };
  /** Undefined when the store has no features. */
  readonly features?:
    | {
        readonly tree: FeatureTree;
        readonly picked: string | undefined;
      }
    | undefined;
  readonly filters: {
    readonly q: string;
    readonly states: readonly {
      readonly key: SectionKey;
      readonly on: boolean;
      readonly n: number;
    }[];
    readonly lanes: readonly { readonly key: string; readonly on: boolean }[];
    readonly prios: readonly { readonly key: string; readonly on: boolean }[];
    readonly group: "state" | "wave";
    /** Undefined when the server has no PR index. */
    readonly prs?:
      | {
          readonly open: { readonly on: boolean; readonly n: number };
          readonly buckets: readonly {
            readonly key: string;
            readonly glyph: string;
            readonly label: string;
            readonly who: string;
            readonly on: boolean;
            readonly n: number;
          }[];
        }
      | undefined;
    readonly anyOn: boolean;
    readonly closedCount: number;
    readonly showClosed: boolean;
  };
}

export interface BacklogPageHeadLabels {
  readonly all: string;
  /** A project chip for a target that has no ticket store. */
  readonly noStore: (name: string) => string;
  readonly hide: string;
  readonly moreNoStore: (count: number) => string;
  readonly graph: string;
  readonly graphTitle: string;
  readonly projectFeatures: (project: string) => string;
  readonly allFeatures: string;
  readonly searchPlaceholder: string;
  readonly state: string;
  /** The word for each state chip, by section key. */
  readonly stateNames: Readonly<Record<SectionKey, string>>;
  readonly lane: string;
  readonly prio: string;
  readonly group: string;
  readonly groupBy: (group: "state" | "wave") => string;
  readonly pr: string;
  readonly prOpen: string;
  readonly prOpenTitle: string;
  readonly clear: string;
  readonly hideClosed: string;
  readonly showClosed: (count: number) => string;
  readonly barTitle: (done: number, total: number) => string;
}

export interface BacklogPageLabels {
  readonly head: BacklogPageHeadLabels;
  readonly featureMenu: FeatureMenuLabels;
  readonly copyMenu: CopyRunMenuLabels;
  readonly desk: ReviewDeskLabels;
  readonly row: BacklogRowLabels;
  /** The one-line notes under the section heads, by section key. */
  readonly sectionNotes: Readonly<Record<string, string>>;
  readonly panel: BacklogPanelLabels;
  readonly drawer: GraphDrawerLabels;
  readonly nextUp: string;
  /** The column header cells; an empty string leaves a cell blank. */
  readonly columns: readonly string[];
  readonly loading: string;
  readonly nothingMatches: string;
  readonly waveSkipped: (count: number) => string;
}

export interface BacklogRowExtras {
  readonly view: BacklogRowView;
  readonly hue: number;
  readonly cursor: boolean;
  readonly selected: boolean;
  readonly tabbable: boolean;
}

export interface BacklogDrawerView {
  readonly model: GraphDrawerModel;
  readonly query: string;
  readonly focus: string | undefined;
  readonly zoom: number;
  readonly panning: boolean;
}

export interface BacklogPageView {
  readonly token: string;
  readonly labels: BacklogPageLabels;
  readonly frame: {
    readonly stale: boolean;
    readonly staleNotice?: string | undefined;
    readonly style: Readonly<Record<string, string | number>>;
  };
  readonly head: BacklogHeadView;
  /** Undefined when the server has no PR index. */
  readonly desk?:
    | {
        readonly view: DeskView;
        readonly open: boolean;
        readonly prFilter: readonly string[];
      }
    | undefined;
  readonly hero?:
    | {
        readonly row: BacklogRowData;
        readonly hue: number;
        readonly idText: string;
        readonly dispatch: string;
        readonly hint: string | undefined;
        readonly menu: CopyRunMenuView;
        readonly project: string | undefined;
      }
    | undefined;
  readonly columns: boolean;
  readonly loading: boolean;
  readonly empty: boolean;
  readonly waveSkipped: number;
  readonly sections: readonly {
    readonly key: string;
    readonly heading?: string | undefined;
    readonly rows: readonly BacklogRowData[];
    readonly collapsed: boolean;
  }[];
  /** Every row of every section, collapsed ones too. */
  readonly rows: Readonly<Record<string, BacklogRowExtras>>;
  /** Every stored project's colour slot, for the desk. */
  readonly hues: Readonly<Record<string, number>>;
  readonly panel?:
    | {
        readonly row: BacklogRowData;
        readonly view: BacklogPanelView;
        readonly hue: number;
        readonly scrollTop: number;
        readonly project: string | undefined;
      }
    | undefined;
  /** Undefined when the drawer is shut. */
  readonly drawer?: BacklogDrawerView | undefined;
  readonly toast?: string | undefined;
}

export type BacklogDrawerActions = Pick<
  GraphDrawerViewProps,
  | "onSelect"
  | "onFeature"
  | "onToggleProject"
  | "onSoleProject"
  | "onToggleLane"
  | "onCollapseAll"
  | "onClose"
  | "onQuery"
  | "onFocus"
  | "onShowDone"
  | "onEntire"
  | "onLanes"
  | "onDock"
  | "onPreset"
  | "onZoomOut"
  | "onZoomReset"
  | "onZoomIn"
  | "onFit"
  | "onResizeStart"
  | "onPanStart"
>;

export interface BacklogPageActions {
  readonly onCopy: (text: string, label: string) => void;
  readonly onSelect: (id: string) => void;
  readonly onClosePanel: () => void;
  readonly onPanelScroll: (top: number) => void;
  readonly onPickHost: (project: string, host: string | undefined) => void;
  readonly onToggleSection: (key: string) => void;
  readonly onDesk: () => void;
  readonly onPrFilter: (bucket: string) => void;
  readonly onAllProjects: () => void;
  readonly onProjectChip: (name: string, additive: boolean) => void;
  readonly onProjectFeature: (project: string, feature: string) => void;
  readonly onFeature: (name: string) => void;
  readonly onToggleNoStore: () => void;
  readonly onToggleGraph: () => void;
  readonly onQuery: (q: string) => void;
  readonly onToggleState: (state: string) => void;
  readonly onToggleLaneFilter: (lane: string) => void;
  readonly onTogglePrio: (prio: string) => void;
  readonly onGroup: (group: "state" | "wave") => void;
  readonly onClearFilters: () => void;
  readonly onToggleClosed: () => void;
  readonly drawer: BacklogDrawerActions;
}

export interface BacklogPageProps {
  readonly view: BacklogPageView;
  readonly actions: BacklogPageActions;
  /** The container measures the sticky head through it. */
  readonly headRef?: RefObject<HTMLDivElement> | undefined;
  /** The container scrolls, fits and listens to the wheel on the drawer's canvas through it. */
  readonly canvasRef?: RefObject<HTMLDivElement> | undefined;
  /** The container focuses the drawer's search box through it. */
  readonly searchRef?: RefObject<HTMLInputElement> | undefined;
}

type Labels = BacklogPageHeadLabels;

function ProjectChips({
  view,
  labels,
  featureLabels,
  actions,
}: {
  readonly view: BacklogHeadView["chips"];
  readonly labels: Labels;
  readonly featureLabels: FeatureMenuLabels;
  readonly actions: BacklogPageActions;
}) {
  return (
    <div class="bl-projects">
      <button
        type="button"
        class={`chip bl-pchip${view.allOn ? " on" : ""}`}
        onClick={actions.onAllProjects}
      >
        {labels.all} <b class="bl-n">{view.open}</b>
      </button>
      {view.projects.map((p) => {
        const chip = (
          <button
            type="button"
            data-project={p.name}
            disabled={p.out}
            class={`chip bl-pchip${p.on ? " on" : ""}${p.out ? " dim" : ""}`}
            // a shift-click adds or removes; a plain click is that project, again → all
            onClick={(e) => actions.onProjectChip(p.name, e.shiftKey)}
          >
            <span class={`bl-proj hue-${p.hue}`}>{p.name}</span>
            <span class="bl-n">
              {p.counts.map((c) => (
                <b key={c.state} class={`s-${c.state}`} title={labels.stateNames[c.state]}>
                  {c.n}
                  {SECTION_GLYPH[c.state]}
                </b>
              ))}
            </span>
            {p.bar !== undefined && (
              <span
                class="bl-pbar"
                data-feature-bar={`${p.bar.done}/${p.bar.total}`}
                title={labels.barTitle(p.bar.done, p.bar.total)}
              >
                <i style={{ width: `${(100 * p.bar.done) / p.bar.total}%` }} />
                <b>
                  {p.bar.done}/{p.bar.total}
                </b>
              </span>
            )}
          </button>
        );
        // the panel is the chip's sibling, so a pick never reaches the chip; no feature row, no wrapper
        return p.tree.groups.length === 0 ? (
          <Fragment key={p.name}>{chip}</Fragment>
        ) : (
          <span key={p.name} class="bl-pwrap" data-pwrap={p.name}>
            {chip}
            <ProjectFeaturePanel
              heading={labels.projectFeatures(p.name)}
              labels={featureLabels}
              tree={p.tree}
              onPick={(name) => actions.onProjectFeature(p.name, name)}
            />
          </span>
        );
      })}
      {view.showNoStore &&
        view.noStore.map((name) => (
          <span key={name} class="chip bl-pchip bl-nostore">
            {labels.noStore(name)}
          </span>
        ))}
      {view.noStore.length > 0 && (
        <button type="button" class="bl-more" onClick={actions.onToggleNoStore}>
          {view.showNoStore ? labels.hide : labels.moreNoStore(view.noStore.length)}
        </button>
      )}
      <button
        type="button"
        class={`bl-gbtn${view.graphOn ? " on" : ""}`}
        title={labels.graphTitle}
        onClick={actions.onToggleGraph}
      >
        {labels.graph}
      </button>
    </div>
  );
}

function FeatureLine({
  view,
  heading,
  labels,
  onFeature,
}: {
  readonly view: BacklogHeadView["features"];
  readonly heading: string;
  readonly labels: FeatureMenuLabels;
  readonly onFeature: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  if (view === undefined) return null;
  return (
    <div class="bl-fline">
      <FeatureMenu
        hook="bfeature"
        class="bl-bfeature"
        heading={heading}
        buttonClass="bl-btn"
        labels={labels}
        tree={view.tree}
        picked={view.picked}
        onPick={(name) => {
          onFeature(name);
          setOpen(false);
        }}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        rootRef={rootRef}
      />
    </div>
  );
}

/** The pr chip group: `open` = any open PR in scope, then one chip per non-empty bucket. */
function PrChipGroup({
  view,
  labels,
  onPrFilter,
}: {
  readonly view: NonNullable<BacklogHeadView["filters"]["prs"]>;
  readonly labels: Labels;
  readonly onPrFilter: (bucket: string) => void;
}) {
  return (
    <span class="bl-fgroup" data-pr-filter>
      <em>{labels.pr}</em>
      <button
        type="button"
        data-pr="open"
        class={`chip bl-fchip bl-prchip${view.open.on ? " on" : ""}`}
        title={labels.prOpenTitle}
        onClick={() => onPrFilter("open")}
      >
        {labels.prOpen}
        <b>{view.open.n}</b>
      </button>
      {view.buckets.map((b) => (
        <button
          type="button"
          key={b.key}
          data-pr={b.key}
          class={`chip bl-fchip bl-prchip rb-${b.key}${b.on ? " on" : ""}`}
          title={b.who}
          onClick={() => onPrFilter(b.key)}
        >
          <i>{b.glyph}</i> {b.label}
          <b>{b.n}</b>
        </button>
      ))}
    </span>
  );
}

function FilterBar({
  view,
  labels,
  actions,
}: {
  readonly view: BacklogHeadView["filters"];
  readonly labels: Labels;
  readonly actions: BacklogPageActions;
}) {
  return (
    <div class="bl-filters">
      <input
        class="bl-search"
        type="search"
        placeholder={labels.searchPlaceholder}
        value={view.q}
        onInput={(e) => actions.onQuery(e.currentTarget.value)}
      />
      <span class="bl-fgroup">
        <em>{labels.state}</em>
        {view.states.map((s) => (
          <button
            type="button"
            key={s.key}
            data-state={s.key}
            class={`chip bl-fchip${s.on ? " on" : ""}`}
            onClick={() => actions.onToggleState(s.key)}
          >
            <i class={`s-${s.key}`}>{SECTION_GLYPH[s.key]}</i> {labels.stateNames[s.key]}
            <b>{s.n}</b>
          </button>
        ))}
      </span>
      <span class="bl-fgroup">
        <em>{labels.lane}</em>
        {view.lanes.map((l) => (
          <button
            type="button"
            key={l.key}
            data-lane={l.key}
            class={`chip bl-fchip${l.on ? " on" : ""}`}
            onClick={() => actions.onToggleLaneFilter(l.key)}
          >
            {l.key}
          </button>
        ))}
      </span>
      <span class="bl-fgroup">
        <em>{labels.prio}</em>
        {view.prios.map((p) => (
          <button
            type="button"
            key={p.key}
            data-prio={p.key}
            class={`chip bl-fchip${p.on ? " on" : ""}`}
            onClick={() => actions.onTogglePrio(p.key)}
          >
            P{p.key}
          </button>
        ))}
      </span>
      <span class="bl-fgroup" data-group-bar>
        <em>{labels.group}</em>
        {(["state", "wave"] as const).map((g) => (
          <button
            type="button"
            key={g}
            data-group={g}
            class={`chip bl-fchip${view.group === g ? " on" : ""}`}
            onClick={() => actions.onGroup(g)}
          >
            {labels.groupBy(g)}
          </button>
        ))}
      </span>
      {view.prs !== undefined && (
        <PrChipGroup view={view.prs} labels={labels} onPrFilter={actions.onPrFilter} />
      )}
      {view.anyOn && (
        <button type="button" class="bl-fclear" onClick={actions.onClearFilters}>
          {labels.clear}
        </button>
      )}
      <button type="button" class="bl-fclear bl-closed-toggle" onClick={actions.onToggleClosed}>
        {view.showClosed ? labels.hideClosed : labels.showClosed(view.closedCount)}
      </button>
    </div>
  );
}

function NextUp({
  hero,
  labels,
  actions,
}: {
  readonly hero: NonNullable<BacklogPageView["hero"]>;
  readonly labels: BacklogPageLabels;
  readonly actions: BacklogPageActions;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  return (
    <div class="bl-hero">
      <em>{labels.nextUp}</em>
      <span class={`bl-proj hue-${hero.hue}`}>{hero.row.project}</span>
      <span class="bl-hero-title">{hero.row.title}</span>
      <span class="bl-id" title={hero.row.id}>
        {hero.idText}
      </span>
      <code class="bl-cmd">{hero.dispatch}</code>
      <BucketHint text={hero.hint} />
      <CopyRunMenu
        view={hero.menu}
        className="bl-btn bl-hero-copy"
        labels={labels.copyMenu}
        open={open}
        onOpenChange={setOpen}
        onPickHost={(host) => {
          if (hero.project !== undefined) {
            actions.onPickHost(hero.project, host);
          }
        }}
        onCopy={actions.onCopy}
        rootRef={rootRef}
      />
    </div>
  );
}

function BacklogDrawer({
  view,
  labels,
  actions,
  canvasRef,
  searchRef,
}: {
  readonly view: BacklogDrawerView;
  readonly labels: GraphDrawerLabels;
  readonly actions: BacklogDrawerActions;
  readonly canvasRef: RefObject<HTMLDivElement> | undefined;
  readonly searchRef: RefObject<HTMLInputElement> | undefined;
}) {
  const [featureOpen, setFeatureOpen] = useState(false);
  const featureRef = useRef<HTMLSpanElement>(null);
  const ownCanvas = useRef<HTMLDivElement>(null);
  const ownSearch = useRef<HTMLInputElement>(null);
  return (
    <GraphDrawerView
      view={view.model}
      labels={labels}
      query={view.query}
      focus={view.focus}
      zoom={view.zoom}
      panning={view.panning}
      canvasRef={canvasRef ?? ownCanvas}
      searchRef={searchRef ?? ownSearch}
      featureRef={featureRef}
      {...actions}
      onFeature={(name) => {
        actions.onFeature(name);
        setFeatureOpen(false);
      }}
      featureOpen={featureOpen}
      onFeatureOpen={() => setFeatureOpen(true)}
      onFeatureClose={() => setFeatureOpen(false)}
    />
  );
}

function rowExtrasOf(view: BacklogPageView, id: string): BacklogRowExtras {
  const extras = view.rows[id];
  if (extras === undefined) throw new Error(`BacklogPage: no row view for ${id}`);
  return extras;
}

export function BacklogPage({ view, actions, headRef, canvasRef, searchRef }: BacklogPageProps) {
  const { labels } = view;
  const { hero, panel } = view;
  return (
    <BacklogFrame
      stale={view.frame.stale}
      staleNotice={view.frame.staleNotice}
      style={view.frame.style}
      headRef={headRef}
      chips={
        <>
          <ProjectChips
            view={view.head.chips}
            labels={labels.head}
            featureLabels={labels.featureMenu}
            actions={actions}
          />
          <FeatureLine
            view={view.head.features}
            heading={labels.head.allFeatures}
            labels={labels.featureMenu}
            onFeature={actions.onFeature}
          />
          <FilterBar view={view.head.filters} labels={labels.head} actions={actions} />
        </>
      }
      desk={
        view.desk !== undefined && (
          <ReviewDesk
            view={view.desk.view}
            labels={labels.desk}
            hueOf={(name) => view.hues[name] ?? 0}
            open={view.desk.open}
            prFilter={view.desk.prFilter}
            onDesk={actions.onDesk}
            onPrFilter={actions.onPrFilter}
            onSelect={actions.onSelect}
          />
        )
      }
      hero={hero !== undefined && <NextUp hero={hero} labels={labels} actions={actions} />}
      sections={
        <>
          {view.columns && (
            <div class="bl-thead bl-cols">
              {labels.columns.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          )}
          {view.loading && <p class="bl-empty">{labels.loading}</p>}
          {view.empty && <p class="bl-empty">{labels.nothingMatches}</p>}
          {view.waveSkipped > 0 && (
            <p class="bl-empty" data-wave-note>
              {labels.waveSkipped(view.waveSkipped)}
            </p>
          )}
          {view.sections.map((s) => (
            <BacklogSection
              key={s.key}
              sectionKey={s.key}
              heading={s.heading}
              notes={labels.sectionNotes}
              rows={s.rows}
              token={view.token}
              collapsed={s.collapsed}
              onCollapse={() => actions.onToggleSection(s.key)}
              rowProps={(row) => ({
                ...rowExtrasOf(view, row.id),
                labels: labels.row,
                onSelect: actions.onSelect,
                onCopy: actions.onCopy,
              })}
            />
          ))}
        </>
      }
      panel={
        panel !== undefined && (
          <BacklogPanel
            row={panel.row}
            token={view.token}
            view={panel.view}
            labels={labels.panel}
            onPickHost={(host) => {
              if (panel.project !== undefined) {
                actions.onPickHost(panel.project, host);
              }
            }}
            hue={panel.hue}
            onClose={actions.onClosePanel}
            scrollTop={panel.scrollTop}
            onScroll={actions.onPanelScroll}
            onCopy={actions.onCopy}
          />
        )
      }
      drawer={
        <>
          {view.drawer !== undefined && (
            <BacklogDrawer
              view={view.drawer}
              labels={labels.drawer}
              actions={actions.drawer}
              canvasRef={canvasRef}
              searchRef={searchRef}
            />
          )}
          {view.toast !== undefined && <div class="bl-toast">{view.toast}</div>}
        </>
      }
    />
  );
}
