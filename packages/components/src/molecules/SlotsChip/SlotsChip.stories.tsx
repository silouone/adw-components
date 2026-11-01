import type { Meta, StoryObj } from "@storybook/preact-vite";
import { CHIP_FULL, CHIP_LABELS, CHIP_NONE, CHIP_PARTIAL } from "../../../fixtures/SlotsChip";
import { SlotsChip } from "./SlotsChip";

const meta = {
  title: "Molecules/SlotsChip",
  component: SlotsChip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The top bar's slots chip: one mini bay per configured slot (held in the live hue, free faint), `held/total`, `+n queued`, and a warn border while every bay is held. It opens the slots panel.",
          "**Where** Molecule. In the top bar, beside the other dropdown chips.",
          "**When** The reader wants to know at a glance whether a run can start or must wait for a slot.",
          "**Don't** Count bays or decide `full` inside it, or keep its own open state: the view carries the tally, and the page owns `open` and `pinned` and hears `onOpenChange`. The words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: CHIP_PARTIAL,
    labels: CHIP_LABELS,
    open: false,
    pinned: false,
    onOpenChange: () => {},
    onOpenRun: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "420px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SlotsChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SomeSlotsHeld: Story = {};

export const EveryBayHeld: Story = {
  args: { view: CHIP_FULL },
};

export const NoSlotPool: Story = {
  args: { view: CHIP_NONE },
};

export const PanelOpen: Story = {
  args: { open: true, pinned: true },
};
