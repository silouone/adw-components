import "./LaneNames.css";

// `<LaneNames/>`: the swimlane name column of the backlog graph. One cell per band, in a
// wrapper that sticks to the left edge of the canvas while it scrolls sideways. It lives
// beside the scaled canvas, never inside it: `position: sticky` does nothing under a
// transformed ancestor. It is never scaled either: the text keeps a fixed screen size and
// only the cells' vertical positions follow the `zoom`. As a band shrinks on screen the
// label degrades from name + sub-line, to the name, to the colour bar alone.
//
// Controlled: the page owns which bands are folded and hears `onToggle`. The sub-line's
// words arrive as `labels`.

export const LANE_NAME_PX = 11;
export const LANE_SUB_PX = 10;
const LANE_NAME_LINE = 14;
const LANE_SUB_LINE = 12;
const LANE_SUB_GAP = 2;
/** Under this on-screen band height only the colour bar is left. */
export const LANE_BAR_BELOW = 10;
/** From this on-screen band height the name and the sub-line both fit. */
export const LANE_FULL_H = 30;

export type LaneDetail = "full" | "name" | "bar";

/** How much of the label a band of this on-screen height can hold. */
export const laneDetail = (screenH: number): LaneDetail =>
  screenH < LANE_BAR_BELOW ? "bar" : screenH < LANE_FULL_H ? "name" : "full";

/** One project's band on the canvas, in unscaled units. */
export interface LaneBand {
  readonly project: string;
  readonly y: number;
  readonly h: number;
}

/** The part of the graph layout the column reads. */
export interface LaneNamesLayout {
  readonly height: number;
  /** One band per project; absent when the layout is not laned. */
  readonly lanes?: readonly LaneBand[];
}

export interface LaneNamesView {
  readonly width: number;
  /** Aligned with `layout.lanes`. */
  readonly bands: readonly {
    /** The band's shade class, e.g. `even` or `odd`. */
    readonly band: string;
    readonly outside: boolean;
  }[];
}

export interface LaneStat {
  readonly done: number;
  readonly total: number;
  readonly epic: string | undefined;
}

/** The words of the sub-line `3/5 done · epic mooc-00`. */
export interface LaneNamesLabels {
  readonly done: string;
  readonly epic: string;
}

export interface LaneNamesProps {
  readonly layout: LaneNamesLayout;
  readonly view: LaneNamesView;
  readonly stats: ReadonlyMap<string, LaneStat>;
  readonly labels: LaneNamesLabels;
  /** project → its `proj-<n>` class */
  readonly colors: ReadonlyMap<string, string>;
  readonly zoom: number;
  /** The projects whose band is folded to squares. */
  readonly collapsed: readonly string[];
  readonly onToggle: (project: string) => void;
}

const subOf = (stat: LaneStat, labels: LaneNamesLabels): string =>
  `${stat.done}/${stat.total} ${labels.done}${stat.epic === undefined ? "" : ` · ${labels.epic} ${stat.epic}`}`;

export function LaneNames({
  layout,
  view,
  stats,
  labels,
  colors,
  zoom,
  collapsed,
  onToggle,
}: LaneNamesProps) {
  return (
    <div
      class="bl-gc-names"
      style={{
        position: "sticky",
        left: 0,
        width: 0,
        height: 0,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <div
        class="dg-lanenames"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: view.width,
          height: layout.height * zoom,
        }}
      >
        {layout.lanes?.map((b, i) => {
          const stat = stats.get(b.project);
          const outside = view.bands[i]?.outside === true;
          const folded = !outside && collapsed.includes(b.project);
          const h = b.h * zoom;
          const detail = laneDetail(h);
          const showSub = detail === "full" && !outside && stat !== undefined;
          const label = outside ? b.project : `${folded ? "▸" : "▾"} ${b.project}`;
          const content = LANE_NAME_LINE + (showSub ? LANE_SUB_GAP + LANE_SUB_LINE : 0);
          const cap = folded ? 4 : 8;
          const pad = Math.max(0, Math.min(cap, (h - content) / 2));
          return (
            <div
              key={b.project}
              class={`${folded ? "dg-lanename dg-collapsed dg-lanename-folded" : "dg-lanename"} ${view.bands[i]?.band}`}
              data-lane={b.project}
              title={
                detail === "bar"
                  ? outside || stat === undefined
                    ? label
                    : `${label}\n${subOf(stat, labels)}`
                  : undefined
              }
              style={{
                position: "absolute",
                left: 0,
                width: view.width,
                top: b.y * zoom,
                height: h,
                pointerEvents: "auto",
                ...(pad < cap && { paddingTop: pad, paddingBottom: pad }),
              }}
            >
              <i
                class={
                  outside || !colors.has(b.project)
                    ? "dg-lanebar"
                    : `dg-lanebar ${colors.get(b.project)}`
                }
              />
              {detail !== "bar" && (
                <b
                  style={{
                    fontSize: `${LANE_NAME_PX}px`,
                    lineHeight: `${Math.min(h, LANE_NAME_LINE)}px`,
                  }}
                >
                  {outside ? (
                    b.project
                  ) : (
                    <button
                      type="button"
                      class="dg-lanetoggle"
                      data-act="lane-toggle"
                      aria-expanded={!folded}
                      onClick={() => onToggle(b.project)}
                    >
                      {label}
                    </button>
                  )}
                </b>
              )}
              {showSub && stat !== undefined && (
                <span
                  style={{
                    fontSize: `${LANE_SUB_PX}px`,
                    lineHeight: `${LANE_SUB_LINE}px`,
                  }}
                >
                  {subOf(stat, labels)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
