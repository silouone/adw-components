import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  HANDLES_FINISHED,
  HANDLES_FULL,
  HANDLES_LABELS,
  HANDLES_SHORT,
} from "../../../fixtures/Handles";
import { Handles } from "./Handles";

const meta = {
  title: "Molecules/Handles",
  component: Handles,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The names a run is found by, as rows that copy on click (the tail of the value shown, the full value in the tooltip), then the commands that act on it. A click flashes `copied`.",
          '**Where** Molecule. In the run\'s focus panel and in the rail beside it (`density="rail"`).',
          "**When** The reader needs to paste a run's workspace, branch or a command into a terminal.",
          "**Don't** Touch the clipboard inside it: it calls `onCopy` with the full text, and the host copies. The words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: HANDLES_FULL, labels: HANDLES_LABELS, onCopy: () => {} },
} satisfies Meta<typeof Handles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningRun: Story = {};

export const FinishedRun: Story = {
  args: { view: HANDLES_FINISHED },
};

export const ShortValues: Story = {
  args: { view: HANDLES_SHORT },
};

export const RailDensity: Story = {
  args: { density: "rail" },
};
