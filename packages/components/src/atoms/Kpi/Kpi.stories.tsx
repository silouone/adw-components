import type { Meta, StoryObj } from "@storybook/preact-vite";
import { Kpi } from "./Kpi";

const meta = {
  title: "Atoms/Kpi",
  component: Kpi,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The one chip primitive: a glyph and a value in a pill, a `span`, or an `a` when it has an `href`.",
          "**Where** Atom. Inside cards, card feet and ledger rows; any molecule that shows a small figure composes it.",
          "**When** A short figure needs a label-free chip: a duration, a count, a pull request number.",
          "**Don't** Format the value inside it, read the clock, or style it from outside: pass `value` and `title` ready, pick `tone` for the place it sits.",
        ].join("\n\n"),
      },
    },
  },
  args: { cls: "kpi-time", glyph: "◷", value: "4m 12s", title: "Run duration" },
} satisfies Meta<typeof Kpi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Link: Story = {
  args: { cls: "kpi-pr", glyph: "#", value: "128", title: "Open pull request 128", href: "#" },
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
      <Kpi {...args} tone="card" />
      <Kpi {...args} tone="card-end" />
      <Kpi {...args} tone="row" />
    </div>
  ),
};
