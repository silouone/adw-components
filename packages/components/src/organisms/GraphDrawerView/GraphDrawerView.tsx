import "./GraphDrawerView.css";

// `<GraphDrawerView/>`: the project's dependency graph in a drawer docked flush to the bottom or
// the right edge, resizable by its handle. The canvas shows a zoom and a pan the page owns: the
// `zoom` factor and the `panning` flag arrive as props, the scroller, the search box and the
// feature menu as refs, and every pointer press as a callback (`onResizeStart`, `onPanStart`), so
// the wheel, key and scroll handling stay in the page. A card click hands its id to `onSelect`.
// It composes `<DepGraph/>`, `<FeatureMenu/>` and `<LaneNames/>`; every word arrives as `labels`.

import type { RefObject } from "preact";
import {
  FeatureMenu,
  type FeatureMenuLabels,
  type FeatureTree,
} from "../../molecules/FeatureMenu/FeatureMenu";
import {
  LaneNames,
  type LaneNamesLabels,
  type LaneNamesView,
  type LaneStat,
} from "../../molecules/LaneNames/LaneNames";
import {
  type BacklogGraph,
  DepGraph,
  type DepGraphMulti,
  type DepGraphView,
  type GraphLayout,
} from "../DepGraph/DepGraph";

export type GraphDock = "bottom" | "right";
export type GraphPreset = "narrow" | "wide" | "full";

const PRESETS: readonly GraphPreset[] = ["narrow", "wide", "full"];
const NO_COLORS: ReadonlyMap<string, string> = new Map();

/** One project chip of the head. */
export interface GraphChipView {
  readonly name: string;
  /** What the chip shows: the name, or the name and its member count under a feature. */
  readonly label: string;
  /** The project is in the selection. */
  readonly on: boolean;
  /** The project is outside the picked feature: dimmed and disabled. */
  readonly out: boolean;
}

/** The canvas: the laid-out graph and everything derived from it. */
export interface GraphCanvasView {
  readonly layout: GraphLayout;
  readonly searching: boolean;
  readonly hitLabel: string;
  /** The multi-project summary, drawn outside the zoomed canvas. */
  readonly summary: readonly string[];
  /** The name column's on-screen width: 0 unless laned. */
  readonly gutter: number;
  /** The hit Enter / Shift+Enter moves the focus to. */
  readonly nextFwd: string | undefined;
  readonly nextBack: string | undefined;
  readonly dep: DepGraphView;
  readonly laneNames: LaneNamesView;
}

export interface GraphDrawerModel {
  readonly dock: GraphDock;
  /** The docked size in px. */
  readonly px: number;
  /** The width of the ticket panel the drawer stops short of, in px. */
  readonly panelPx: number;
  /** The stored size when it is a preset name; undefined for a dragged pixel size. */
  readonly preset: GraphPreset | undefined;
  readonly showDone: boolean;
  readonly entire: boolean;
  /** The selected projects, for the empty note. */
  readonly projects: readonly string[];
  /** The feature tree; undefined when there is no feature to pick. */
  readonly featureTree: FeatureTree | undefined;
  /** The name of the picked feature, if any. */
  readonly feature: string | undefined;
  readonly chips: readonly GraphChipView[];
  /** Set only when the selection spans several projects. */
  readonly multi: DepGraphMulti | undefined;
  readonly lanes: boolean;
  readonly collapsed: readonly string[];
  readonly allFolded: boolean;
  readonly stats: ReadonlyMap<string, LaneStat>;
  /** The selection has no node at all: the canvas gives way to a note. */
  readonly empty: boolean;
  readonly graph: BacklogGraph;
  readonly canvas: GraphCanvasView;
}

/** The words of the drawer. */
export interface GraphDrawerLabels {
  /** The head's title, e.g. `graph`. */
  readonly title: string;
  /** The feature menu's first header cell, e.g. `features`. */
  readonly features: string;
  readonly featureMenu: FeatureMenuLabels;
  readonly laneNames: LaneNamesLabels;
  readonly lanes: string;
  readonly collapseAll: string;
  readonly expandAll: string;
  readonly dockBottom: string;
  readonly dockRight: string;
  readonly presets: Readonly<Record<GraphPreset, string>>;
  readonly close: string;
  /** The note under an empty selection. */
  readonly empty: (projects: readonly string[]) => string;
  readonly showDone: string;
  readonly entireGraph: string;
  /** The tooltips of the zoom buttons, e.g. `zoom out (-)`. */
  readonly zoomOutTitle: string;
  readonly zoomResetTitle: string;
  readonly zoomInTitle: string;
  readonly fitTitle: string;
  /** The fit button's word. */
  readonly fit: string;
  readonly search: string;
  readonly legend: {
    readonly crit: string;
    readonly unmet: string;
    readonly met: string;
    readonly dashed: string;
    readonly hint: string;
  };
}

export interface GraphDrawerViewProps {
  readonly view: GraphDrawerModel;
  readonly labels: GraphDrawerLabels;
  /** The shared search query, lit on the canvas. */
  readonly query: string;
  readonly focus: string | undefined;
  /** The canvas zoom factor; 1 is 100%. */
  readonly zoom: number;
  /** A pan is under way: the canvas shows the grabbing cursor. */
  readonly panning: boolean;
  /** The scrolling canvas, so the page can scroll, fit and listen to the wheel. */
  readonly canvasRef: RefObject<HTMLDivElement>;
  /** The search box, so the page can focus it. */
  readonly searchRef: RefObject<HTMLInputElement>;
  /** The feature menu root, so the page's dismiss edge can tell an inside click. */
  readonly featureRef: RefObject<HTMLSpanElement>;
  readonly featureOpen: boolean;
  readonly onFeatureOpen: () => void;
  readonly onFeatureClose: () => void;
  /** Picking a feature selects its projects and narrows to its members. */
  readonly onFeature: (name: string) => void;
  readonly onSelect: (id: string) => void;
  /** Shift-click on a project chip. */
  readonly onToggleProject: (name: string) => void;
  /** Plain click on a project chip. */
  readonly onSoleProject: (name: string) => void;
  readonly onToggleLane: (project: string) => void;
  readonly onCollapseAll: () => void;
  readonly onClose: () => void;
  readonly onQuery: (q: string) => void;
  /** Enter / Shift+Enter walk the hits. */
  readonly onFocus: (id: string) => void;
  /** The three flips take no argument: the page flips its own state. */
  readonly onShowDone: () => void;
  readonly onEntire: () => void;
  readonly onLanes: () => void;
  readonly onDock: (dock: GraphDock) => void;
  readonly onPreset: (preset: GraphPreset) => void;
  readonly onZoomOut: () => void;
  readonly onZoomReset: () => void;
  readonly onZoomIn: () => void;
  readonly onFit: () => void;
  /** A press on the resize handle; the page tracks the drag. */
  readonly onResizeStart: (e: PointerEvent) => void;
  /** A press on the canvas; the page decides whether it starts a pan. */
  readonly onPanStart: (e: PointerEvent) => void;
}

const cls = (base: string, ...flags: readonly (readonly [boolean, string])[]): string =>
  [base, ...flags.filter(([on]) => on).map(([, name]) => name)].join(" ");

function Legend({ legend }: { readonly legend: GraphDrawerLabels["legend"] }) {
  return (
    <footer class="bl-gd-legend">
      <span>
        <i class="bl-gd-sw bl-gd-sw-crit" /> {legend.crit}
      </span>
      <span>
        <i class="bl-gd-sw bl-gd-sw-unmet" /> {legend.unmet}
      </span>
      <span>
        <i class="bl-gd-sw bl-gd-sw-met" /> {legend.met}
      </span>
      <span>
        <i class="bl-gd-sw bl-gd-sw-dashed" /> {legend.dashed}
      </span>
      <span>{legend.hint}</span>
    </footer>
  );
}

export function GraphDrawerView({
  view,
  labels,
  query,
  focus,
  zoom,
  panning,
  canvasRef,
  searchRef,
  featureRef,
  featureOpen,
  onFeatureOpen,
  onFeatureClose,
  onFeature,
  onSelect,
  onToggleProject,
  onSoleProject,
  onToggleLane,
  onCollapseAll,
  onClose,
  onQuery,
  onFocus,
  onShowDone,
  onEntire,
  onLanes,
  onDock,
  onPreset,
  onZoomOut,
  onZoomReset,
  onZoomIn,
  onFit,
  onResizeStart,
  onPanStart,
}: GraphDrawerViewProps) {
  const { dock, px, panelPx, canvas, multi, lanes, graph } = view;
  const { layout, gutter } = canvas;
  const shift = gutter * (1 - zoom);
  const style =
    dock === "right"
      ? { top: 0, bottom: 0, right: panelPx, width: px }
      : { left: 0, right: panelPx, height: px };
  const docks: readonly { readonly dock: GraphDock; readonly label: string }[] = [
    { dock: "bottom", label: `⬓ ${labels.dockBottom}` },
    { dock: "right", label: `◨ ${labels.dockRight}` },
  ];

  return (
    <aside class={`bl-gd dock-${dock}`} style={style}>
      <div class="bl-gd-drag" onPointerDown={onResizeStart} />
      <header class="bl-gd-head">
        <span class="bl-gd-title">⎇ {labels.title}</span>
        {view.featureTree !== undefined && (
          <FeatureMenu
            hook="gfeature"
            class="bl-gd-feat"
            heading={labels.features}
            buttonClass="bl-gd-btn"
            labels={labels.featureMenu}
            tree={view.featureTree}
            picked={view.feature}
            onPick={onFeature}
            open={featureOpen}
            onOpen={onFeatureOpen}
            onClose={onFeatureClose}
            rootRef={featureRef}
          />
        )}
        <span class="bl-gd-chips">
          {view.chips.map((p) => (
            <button
              type="button"
              key={p.name}
              data-gproj={p.name}
              class={cls("bl-gd-chip", [p.on, "on"], [p.out, "dim"])}
              disabled={p.out}
              onClick={(e) => {
                if (e.shiftKey) onToggleProject(p.name);
                else onSoleProject(p.name);
              }}
            >
              {p.label}
            </button>
          ))}
        </span>
        {multi !== undefined && (
          <button
            type="button"
            data-glanes
            aria-pressed={lanes}
            class={cls("bl-gd-btn", [lanes, "on"])}
            onClick={() => onLanes()}
          >
            {labels.lanes}
          </button>
        )}
        {multi !== undefined && lanes && (
          <button type="button" data-gcollapse class="bl-gd-btn" onClick={onCollapseAll}>
            {view.allFolded ? labels.expandAll : labels.collapseAll}
          </button>
        )}
        <span class="bl-gd-seg">
          {docks.map((d) => (
            <button
              type="button"
              key={d.dock}
              data-dock={d.dock}
              class={cls("bl-gd-btn", [dock === d.dock, "on"])}
              onClick={() => onDock(d.dock)}
            >
              {d.label}
            </button>
          ))}
        </span>
        <span class="bl-gd-seg">
          {PRESETS.map((s) => (
            <button
              type="button"
              key={s}
              data-size={s}
              class={cls("bl-gd-btn", [view.preset === s, "on"])}
              onClick={() => onPreset(s)}
            >
              {labels.presets[s]}
            </button>
          ))}
        </span>
        <button type="button" class="bl-gd-x" aria-label={labels.close} onClick={onClose}>
          ×
        </button>
      </header>
      {view.empty ? (
        <p class="bl-gd-empty">{labels.empty(view.projects)}</p>
      ) : (
        <>
          <div class="bl-gd-bar">
            <button
              type="button"
              data-act="done"
              aria-pressed={view.showDone}
              disabled={view.entire}
              class={cls("bl-gd-btn", [view.showDone, "on"])}
              onClick={() => onShowDone()}
            >
              {labels.showDone}
            </button>
            <button
              type="button"
              data-act="entire"
              aria-pressed={view.entire}
              class={cls("bl-gd-btn", [view.entire, "on"])}
              onClick={() => onEntire()}
            >
              {labels.entireGraph}
            </button>
            <span class="bl-gd-zoom">
              <button
                type="button"
                data-act="out"
                class="bl-gd-btn"
                title={labels.zoomOutTitle}
                onClick={onZoomOut}
              >
                −
              </button>
              <button
                type="button"
                data-act="reset"
                class="bl-gd-btn"
                title={labels.zoomResetTitle}
                onClick={onZoomReset}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                data-act="in"
                class="bl-gd-btn"
                title={labels.zoomInTitle}
                onClick={onZoomIn}
              >
                +
              </button>
              <button
                type="button"
                data-act="fit"
                class="bl-gd-btn"
                title={labels.fitTitle}
                onClick={onFit}
              >
                {labels.fit}
              </button>
            </span>
            <input
              ref={searchRef}
              class="bl-gd-search"
              type="search"
              data-act="search"
              placeholder={labels.search}
              value={query}
              onInput={(e) => onQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") e.currentTarget.blur();
                else if (e.key === "Enter") {
                  e.preventDefault();
                  const to = e.shiftKey ? canvas.nextBack : canvas.nextFwd;
                  if (to !== undefined) onFocus(to);
                }
              }}
            />
            {canvas.searching && (
              <span class="bl-gd-hits" data-act="hits">
                {canvas.hitLabel}
              </span>
            )}
          </div>
          {canvas.summary.length > 0 && (
            <div class="dg-sum bl-gd-sum">{canvas.summary.join(" · ")}</div>
          )}
          <div
            ref={canvasRef}
            class={cls("bl-gc", [panning, "panning"])}
            onPointerDown={onPanStart}
          >
            <div
              class="bl-gc-size"
              style={{ width: layout.width * zoom + shift, height: layout.height * zoom }}
            >
              {layout.lanes !== undefined && (
                <LaneNames
                  layout={layout}
                  view={canvas.laneNames}
                  stats={view.stats}
                  labels={labels.laneNames}
                  colors={multi?.colors ?? NO_COLORS}
                  zoom={zoom}
                  collapsed={view.collapsed}
                  onToggle={onToggleLane}
                />
              )}
              <div
                class="bl-gc-scale"
                style={{
                  transform:
                    gutter === 0 ? `scale(${zoom})` : `translate(${shift}px, 0) scale(${zoom})`,
                  transformOrigin: "0 0",
                }}
              >
                <DepGraph
                  graph={graph}
                  layout={layout}
                  view={canvas.dep}
                  focus={focus}
                  onSelect={onSelect}
                  entire={view.entire}
                  multi={multi}
                  summary={multi === undefined}
                />
              </div>
            </div>
          </div>
        </>
      )}
      <Legend legend={labels.legend} />
    </aside>
  );
}
