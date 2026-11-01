import type { Meta, StoryObj } from "@storybook/preact-vite";
import { NETWORK, NETWORK_LABELS, NETWORK_TALLY } from "../../../fixtures/NetworkTree";
import { NetworkTree } from "./NetworkTree";

const meta = {
  title: "Organisms/NetworkTree",
  component: NetworkTree,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** Rail 1 open: the runners, the projects each one hosts and the live runs of each project, as a tree with a footer of counts.",
          "**Where** Organism. The left rail of the board shell, opposite the closed runner rail.",
          "**When** The reader wants to see where the work runs, focus the board on a runner or a project, or jump to a live run.",
          "**Don't** Derive the tree or its counts here: the runners and the tally arrive finished, and the filters, folds and selection are the page's to hold.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    net: NETWORK,
    tally: NETWORK_TALLY,
    labels: NETWORK_LABELS,
    hostFilter: "*",
    projFilter: "*",
    selected: null,
    expandedRunners: new Set(["local"]),
    collapsedProjects: new Set<string>(),
    onFilter: () => {},
    onToggleRail: () => {},
    onToggleRunner: () => {},
    onToggleProject: () => {},
    onOpenRun: () => {},
  },
} satisfies Meta<typeof NetworkTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LocalExpanded: Story = {};

export const RunSelected: Story = {
  args: { selected: "sabado-276-strip-tags", hostFilter: "local", projFilter: "sabado" },
};

export const ProjectFolded: Story = {
  args: { collapsedProjects: new Set(["local/sabado"]) },
};

export const AllFolded: Story = { args: { expandedRunners: new Set<string>() } };
