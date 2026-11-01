import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  RUNNER_RAIL,
  RUNNER_RAIL_EMPTY,
  RUNNER_RAIL_HOVERED,
  RUNNER_RAIL_HOVERED_PLANNED,
  RUNNER_RAIL_LABELS,
} from "../../../fixtures/RunnerRail";
import { RunnerRail } from "./RunnerRail";

const meta = {
  title: "Organisms/RunnerRail",
  component: RunnerRail,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** Rail 1 closed: a narrow strip with the open toggle, an all-runners tile and one tile per runner, each with a status dot and a hover popover.",
          "**Where** Organism. The left rail of the board shell while the network tree is folded away.",
          "**When** The reader wants the runners at a glance, or one click to focus the board on a runner and open its tree.",
          "**Don't** Look anything up here: the tiles and the hovered runner's popover arrive finished, and the hover itself is the page's to hold.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style="position: relative; min-height: 24rem">
        <Story />
      </div>
    ),
  ],
  args: {
    view: RUNNER_RAIL,
    labels: RUNNER_RAIL_LABELS,
    hostFilter: "*",
    expandedRunners: new Set<string>(),
    onHoverRunner: () => {},
    onFilter: () => {},
    onToggleRail: () => {},
    onToggleRunner: () => {},
  },
} satisfies Meta<typeof RunnerRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strip: Story = {};

export const RunnerFocused: Story = { args: { hostFilter: "local" } };

export const PopoverOnABusyRunner: Story = { args: { view: RUNNER_RAIL_HOVERED } };

export const PopoverOnAPlannedRunner: Story = {
  args: { view: RUNNER_RAIL_HOVERED_PLANNED },
};

export const EmptyRack: Story = { args: { view: RUNNER_RAIL_EMPTY } };
