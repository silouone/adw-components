import type { Meta, StoryObj } from "@storybook/preact-vite";
import { ROUND_LABELS, WATCHDOG_LABEL } from "../../../fixtures/Badge";
import { RoundBadge, WatchdogBadge } from "./Badge";

const meta = {
  title: "Atoms/Badge",
  component: RoundBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** Two pills for a lane: `RoundBadge` reads `attempt N of M`, `WatchdogBadge` reads `lane stalled: <reason>`; the words arrive as `labels` and `label`.",
          "**Where** Atom. On a lane's drawn boxes and in a drawer's card body; both call sites share this one file.",
          "**When** A lane is on a retry round, or its watchdog tripped and the reason should show.",
          "**Don't** Render a placeholder: each badge returns nothing when its view is `undefined`, so pass the optional field as it is.",
        ].join("\n\n"),
      },
    },
  },
  args: { round: { round: 2, of: 3 }, labels: ROUND_LABELS },
} satisfies Meta<typeof RoundBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Round: Story = {};

export const FirstAttempt: Story = {
  args: { round: { round: 1, of: 1 } },
};

export const Watchdog: Story = {
  render: () => <WatchdogBadge watchdog={{ reason: "no output for 15s" }} label={WATCHDOG_LABEL} />,
};

export const Both: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--sp-8)" }}>
      <RoundBadge {...args} />
      <WatchdogBadge watchdog={{ reason: "no output for 15s" }} label={WATCHDOG_LABEL} />
    </div>
  ),
};
