import type { Meta, StoryObj } from "@storybook/preact-vite";
import { CQC_GRAPH, CQC_LAYOUT, CQC_VIEW } from "../../../fixtures/DepGraph";
import { DepGraph } from "./DepGraph";

const meta = {
  title: "Organisms/DepGraph",
  component: DepGraph,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The project's dependency graph: one column per wave, one card per ticket, an edge per dependency. Running, blocked and held cards, flowing and stalled edges, and the search hits are all drawn from the view.",
          "**Where** Organism. The graph body of the backlog's graph view, inside the drawer's zoomed canvas.",
          "**When** The reader wants to see what fires now, what waits on what, and which block holds the rest.",
          "**Don't** Compute the layout, the lineages, the hits or the status text here: `layout` and `view` arrive as props, and only the hovered card is local state. A click reports through `onSelect`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    graph: CQC_GRAPH,
    layout: CQC_LAYOUT,
    view: CQC_VIEW,
    onSelect: () => {},
  },
} satisfies Meta<typeof DepGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Focused: Story = { args: { focus: "cqc-be-04" } };

export const Entire: Story = { args: { entire: true } };

export const WithoutSummary: Story = { args: { summary: false } };

export const SearchHit: Story = {
  args: {
    view: {
      ...CQC_VIEW,
      searching: true,
      hits: new Set(["cqc-be-04"]),
    },
  },
};
