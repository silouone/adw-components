import type { Meta, StoryObj } from "@storybook/preact-vite";
import { FAILURE_LINE } from "../../../fixtures/DockStrip";
import { DockStrip } from "./DockStrip";

const meta = {
  title: "Atoms/DockStrip",
  component: DockStrip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The failure line of a shut dock: one ellipsised `--bad` line, with the full text in its title.",
          "**Where** Atom. In the dock strip's header row, after the crumb.",
          "**When** A run failed and the strip should say what, in one line, without opening the dock.",
          "**Don't** Build the line inside it: pass `line` ready. A run with no failure passes nothing and the strip is the crumb only.",
        ].join("\n\n"),
      },
    },
  },
  args: { line: FAILURE_LINE },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DockStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Failed: Story = {};

export const ShortLine: Story = {
  args: { line: "✕ timed out after 30m" },
};

export const NoFailure: Story = {
  render: () => <DockStrip />,
};
