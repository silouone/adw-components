import type { Meta, StoryObj } from "@storybook/preact-vite";
import { UpNext } from "./UpNext";

const meta = {
  title: "Atoms/UpNext",
  component: UpNext,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          '**What** The "up next" strip: a label, then each node still to run, joined by arrows.',
          "**Where** Atom. Under a run's chain, off the time axis, in its own `un-*` class family.",
          "**When** A chain has nodes ahead of it, or nodes the run ended before reaching.",
          "**Don't** Reuse the `.nd` block or its `k-*` classes: a pending node must never look like a real one. Empty `entries` render nothing.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    label: "up next",
    entries: [
      { node: "gates", status: "pending" },
      { node: "review", status: "pending" },
      { node: "commit", status: "pending" },
    ],
  },
} satisfies Meta<typeof UpNext>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const SingleEntry: Story = {
  args: { entries: [{ node: "gates", status: "pending" }] },
};

export const NotRun: Story = {
  args: {
    entries: [
      { node: "gates", status: "pending" },
      { node: "review", status: "not-run" },
      { node: "commit", status: "not-run" },
    ],
  },
};

export const Empty: Story = {
  args: { entries: [] },
};
