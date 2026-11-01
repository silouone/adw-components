import type { Meta, StoryObj } from "@storybook/preact-vite";
import { Arm } from "./Arm";

const meta = {
  title: "Atoms/Arm",
  component: Arm,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One control of the focus panel's action bar: a hairline button, a glyph and a lowercase verb, dim until hovered.",
          '**Where** Atom. Inside the action bar, which owns the arming; the rail passes `density="rail"` for its tighter variant.',
          "**When** A run action needs a quiet control whose tone says what it does: `live`, `bad`, `ok` or `dim`.",
          "**Don't** Fill it or arm it from inside: a filled block is a status, never a control, and `armed` and `onClick` come from the bar.",
        ].join("\n\n"),
      },
    },
  },
  args: { id: "pause", glyph: "⏸", label: "pause", tone: "dim", onClick: () => {} },
} satisfies Meta<typeof Arm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--sp-8)", alignItems: "center" }}>
      <Arm {...args} tone="live" label="resume" glyph="▶" />
      <Arm {...args} tone="bad" label="stop" glyph="■" />
      <Arm {...args} tone="ok" label="approve" glyph="✓" />
      <Arm {...args} tone="dim" />
    </div>
  ),
};

export const Armed: Story = {
  args: { tone: "live", label: "stop run 42", armed: true, armMs: 4000 },
};

export const ArmedBad: Story = {
  args: { tone: "bad", label: "stop run 42", armed: true, armMs: 4000 },
};

export const Dashed: Story = {
  args: { tone: "ok", dashed: true, label: "auto-continue", glyph: "↻" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Rail: Story = {
  args: { density: "rail" },
};
