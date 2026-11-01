import type { Meta, StoryObj } from "@storybook/preact-vite";
import { GAPS, LABELS, SUMMARY } from "../../../fixtures/RunScopeSection";
import { RunScopeSection } from "./RunScopeSection";

const meta = {
  title: "Organisms/RunScopeSection",
  component: RunScopeSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The run scope's own pane: the initial ticket beside the agent's final output, two panes each scrolling on its own, raw or rendered as markdown.",
          "**Where** Organism. The dock's overview section.",
          "**When** The operator opens the dock on its overview; the md/raw toggle swaps the two renderings.",
          "**Don't** Fetch the ticket or the report here: it takes both as prompt views, and a part that is missing or does not match its hash renders a gap panel, never broken markdown.",
        ].join("\n\n"),
      },
    },
  },
  args: { summary: SUMMARY, mdOn: false, labels: LABELS },
} satisfies Meta<typeof RunScopeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Raw: Story = {};

export const Markdown: Story = { args: { mdOn: true } };

export const MissingParts: Story = { args: { summary: GAPS, mdOn: true } };
