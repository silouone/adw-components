import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  HOVER_BUILD,
  HOVER_CLUSTER,
  HOVER_GATES,
  LABELS,
  RUN_FACES,
  VIEWPORT,
} from "../../../fixtures/HoverCard";
import { HoverCard } from "./HoverCard";

const meta = {
  title: "Organisms/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The one detail card the run's three timeline views share: a step's phase, offsets, rig, figures and gates, or the members of a cluster of quick steps.",
          "**Where** Organism. Over the lanes, the ledger and the journey, fixed to the viewport beside the pointer.",
          "**When** The pointer rests on a step of any of the three views.",
          "**Don't** Read the viewport or the page zoom here, or catch the click: it takes both as props, renders nothing when no step is hovered, and lets the pointer through.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    faces: RUN_FACES,
    hovered: HOVER_BUILD,
    viewport: VIEWPORT,
    zoom: 1,
    labels: LABELS,
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentStep: Story = {};

export const FailedGates: Story = { args: { hovered: HOVER_GATES } };

export const ClusterOfQuickSteps: Story = { args: { hovered: HOVER_CLUSTER } };

export const NothingHovered: Story = { args: { hovered: undefined } };
