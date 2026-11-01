import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  SECTION_CARDS,
  SECTION_FILTERED_OUT,
  SECTION_LABELS,
  SECTION_LEDGER,
  SECTION_LEGACY,
  SECTION_PAUSED,
} from "../../../fixtures/SectionView";
import { SectionView } from "./SectionView";

const meta = {
  title: "Organisms/SectionView",
  component: SectionView,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A project's section of the board: a disclosure whose rail carries the live count, the pause and auto-continue controls, the shown-ticket count, the health meter and the green rate, over its tickets as cards or as ledger rows.",
          "**Where** Organism. One per project in the board, composed of `Card` and `LedgerRow`.",
          "**When** The reader folds a project away, or scans the tickets of one project in either layout.",
          "**Don't** Count tickets or decide the layout inside it: the view carries both tallies and the layout. Pausing, auto-continue, copying and selecting report through callbacks; the words come in as `labels`. Render it with a stable key so its open flag survives an update.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: SECTION_CARDS,
    labels: SECTION_LABELS,
    onPause: () => Promise.resolve(undefined),
    onContinue: () => Promise.resolve(undefined),
    onCopy: () => {},
  },
} satisfies Meta<typeof SectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};

export const Ledger: Story = {
  args: { view: SECTION_LEDGER },
};

export const Paused: Story = {
  args: { view: SECTION_PAUSED },
};

export const Legacy: Story = {
  args: { view: { ...SECTION_LEGACY, initialOpen: true } },
};

export const FilteredOut: Story = {
  args: { view: SECTION_FILTERED_OUT },
};
