import type { Meta, StoryObj } from "@storybook/preact-vite";
import { EMPTY, JOURNEY, LABELS, RUN_FACES, UP_NEXT } from "../../../fixtures/Journey";
import { Journey } from "./Journey";

const meta = {
  title: "Organisms/Journey",
  component: Journey,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run as a journey: a bar of its steps, one station per phase with its status, and the steps of the selected station.",
          "**Where** Organism. The run screen's timeline, as the third of its views.",
          "**When** The reader wants to know where the run is, phase by phase.",
          "**Don't** Derive the stations or the step figures here: it takes the `journey` and the `faces`, reports a click through `onScope` and the pointer through `onHover`, and holds only which station is picked.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    journey: JOURNEY,
    upNext: UP_NEXT,
    faces: RUN_FACES,
    scope: undefined,
    onScope: () => {},
    onHover: () => {},
    labels: LABELS,
  },
} satisfies Meta<typeof Journey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveRun: Story = {};

export const StepSelected: Story = { args: { scope: "build::build::2" } };

export const Stale: Story = { args: { stale: true } };

export const NothingPending: Story = { args: { upNext: [] } };

export const BeforeTheFirstStep: Story = { args: { journey: EMPTY, faces: new Map() } };
