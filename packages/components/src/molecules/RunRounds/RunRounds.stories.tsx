import type { Meta, StoryObj } from "@storybook/preact-vite";
import { hrefFor, LABELS, ON_A_BUILD, ON_A_ROUND } from "../../../fixtures/RunRounds";
import { RunRounds } from "./RunRounds";

const meta = {
  title: "Molecules/RunRounds",
  component: RunRounds,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run screen's side of the maintenance-round family. A round links back to the build run it maintains; a build run lists its rounds with outcome, duration and cost.",
          "**Where** Molecule. On the run page, under the run header.",
          "**When** A rebase or CI round follows a build, and the reader moves between the build and its rounds.",
          "**Don't** Build a run's address or format a duration: `hrefFor` gives each address, and `dur` and `cost` arrive formatted. The link texts come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: { family: ON_A_BUILD, labels: LABELS, hrefFor },
} satisfies Meta<typeof RunRounds>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BuildRunWithRounds: Story = {};

export const RoundLinkingBack: Story = {
  args: { family: ON_A_ROUND },
};
