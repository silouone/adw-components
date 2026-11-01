import type { Meta, StoryObj } from "@storybook/preact-vite";
import { COST_TAB, COST_TAB_EMPTY, COST_TAB_LABELS } from "../../../fixtures/CostTab";
import { CostTab } from "./CostTab";

const meta = {
  title: "Organisms/CostTab",
  component: CostTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Cost tab: this run's spend, the agent stages' share of the wall clock, and the ticket's total across every attempt and round.",
          "**Where** Organism. The `cost` tab of the focus panel.",
          "**When** The reader wants to know what a run, and the ticket behind it, cost.",
          "**Don't** Compute a figure: every amount, share and sentence arrives finished, and an unknown one arrives as a dash, never a zero. No gantt, no token-type table.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: COST_TAB,
    labels: COST_TAB_LABELS,
  },
} satisfies Meta<typeof CostTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusPanel: Story = {};

export const NoSummaryOnTheWire: Story = { args: { view: COST_TAB_EMPTY } };

export const RailDensity: Story = { args: { density: "rail" } };
