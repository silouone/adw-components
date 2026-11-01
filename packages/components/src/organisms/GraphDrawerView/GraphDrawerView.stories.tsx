import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  GRAPH_DRAWER,
  GRAPH_DRAWER_EMPTY,
  GRAPH_DRAWER_FEATURED,
  GRAPH_DRAWER_LABELS,
  GRAPH_DRAWER_LANED,
  GRAPH_DRAWER_REFS,
  GRAPH_DRAWER_RIGHT,
  GRAPH_DRAWER_SEARCHING,
} from "../../../fixtures/GraphDrawerView";
import { GraphDrawerView } from "./GraphDrawerView";

const meta = {
  title: "Organisms/GraphDrawerView",
  component: GraphDrawerView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The project's dependency graph in a drawer docked to the bottom or the right edge: a head with the project chips, the feature menu, the dock and size switches; a bar with the done, entire, zoom and search controls; the zoomed canvas; and a legend.",
          "**Where** Organism. Fixed over the backlog, to the left of the ticket panel.",
          "**When** The reader wants the whole dependency picture of one project or several, with the lanes folded or open.",
          "**Don't** Own the zoom, the pan, the wheel or the keys here: `zoom` and `panning` arrive as props, the scroller, the search box and the feature menu as refs, and a press on the handle or the canvas reports through `onResizeStart` and `onPanStart`. The layout, the hits and every word (`labels`) come in too.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: GRAPH_DRAWER,
    labels: GRAPH_DRAWER_LABELS,
    query: "",
    focus: undefined,
    zoom: 1,
    panning: false,
    ...GRAPH_DRAWER_REFS,
    featureOpen: false,
    onFeatureOpen: () => {},
    onFeatureClose: () => {},
    onFeature: () => {},
    onSelect: () => {},
    onToggleProject: () => {},
    onSoleProject: () => {},
    onToggleLane: () => {},
    onCollapseAll: () => {},
    onClose: () => {},
    onQuery: () => {},
    onFocus: () => {},
    onShowDone: () => {},
    onEntire: () => {},
    onLanes: () => {},
    onDock: () => {},
    onPreset: () => {},
    onZoomOut: () => {},
    onZoomReset: () => {},
    onZoomIn: () => {},
    onFit: () => {},
    onResizeStart: () => {},
    onPanStart: () => {},
  },
} satisfies Meta<typeof GraphDrawerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Focused: Story = { args: { focus: "cqc-be-04" } };

export const Zoomed: Story = { args: { zoom: 0.5 } };

export const Panning: Story = { args: { panning: true } };

export const Searching: Story = {
  args: { view: GRAPH_DRAWER_SEARCHING, query: "04", focus: "cqc-be-04" },
};

export const WithFeatures: Story = { args: { view: GRAPH_DRAWER_FEATURED, featureOpen: true } };

export const Lanes: Story = { args: { view: GRAPH_DRAWER_LANED, zoom: 0.5 } };

export const DockedRight: Story = { args: { view: GRAPH_DRAWER_RIGHT } };

export const Empty: Story = { args: { view: GRAPH_DRAWER_EMPTY } };
