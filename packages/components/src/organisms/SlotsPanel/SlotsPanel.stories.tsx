import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BAYLESS_RUNNER,
  FOOT_TEXT,
  HOLDER_BAD,
  HOLDER_WARN,
  NO_POOL,
  ONE_RUNNER,
  SLOTS_LABELS,
  TWO_RUNNERS,
} from "../../../fixtures/SlotsPanel";
import { SlotsPanel } from "./SlotsPanel";

const meta = {
  title: "Organisms/SlotsPanel",
  component: SlotsPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The body of the slots dropdown: per runner a header, one row per bay (a holder with its time gauge, or a free bay) and the queue in the pool's own order, then a policy line.",
          "**Where** Organism. Inside the `SlotsChip` dropdown of the top bar.",
          "**When** The reader needs to know who holds each slot, how long they have held it against the timeout, and who is next.",
          "**Don't** Compute a gauge, a short id or a clock text inside it: the view carries `pct`, `tone`, `head` and every text. A row reports a click through `onOpenRun`; the words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: TWO_RUNNERS, labels: SLOTS_LABELS, onOpenRun: () => {} },
} satisfies Meta<typeof SlotsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoRunners: Story = {};

export const OneRunner: Story = {
  args: { view: ONE_RUNNER },
};

export const SlowAndOverdueHolders: Story = {
  args: {
    view: {
      runners: [{ ...BAYLESS_RUNNER, held: 2, baysTotal: 2, bays: [HOLDER_WARN, HOLDER_BAD] }],
      footText: FOOT_TEXT,
    },
  },
};

export const NoSlotPool: Story = {
  args: { view: NO_POOL },
};
