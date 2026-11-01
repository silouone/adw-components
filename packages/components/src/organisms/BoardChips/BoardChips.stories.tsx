import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BOARD_CHIPS,
  BOARD_CHIPS_AUTONOMY,
  BOARD_CHIPS_EMPTY,
  BOARD_CHIPS_FILTERS,
  BOARD_CHIPS_LABELS,
  BOARD_CHIPS_NARROWED,
  BOARD_CHIPS_ONE,
} from "../../../fixtures/BoardChips";
import { BoardChips } from "./BoardChips";

const meta = {
  title: "Organisms/BoardChips",
  component: BoardChips,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board route's context in the app header: the KPI chip with its counts, the slots chip, the autonomy chips, the filters chip and the cards/ledger toggle.",
          "**Where** Organism. The app header of the board route; the usage chip stays the header's last child.",
          "**When** The reader is on the board and wants the tallies, the rack, the filters and the view at a glance.",
          "**Don't** Count, filter or keep dropdown state here: the view arrives finished, the page owns `open` and `pinned`, and every gesture goes out through a callback.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: BOARD_CHIPS,
    labels: BOARD_CHIPS_LABELS,
    autonomy: undefined,
    filters: BOARD_CHIPS_FILTERS,
    boardView: "cards",
    open: undefined,
    pinned: undefined,
    onDropdown: () => {},
    onFilter: () => {},
    onWindow: () => {},
    onView: () => {},
    onOpenRun: () => {},
  },
} satisfies Meta<typeof BoardChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveBoard: Story = {};

export const EmptyBoard: Story = { args: { view: BOARD_CHIPS_EMPTY } };

export const OneTicket: Story = { args: { view: BOARD_CHIPS_ONE } };

export const NarrowedByFilters: Story = { args: { view: BOARD_CHIPS_NARROWED } };

export const KpiPanelPinned: Story = { args: { open: "kpi", pinned: "kpi" } };

export const SlotsPanelOpen: Story = { args: { open: "slots" } };

export const FiltersPanelOpen: Story = { args: { open: "filters", pinned: "filters" } };

export const WithAutonomy: Story = { args: { autonomy: BOARD_CHIPS_AUTONOMY } };

export const LedgerView: Story = { args: { boardView: "ledger" } };
