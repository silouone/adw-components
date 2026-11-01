import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BARE, FAILURE, NO_TAIL } from "../../../fixtures/FailureView";
import { FailureView } from "./FailureView";

const meta = {
  title: "Organisms/FailureView",
  component: FailureView,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A blocked run's failure as a triage view: a summary column (headline, node, gate, exit, where, the recipe's last line) beside a code / stack / output tab row.",
          "**Where** Organism. In the dock's failing-node pane of the run screen.",
          "**When** The run is blocked and its failing node has a failure to show.",
          "**Don't** Parse a failure or strip escape codes here: it takes the summary rows, the tabs, the code rows, the frames and the output already split into coloured spans.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: FAILURE },
} satisfies Meta<typeof FailureView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCodeFrame: Story = {};

export const OutputOnly: Story = { args: { view: NO_TAIL } };

export const HeadlineOnly: Story = { args: { view: BARE } };
