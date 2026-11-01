import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BLOCK,
  DRAWER,
  FAILED_BLOCK,
  FAILURE,
  FIGURES,
  GATES_FIGURES,
  LABELS,
  LIVE_FIGURES,
  REVIEW_DRAWER,
} from "../../../fixtures/Drawer";
import { Drawer } from "./Drawer";

const meta = {
  title: "Organisms/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One node's full detail: its stats, the model/tool split, gate chips, round and watchdog badges, and the drawer body with the prompt, system prompt, config, review verdict and live usage.",
          "**Where** Organism. One per member of the active box, inside the dock's pane.",
          "**When** The operator picks a step on the dock's rail.",
          "**Don't** Format a figure or word a label here: it takes the formatted figures, the drawer view and the labels, and renders only the slots the view carries.",
        ].join("\n\n"),
      },
    },
  },
  args: { block: BLOCK, laneRole: "build", figures: FIGURES, labels: LABELS, drawer: DRAWER },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Finished: Story = {};

export const WithGateRows: Story = { args: { figures: GATES_FIGURES } };

export const Reviewed: Story = { args: { drawer: REVIEW_DRAWER } };

export const LiveBlock: Story = {
  args: { figures: LIVE_FIGURES, block: { ...BLOCK, round: { round: 2, of: 3 } } },
};

export const FailedWithTriageView: Story = {
  args: { block: FAILED_BLOCK, laneRole: "gates", failure: FAILURE },
};
