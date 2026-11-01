import type { Meta, StoryObj } from "@storybook/preact-vite";
import { KPI_PANEL, KPI_PANEL_EMPTY, KPI_PANEL_LABELS } from "../../../fixtures/KpiPanel";
import { KpiPanel } from "./KpiPanel";

const meta = {
  title: "Organisms/KpiPanel",
  component: KpiPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The body of the KPI chip's dropdown: five headline cells, three eight-bucket sparklines with their deltas, the time and outcome stacks and the per-project table.",
          "**Where** Organism. Inside the dropdown that the KPI chip opens.",
          "**When** The reader wants the board's loaded window at a glance: how much is green, what it cost, where the time went.",
          "**Don't** Compute a rate, a delta or a label inside it: the view carries every number and text. It reads no clock; the table heads and the delta tooltip come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: KPI_PANEL, labels: KPI_PANEL_LABELS },
} satisfies Meta<typeof KpiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const EmptyWindow: Story = {
  args: { view: KPI_PANEL_EMPTY },
};
