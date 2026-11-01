import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  WALK_TAB,
  WALK_TAB_CHORE,
  WALK_TAB_FAILED,
  WALK_TAB_FRESH,
  WALK_TAB_LABELS,
} from "../../../fixtures/WalkTab";
import { WalkTab } from "./WalkTab";

const meta = {
  title: "Organisms/WalkTab",
  component: WalkTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Walk tab: what is left before the PR — the lane line, a segmented progress bar and the lane's full node graph merged with the run's nodes.",
          "**Where** Organism. The `walk` tab of the focus panel.",
          "**When** The reader wants to see how far a run has walked its lane.",
          "**Don't** Merge the graph with the run: the view arrives finished, and a run without a graph arrives as `undefined`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: WALK_TAB,
    labels: WALK_TAB_LABELS,
  },
} satisfies Meta<typeof WalkTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusPanel: Story = {};

export const NothingRunYet: Story = { args: { view: WALK_TAB_FRESH } };

export const FailedNode: Story = { args: { view: WALK_TAB_FAILED } };

export const ChoreLane: Story = { args: { view: WALK_TAB_CHORE } };

export const NoNodeGraph: Story = { args: { view: undefined } };

export const RailDensity: Story = { args: { density: "rail" } };
