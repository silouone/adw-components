import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  banded,
  COLORS,
  FOLDED_LAYOUT,
  LABELS,
  LAYOUT,
  STATS,
  VIEW,
} from "../../../fixtures/LaneNames";
import { LaneNames } from "./LaneNames";

const meta = {
  title: "Molecules/LaneNames",
  component: LaneNames,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The swimlane name column of the backlog graph: one cell per project band with a colour bar, the project's name and a `done/total` line with its epic. The name folds and unfolds its band.",
          "**Where** Molecule. Pinned to the left edge of the graph canvas while the canvas scrolls sideways.",
          "**When** The graph is split into lanes, one per project, and the reader needs to know which band is which.",
          "**Don't** Scale it or read the zoom from the page: text keeps a fixed size and only the cells' tops and heights follow the `zoom` prop. As a band shrinks the label drops its sub-line, then its name, until only the bar is left. The sub-line's words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "420px", overflow: "auto" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    layout: LAYOUT,
    view: VIEW,
    stats: STATS,
    labels: LABELS,
    colors: COLORS,
    zoom: 0.3,
    collapsed: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof LaneNames>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullLabels: Story = {};

export const NameOnly: Story = {
  args: { layout: banded([20, 20, 20]), zoom: 1 },
};

export const BarsOnly: Story = {
  args: { layout: banded([8, 8, 8]), zoom: 1 },
};

export const FoldedBand: Story = {
  args: { layout: FOLDED_LAYOUT, collapsed: ["courses"], zoom: 0.5 },
};
