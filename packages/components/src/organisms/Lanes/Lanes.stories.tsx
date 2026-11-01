import type { Meta, StoryObj } from "@storybook/preact-vite";
import { LABELS, LANES, LAYOUT, RUN_FACES } from "../../../fixtures/Lanes";
import { Lanes } from "./Lanes";

const meta = {
  title: "Organisms/Lanes",
  component: Lanes,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run as a gantt: a gridded time axis and one lane per role, each step a bar placed on the run's own span, with a zoom control.",
          "**Where** Organism. The run screen's timeline, as the first of its views.",
          "**When** The reader wants to see when each step ran and how the lanes overlap.",
          "**Don't** Lay the chart out here: it draws the `TimelineLayout` it is given, reports a click through `onScope` and the pointer through `onHover`, and holds only the zoom level.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    layout: LAYOUT,
    lanes: LANES,
    faces: RUN_FACES,
    scope: undefined,
    onScope: () => {},
    onHover: () => {},
    labels: LABELS,
  },
} satisfies Meta<typeof Lanes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveRun: Story = {};

export const StepSelected: Story = { args: { scope: "workspace::gates::1" } };

export const Docked: Story = { args: { docked: true } };

export const Stale: Story = { args: { stale: true } };

export const NoLanes: Story = {
  args: { layout: { boxes: [], ticks: [] }, lanes: { lanes: [], railKeys: new Map() } },
};
