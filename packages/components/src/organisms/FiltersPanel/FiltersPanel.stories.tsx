import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  FILTERS_LABELS,
  FILTERS_OFF,
  FILTERS_VIEW,
  FILTERS_VIEW_EMPTY,
  FILTERS_VIEW_ONE_HOST,
} from "../../../fixtures/FiltersPanel";
import { FiltersChip, FiltersPanel } from "./FiltersPanel";

const meta = {
  title: "Organisms/FiltersPanel",
  component: FiltersPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board's whole filter surface: project, health, lane, built-by, isolation and gate-host chips with their counts, the window row and a ticket-id search. `FiltersChip` is the top-bar chip that opens it.",
          "**Where** Organism. Inside the dropdown of the top bar's filters chip.",
          "**When** The reader narrows the board: by project, by health, by who built it or by a ticket id.",
          "**Don't** Count, label or filter inside it: the view carries every count and the chip's text, and every gesture is one `onChange(name, value)` for the page to apply.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: FILTERS_VIEW,
    labels: FILTERS_LABELS,
    filters: FILTERS_OFF,
    onChange: () => {},
    onWindow: () => {},
  },
} satisfies Meta<typeof FiltersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Everything: Story = {};

export const NarrowedToBlockedBugs: Story = {
  args: {
    filters: {
      ...FILTERS_OFF,
      health: { green: false, blocked: true, unfinished: false },
      lanes: ["bug"],
      providers: ["codex"],
    },
  },
};

export const OneHost: Story = { args: { view: FILTERS_VIEW_ONE_HOST } };

export const NoBoardData: Story = { args: { view: FILTERS_VIEW_EMPTY } };

export const OpenInItsChip: Story = {
  render: (args) => (
    <div style="min-height: 28rem">
      <FiltersChip {...args} open pinned onOpenChange={() => {}} />
    </div>
  ),
};
