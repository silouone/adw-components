import type { Meta, StoryObj } from "@storybook/preact-vite";
import { CHIPS, CHIPS_UNSORTED, SHADOW_LABEL } from "../../../fixtures/AutonomyChips";
import { AutonomyChips } from "./AutonomyChips";

const meta = {
  title: "Molecules/AutonomyChips",
  component: AutonomyChips,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One dashed, read-only chip per target: the target, the word `shadow` (the `label` prop) and the level the autonomy dial would pick. The reason sits in the tooltip.",
          "**Where** Molecule. In the board header, beside the target's other status chips.",
          "**When** A target has an ODD, so the dial has a reading, even though nothing acts on it yet.",
          "**Don't** Make it a button or a link: it is a status, not a control. A target with no entry gets no chip.",
        ].join("\n\n"),
      },
    },
  },
  args: { autonomy: CHIPS, label: SHADOW_LABEL },
} satisfies Meta<typeof AutonomyChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneTarget: Story = {};

export const SeveralTargets: Story = {
  args: {
    autonomy: {
      ...CHIPS_UNSORTED,
      "silou-hq": { level: "HOTL", reason: "chore · merge: at the edge" },
    },
  },
};

export const NoTarget: Story = {
  args: { autonomy: {} },
};
