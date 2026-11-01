import type { Meta, StoryObj } from "@storybook/preact-vite";
import { FOCUS_RAIL_LABELS, FOCUS_RAIL_TABS } from "../../../fixtures/FocusRail";
import { FocusRail } from "./FocusRail";

const meta = {
  title: "Organisms/FocusRail",
  component: FocusRail,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** Rail 2: a strip with one icon per focus tab, dimmed until a run is selected; open, the host of the focus panel.",
          "**Where** Organism. The right rail of the board shell.",
          "**When** The reader picks a run and wants its run, walk, gates, tools, cost, route or result.",
          "**Don't** Render a tab's content here: the open rail only hosts the `panel` it is handed, and falls back to a lone close button without one.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    selected: "sabado-276-strip-tags",
    tab: "run",
    open: false,
    tabs: FOCUS_RAIL_TABS,
    labels: FOCUS_RAIL_LABELS,
    onFocusTab: () => {},
    onFocusOpen: () => {},
  },
} satisfies Meta<typeof FocusRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunSelected: Story = {};

export const CostTabActive: Story = { args: { tab: "cost" } };

export const NothingSelected: Story = { args: { selected: null } };

export const OpenWithoutAPanel: Story = { args: { open: true } };

export const OpenWithAPanel: Story = {
  args: { open: true, panel: <p>The focus panel goes here.</p> },
};
