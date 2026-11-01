import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BUSY_DESK,
  deskCard,
  EMPTY_DESK,
  hueOf,
  REVIEW_DESK_LABELS,
} from "../../../fixtures/ReviewDesk";
import { ReviewDesk } from "./ReviewDesk";

const meta = {
  title: "Organisms/ReviewDesk",
  component: ReviewDesk,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The open pull requests of the selection as a strip of next-action columns (review, merge, fix CI, …) under a one-line summary of the review budget. A column header filters the list; a card opens its ticket.",
          "**Where** Organism. Under the backlog's sticky head, above the sections.",
          "**When** The reader wants to see what waits on them, and which PR to take next.",
          "**Don't** Keep the open flag or the pr filter here: both arrive as props and each write reports through `onDesk`, `onPrFilter` or `onSelect`. Every word comes in through `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: BUSY_DESK,
    labels: REVIEW_DESK_LABELS,
    hueOf,
    open: true,
    prFilter: [],
    onDesk: () => {},
    onPrFilter: () => {},
    onSelect: () => {},
  },
} satisfies Meta<typeof ReviewDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = { args: { open: false } };

export const Filtered: Story = { args: { prFilter: ["merge"] } };

export const Empty: Story = { args: { view: EMPTY_DESK } };

export const LongColumn: Story = {
  args: {
    view: {
      ...BUSY_DESK,
      columns: [
        {
          bucket: "review",
          glyph: "◐",
          label: "review",
          who: "you",
          cards: Array.from({ length: 8 }, (_, i) => deskCard(i + 1)),
        },
      ],
    },
  },
};
