import type { Meta, StoryObj } from "@storybook/preact-vite";

const SIZES = ["2xs", "xs", "sm", "md", "base", "lg", "xl", "2xl"] as const;
const UTILITIES = ["t-mono", "t-sans", "t-tabular", "t-eyebrow", "t-truncate", "t-clamp"] as const;
const COLOURS = ["c-dim", "c-ink", "c-ok", "c-bad", "c-warn", "c-live"] as const;

interface TextStylesProps {
  readonly sample: string;
  readonly figures: string;
  readonly long: string;
}

const row = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--sp-12)",
  padding: "var(--sp-4) 0",
  borderBottom: "1px solid var(--line)",
} as const;

const label = { flex: "0 0 var(--sp-24)" } as const;

const TextStyles = ({ sample, figures, long }: TextStylesProps) => (
  <div>
    <h3 class="t-eyebrow">Sizes</h3>
    {SIZES.map((size) => (
      <div key={size} style={row}>
        <code class="t-mono t-sm c-dim" style={label}>{`t-${size}`}</code>
        <span class={`t-${size}`}>{sample}</span>
      </div>
    ))}
    <h3 class="t-eyebrow">Utilities</h3>
    {UTILITIES.map((utility) => (
      <div key={utility} style={row}>
        <code class="t-mono t-sm c-dim" style={label}>
          {utility}
        </code>
        <span class={`t-base ${utility}`} style={{ maxWidth: "100%" }}>
          {utility === "t-tabular" ? figures : utility === "t-clamp" ? long : sample}
        </span>
      </div>
    ))}
    <h3 class="t-eyebrow">Colours</h3>
    {COLOURS.map((colour) => (
      <div key={colour} style={row}>
        <code class="t-mono t-sm c-dim" style={label}>
          {colour}
        </code>
        <span class={`t-base ${colour}`}>{sample}</span>
      </div>
    ))}
  </div>
);

const meta = {
  title: "Foundations/Text styles",
  component: TextStyles,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The size ladder `t-2xs` to `t-2xl`, the text utilities and the `c-*` colours of `typography.css`. `--faint` has no colour utility: it is a rule colour, never text.",
      },
    },
  },
  args: {
    sample: "The quick brown fox jumps over the lazy dog",
    figures: "1 234 567 · 0.42 · 98%",
    long: "A long line that wraps past the second line so the clamp utility cuts it short with an ellipsis, however wide the viewport is and whatever the font ends up being.",
  },
} satisfies Meta<typeof TextStyles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ladder: Story = {};
