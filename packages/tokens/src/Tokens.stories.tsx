import type { Meta, StoryObj } from "@storybook/preact-vite";
import { type Tier, type Token, kindOf, tierOf, tokensOf } from "../docs/tokensOf";
import css from "./tokens.css?raw";

const TIERS: readonly { readonly tier: Tier; readonly heading: string }[] = [
  { tier: "primitives", heading: "Primitives" },
  { tier: "semantic", heading: "Semantic" },
  { tier: "phases", heading: "Phases" },
  { tier: "scales", heading: "Scales" },
];

const TOKENS = tokensOf(css);

const row = {
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-8)",
  padding: "var(--sp-4) 0",
  borderBottom: "1px solid var(--line)",
} as const;

const Entry = ({ token }: { readonly token: Token }) => (
  <div style={row}>
    {kindOf(token, TOKENS) === "swatch" && (
      <span
        title={token.value}
        style={{
          width: "var(--sp-24)",
          height: "var(--sp-16)",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--line)",
          background: `var(${token.name})`,
        }}
      />
    )}
    <code class="t-mono t-sm">{token.name}</code>
    <span class="t-mono t-sm c-dim">{token.value}</span>
  </div>
);

const Column = ({ theme }: { readonly theme: "dark" | "light" }) => (
  <section
    data-theme={theme}
    style={{
      flex: "1 1 0",
      padding: "var(--sp-12)",
      background: "var(--bg)",
      color: "var(--ink)",
      borderRadius: "var(--r-md)",
    }}
  >
    <h3 class="t-eyebrow">{theme}</h3>
    {TIERS.map(({ tier, heading }) => (
      <div key={tier}>
        <h4>{heading}</h4>
        {TOKENS.filter((t) => tierOf(t) === tier).map((t) => (
          <Entry key={t.name} token={t} />
        ))}
      </div>
    ))}
  </section>
);

const meta = {
  title: "Foundations/Tokens",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Every custom property of `tokens.css`, parsed from the stylesheet itself: colours as swatches, scales as values.",
          "Two columns set `data-theme` to `dark` and `light`. The light palette arrives with a later ticket: `tokens.light.css` selects on the document root only, so until then a wrapper's `data-theme` flips nothing and the toolbar changes `color-scheme` alone.",
        ].join("\n\n"),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTokens: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--sp-16)" }}>
      <Column theme="dark" />
      <Column theme="light" />
    </div>
  ),
};
