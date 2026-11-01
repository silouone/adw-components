import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  GATES_TAB,
  GATES_TAB_BARE,
  GATES_TAB_LABELS,
  GATES_TAB_LIVE,
  GATES_TAB_RED,
} from "../../../fixtures/GatesTab";
import { GatesTab } from "./GatesTab";

const meta = {
  title: "Organisms/GatesTab",
  component: GatesTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Gates tab: the baseline, every gate pass in the order it ran, the live one, the target's declared gates and, for a run blocked on a gate, why.",
          "**Where** Organism. The `gates` tab of the focus panel.",
          "**When** The reader wants to know what the gates said about a run.",
          "**Don't** Build the live line or find the cause: the view arrives finished, with its words in `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: GATES_TAB,
    labels: GATES_TAB_LABELS,
  },
} satisfies Meta<typeof GatesTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusPanel: Story = {};

export const LiveGate: Story = { args: { view: GATES_TAB_LIVE } };

export const BlockedOnAGate: Story = { args: { view: GATES_TAB_RED } };

export const NothingYet: Story = { args: { view: GATES_TAB_BARE } };

export const RailDensity: Story = { args: { density: "rail" } };
