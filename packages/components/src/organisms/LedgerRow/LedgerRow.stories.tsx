import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BASE_RED_ROW,
  BLOCKED_ROW,
  GREEN_ROW,
  LEDGER_ROW_LABELS,
  PAUSED_ROW,
  PR_ROW,
  SLOT_HOLDER_ROW,
  TWO_ATTEMPTS_ROW,
  WAITING_ROW,
} from "../../../fixtures/LedgerRow";
import { LedgerRow } from "./LedgerRow";

const meta = {
  title: "Organisms/LedgerRow",
  component: LedgerRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One ticket as a board row: eleven fixed columns — beacon, id and title, lane, now line, phase strip, where, time, cost, tokens, PR chips and attempts.",
          "**Where** Organism. A row of a section in ledger mode, the same selectable thing as the card.",
          "**When** The reader scans many tickets at once and wants the strips to align down the page.",
          "**Don't** Derive a status, a cost or a column width inside it: the view carries every text and tone. A click on the body reports through `onSelect`; the words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: GREEN_ROW, labels: LEDGER_ROW_LABELS },
  decorators: [
    (Story) => (
      <div style={{ width: "1100px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LedgerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = {};

export const Live: Story = {
  args: { view: SLOT_HOLDER_ROW },
};

export const Blocked: Story = {
  args: { view: BLOCKED_ROW },
};

export const Waiting: Story = {
  args: { view: WAITING_ROW },
};

export const Paused: Story = {
  args: { view: PAUSED_ROW },
};

export const Selected: Story = {
  args: { view: GREEN_ROW, selected: true, onSelect: () => {} },
};

export const WithPrAndAttempts: Story = {
  args: { view: { ...TWO_ATTEMPTS_ROW, card: { ...TWO_ATTEMPTS_ROW.card, pr: PR_ROW.card.pr } } },
};

export const BaseRed: Story = {
  args: { view: BASE_RED_ROW },
};
