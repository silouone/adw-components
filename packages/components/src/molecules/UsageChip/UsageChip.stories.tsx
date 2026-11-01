import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  LOADING,
  ONE_GAUGE,
  TWO_GAUGES,
  UNAVAILABLE,
  USAGE_LABEL,
  WARN_GAUGES,
} from "../../../fixtures/UsageChip";
import { UsageChip } from "./UsageChip";

const meta = {
  title: "Molecules/UsageChip",
  component: UsageChip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The always-visible fused usage chip: one row per subscription gauge (short name, percent spent, a mini bar and the countdown to its reset) and a caret. Its tone is ok, warn or bad.",
          "**Where** Molecule. At the end of the top bar; it opens the usage panel.",
          "**When** The reader wants to see how much of the subscription allowance is left before starting more runs.",
          "**Don't** Derive a tone or a countdown inside it, or hold the panel's open state: the view carries both, `open` marks the chip and `onToggle` reports the click. Before a read lands it is a placeholder, and without a usable read a dash; the chip's name comes in as `label`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: TWO_GAUGES, open: false, label: USAGE_LABEL, onToggle: () => {} },
} satisfies Meta<typeof UsageChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoGauges: Story = {};

export const SingleGauge: Story = {
  args: { view: ONE_GAUGE },
};

export const WarnAndBad: Story = {
  args: { view: WARN_GAUGES },
};

export const PanelOpen: Story = {
  args: { open: true },
};

export const Loading: Story = {
  args: { view: LOADING },
};

export const Unavailable: Story = {
  args: { view: UNAVAILABLE },
};
