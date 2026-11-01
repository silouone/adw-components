import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  CODEX_SPEND_CONTROL,
  CODEX_TWO_GAUGES,
  CONTRIBUTING_TOPS,
  FABLE_GAUGE,
  OPUS_GAUGE,
  SESSION_GAUGE,
  SPEND,
  SPEND_WITH_UNKNOWN,
  USAGE_PANEL,
  USAGE_PANEL_FULL,
  USAGE_PANEL_LABELS,
  USAGE_PANEL_LOADING,
  USAGE_PANEL_UNAVAILABLE,
} from "../../../fixtures/UsagePanel";
import { UsagePanel } from "./UsagePanel";

const meta = {
  title: "Organisms/UsagePanel",
  component: UsagePanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The pinned subscription-headroom panel: the Claude gauges, the Codex row, the factory's own spend per provider and the \"what's contributing\" grid.",
          "**Where** Organism. Pinned under the app header, opened from the usage chip.",
          "**When** The reader wants to know how much of the plan is left, what is eating it and what the factory itself spent.",
          "**Don't** Read the usage or derive a tone, an age or a figure here: the view arrives finished, `open` comes from the page and closing goes out through `onClose`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: USAGE_PANEL,
    labels: USAGE_PANEL_LABELS,
    open: true,
    onClose: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", transform: "translateZ(0)", minHeight: "620px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UsagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gauges: Story = {};

export const Full: Story = { args: { view: USAGE_PANEL_FULL } };

export const Loading: Story = { args: { view: USAGE_PANEL_LOADING } };

export const Unavailable: Story = { args: { view: USAGE_PANEL_UNAVAILABLE } };

export const UnreportedBuckets: Story = {
  args: { view: { ...USAGE_PANEL, gauges: [SESSION_GAUGE], unknownBuckets: ["Opus", "Fable"] } },
};

export const ModelBuckets: Story = {
  args: { view: { ...USAGE_PANEL, gauges: [SESSION_GAUGE, OPUS_GAUGE, FABLE_GAUGE] } },
};

export const CodexRow: Story = { args: { view: { ...USAGE_PANEL, codex: CODEX_TWO_GAUGES } } };

export const CodexSpendControl: Story = {
  args: { view: { ...USAGE_PANEL, codex: CODEX_SPEND_CONTROL } },
};

export const FactorySpend: Story = { args: { view: { ...USAGE_PANEL, spend: SPEND } } };

export const FactorySpendWithUnknown: Story = {
  args: { view: { ...USAGE_PANEL, spend: SPEND_WITH_UNKNOWN } },
};

export const TopSkills: Story = {
  args: { view: { ...USAGE_PANEL, contributing: CONTRIBUTING_TOPS } },
};

export const Closed: Story = { args: { open: false } };
