import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BLOCKED_CARD,
  CARD_LABELS,
  DEFERRED_CARD,
  FELL_BACK_HOST,
  GREEN_CARD,
  LIVE_CARD,
  PAUSED_CARD,
  WAITING_CARD,
} from "../../../fixtures/Card";
import { Card } from "./Card";

const meta = {
  title: "Organisms/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One ticket on the board: its short id, the providers that built it, the title as a sentence, the step thread, the now line and the cost, time and token figures.",
          "**Where** Organism. A cell of the board's lanes and of its network tree.",
          "**When** The reader scans the board for what is running, what is blocked and what waits for a slot.",
          "**Don't** Derive a status, an age or a figure inside it: the view carries every text and tone. A click on the body reports through `onSelect`, the id copy through `onCopy`; the words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: GREEN_CARD, labels: CARD_LABELS, onCopy: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: "360px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = {};

export const Live: Story = {
  args: { view: LIVE_CARD },
};

export const Blocked: Story = {
  args: { view: BLOCKED_CARD },
};

export const Waiting: Story = {
  args: { view: WAITING_CARD },
};

export const Deferred: Story = {
  args: { view: DEFERRED_CARD },
};

export const Paused: Story = {
  args: { view: PAUSED_CARD },
};

export const Selected: Story = {
  args: { view: GREEN_CARD, selected: true, onSelect: () => {} },
};

export const GatesFellBack: Story = {
  args: { view: { ...GREEN_CARD, gateHost: FELL_BACK_HOST } },
};
