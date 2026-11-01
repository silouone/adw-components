import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  RUN_TAB_ATTEMPTS,
  RUN_TAB_HOLDING,
  RUN_TAB_LABELS,
  RUN_TAB_RUNNING,
  RUN_TAB_WAITING,
} from "../../../fixtures/RunTab";
import { RunTab } from "./RunTab";

const meta = {
  title: "Organisms/RunTab",
  component: RunTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Run tab: where the run stands in line or on a bay, where it runs, its handles, the agent box and the attempts.",
          "**Where** Organism. The `run` tab of the focus panel; its `TabBlock` heads the Cost, Result and Route tabs too.",
          "**When** The reader picks a run and wants to know where it is and how to reach it.",
          "**Don't** Repeat the run screen: no gantt, no token table, no node durations. The view arrives finished and the copy goes out through `onCopy`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: RUN_TAB_RUNNING,
    labels: RUN_TAB_LABELS,
    onCopy: () => {},
  },
} satisfies Meta<typeof RunTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveCard: Story = {};

export const WaitingCard: Story = { args: { view: RUN_TAB_WAITING } };

export const HoldingASlot: Story = { args: { view: RUN_TAB_HOLDING } };

export const BlockedCard: Story = { args: { view: RUN_TAB_ATTEMPTS } };

export const RailDensity: Story = { args: { view: RUN_TAB_WAITING, density: "rail" } };
