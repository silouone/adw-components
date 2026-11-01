import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  EMPTY,
  LONG_RUN,
  SAME_PHASE_THEN_NEW,
  THREE_PHASES,
  WAIT_LABEL,
  WAITING,
} from "../../../fixtures/StepThread";
import { StepThread } from "./StepThread";

const meta = {
  title: "Molecules/StepThread",
  component: StepThread,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A run as one dot per node, strung on a thread and grouped by phase. A filled dot is an agent, a hollow one code or a gate run; the hover card of each dot is its `tip`.",
          "**Where** Molecule. On the steps card of the board, under the run's header.",
          "**When** A card should show every step of a run at a glance, without the width of the phase strip.",
          "**Don't** Count dots or find phase breaks inside it: the view carries `n` and `gaps`, and the dots shrink to fit the card. The wait dot's words arrive as `waitLabel`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: THREE_PHASES, waitLabel: WAIT_LABEL },
  decorators: [
    (Story) => (
      <div style={{ width: "320px", paddingTop: "56px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePhases: Story = {};

export const SamePhaseThenNew: Story = {
  args: { view: SAME_PHASE_THEN_NEW },
};

export const WaitingForASlot: Story = {
  args: { view: WAITING },
};

export const LongRun: Story = {
  args: { view: LONG_RUN },
};

export const NoPhasesYet: Story = {
  args: { view: EMPTY },
};
