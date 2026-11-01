import type { Meta, StoryObj } from "@storybook/preact-vite";
import { TABS, TABS_LABEL } from "../../../fixtures/ViewTabs";
import { ViewTabs } from "./ViewTabs";

const meta = {
  title: "Molecules/ViewTabs",
  component: ViewTabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run header's switch between the timeline views: gantt, ledger and journey. Each tab has a drawn icon, its name and the key that picks it.",
          "**Where** Molecule. In the run header, between the title and the KPI chips.",
          "**When** The reader wants the same run as rows over time, as every step in order, or as phases.",
          "**Don't** Bind the keys 1, 2 and 3 or the arrows inside it: it renders the `active` tab and calls `onPick`; the host binds the keys. The tab names, tooltips and the tablist's `label` come in as props.",
        ].join("\n\n"),
      },
    },
  },
  args: { active: "gantt", tabs: TABS, label: TABS_LABEL, onPick: () => {} },
} satisfies Meta<typeof ViewTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GanttActive: Story = {};

export const LedgerActive: Story = {
  args: { active: "ledger" },
};

export const JourneyActive: Story = {
  args: { active: "journey" },
};
