import type { Meta, StoryObj } from "@storybook/preact-vite";
import { TabSection } from "./TabSection";

const meta = {
  title: "Atoms/TabSection",
  component: TabSection,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** An eyebrow-headed block: a title, an optional dim note on the right, then its children.",
          "**Where** Atom. In each of the focus panel's tabs, the same markup the run tab draws for its own sections.",
          "**When** A tab groups facts under a short heading and the heading may carry a count or a note.",
          '**Don\'t** Style the heading from outside: pass `title` and `right` ready, and `density="rail"` for the narrow rail.',
        ].join("\n\n"),
      },
    },
  },
  args: { title: "Gates", children: "lint · typecheck · test" },
} satisfies Meta<typeof TabSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNote: Story = {
  args: { right: "3 of 4 green" },
};

export const Rail: Story = {
  args: { density: "rail", right: "3 of 4 green" },
};
