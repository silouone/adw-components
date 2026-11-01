import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  TOOLS_TAB,
  TOOLS_TAB_BARE,
  TOOLS_TAB_LABELS,
  TOOLS_TAB_LIVE,
} from "../../../fixtures/ToolsTab";
import { ToolsTab } from "./ToolsTab";

const meta = {
  title: "Organisms/ToolsTab",
  component: ToolsTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Tools tab: what the agent could use, the skills that reach it, the context it was given and what its tool calls captured.",
          "**Where** Organism. The `tools` tab of the focus panel.",
          "**When** The reader wants to know what an agent had at hand during a run.",
          "**Don't** Read the target or the run's detail: the view arrives finished, with its words in `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: TOOLS_TAB,
    labels: TOOLS_TAB_LABELS,
  },
} satisfies Meta<typeof ToolsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusPanel: Story = {};

export const AgentsStillRunning: Story = { args: { view: TOOLS_TAB_LIVE } };

export const NothingDeclared: Story = { args: { view: TOOLS_TAB_BARE } };

export const RailDensity: Story = { args: { density: "rail" } };
