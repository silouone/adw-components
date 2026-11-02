import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BACKLOG_PANEL_LABELS,
  backlogPanelRow,
  backlogPanelView,
} from "../../../fixtures/BacklogPanel";
import {
  BACKLOG_GRID_CSS,
  BACKLOG_SECTION_NOTES,
  BACKLOG_SECTION_ROWS,
  BACKLOG_TOKEN,
  backlogSectionRowProps,
} from "../../../fixtures/BacklogSection";
import {
  BACKLOG_CHIPS,
  BACKLOG_HERO,
  BACKLOG_NOTICE,
  BACKLOG_STYLE,
} from "../../../fixtures/BacklogFrame";
import {
  GRAPH_DRAWER,
  GRAPH_DRAWER_LABELS,
  GRAPH_DRAWER_REFS,
} from "../../../fixtures/GraphDrawerView";
import { BUSY_DESK, hueOf, REVIEW_DESK_LABELS } from "../../../fixtures/ReviewDesk";
import { BacklogPanel } from "../../organisms/BacklogPanel/BacklogPanel";
import { BacklogSection } from "../../organisms/BacklogSection/BacklogSection";
import { GraphDrawerView } from "../../organisms/GraphDrawerView/GraphDrawerView";
import { ReviewDesk } from "../../organisms/ReviewDesk/ReviewDesk";
import { BacklogFrame } from "./BacklogFrame";

const noop = (): void => {};

const chips = (
  <div style={{ display: "flex", gap: "var(--sp-8)", padding: "var(--sp-8) 0" }}>
    {BACKLOG_CHIPS.map((c) => (
      <span key={c}>{c}</span>
    ))}
  </div>
);

const desk = (
  <ReviewDesk
    view={BUSY_DESK}
    labels={REVIEW_DESK_LABELS}
    hueOf={hueOf}
    open={true}
    prFilter={[]}
    onDesk={noop}
    onPrFilter={noop}
    onSelect={noop}
  />
);

const hero = <div>{BACKLOG_HERO}</div>;

const sections = (
  <BacklogSection
    sectionKey="ready"
    notes={BACKLOG_SECTION_NOTES}
    rows={BACKLOG_SECTION_ROWS}
    token={BACKLOG_TOKEN}
    collapsed={false}
    onCollapse={noop}
    rowProps={backlogSectionRowProps}
  />
);

const panel = (
  <BacklogPanel
    row={backlogPanelRow()}
    token={BACKLOG_TOKEN}
    view={backlogPanelView()}
    labels={BACKLOG_PANEL_LABELS}
    scrollTop={0}
    onClose={noop}
    onPickHost={noop}
    onScroll={noop}
    onCopy={noop}
  />
);

const drawer = (
  <GraphDrawerView
    view={GRAPH_DRAWER}
    labels={GRAPH_DRAWER_LABELS}
    query=""
    focus={undefined}
    zoom={1}
    panning={false}
    {...GRAPH_DRAWER_REFS}
    featureOpen={false}
    onFeatureOpen={noop}
    onFeatureClose={noop}
    onFeature={noop}
    onSelect={noop}
    onToggleProject={noop}
    onSoleProject={noop}
    onToggleLane={noop}
    onCollapseAll={noop}
    onClose={noop}
    onQuery={noop}
    onFocus={noop}
    onShowDone={noop}
    onEntire={noop}
    onLanes={noop}
    onDock={noop}
    onPreset={noop}
    onZoomOut={noop}
    onZoomReset={noop}
    onZoomIn={noop}
    onFit={noop}
    onResizeStart={noop}
    onPanStart={noop}
  />
);

const meta = {
  title: "Templates/BacklogFrame",
  component: BacklogFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The backlog's frame: the dropped-stream notice above the root, and inside it the sticky head, the review desk, the next-up row, the sections, the ticket panel and the graph drawer.",
          "**Where** Template. It places `ReviewDesk`, `BacklogSection`, `BacklogPanel` and `GraphDrawerView` around a head of project chips and filters.",
          "**When** The backlog page draws its list: the head stays on screen while the sections scroll under it.",
          "**Don't** Know a row, a chip or a filter: the page fills the slots, measures its head through `headRef` and hands the offsets down in `style`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    stale: false,
    style: BACKLOG_STYLE,
    chips,
    desk,
    hero,
    sections,
    panel,
    drawer,
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", transform: "translateZ(0)", minHeight: "720px" }}>
        <style>{BACKLOG_GRID_CSS}</style>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BacklogFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const Stale: Story = {
  args: { stale: true, staleNotice: BACKLOG_NOTICE },
};
