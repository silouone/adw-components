import type { Meta, StoryObj } from "@storybook/preact-vite";
import { ArmButton } from "./ArmButton";

const meta = {
  title: "Molecules/ArmButton",
  component: ArmButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A two-click control: the first click arms it and names what it will act on, the second fires `onFire`.",
          "**Where** Molecule. In a card header or a `summary`; it stops click propagation so it never toggles the enclosing `details`.",
          "**When** An action is destructive or hard to undo and one stray click must not trigger it.",
          "**Don't** Call the factory from it or hold the result: `onFire` does the work and returns `undefined` when done, or the failure text to show.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    label: "Stop run",
    armedLabel: "Click again to stop run 42",
    onFire: async (): Promise<string | undefined> => undefined,
  },
} satisfies Meta<typeof ArmButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FailsOnFire: Story = {
  args: { onFire: async () => "Could not stop the run" },
};

export const QuickLapse: Story = {
  args: { armMs: 800 },
};
