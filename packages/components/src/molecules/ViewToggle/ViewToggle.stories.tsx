import type { Meta, StoryObj } from "@storybook/preact-vite";
import { TOGGLE_LABELS } from "../../../fixtures/ViewToggle";
import { ViewToggle } from "./ViewToggle";

const meta = {
  title: "Molecules/ViewToggle",
  component: ViewToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board's two-button switch between the cards view `▦` and the ledger view `☰`. The current view is highlighted and pressed.",
          "**Where** Molecule. In the top bar, among the board chips.",
          "**When** The reader wants the same runs as cards or as a dense ledger.",
          "**Don't** Keep the chosen view inside it: it mirrors `view` and calls `onView` on every click, even on the active view, so the host can also return to the board. The words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: "cards", labels: TOGGLE_LABELS, onView: () => {} },
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardsView: Story = {};

export const LedgerView: Story = {
  args: { view: "ledger" },
};
