import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  NONE_LABEL,
  RIG_BUDGET,
  RIG_CLAUDE,
  RIG_CODEX,
  RIG_MODEL_ONLY,
} from "../../../fixtures/Rig";
import { RigTag } from "./Rig";

const meta = {
  title: "Molecules/Rig",
  component: RigTag,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** What one step ran on: provider glyph and name, model, a five-step thinking meter with its effort word (or a thinking budget) and the gear.",
          "**Where** Molecule. On a step row of the run page and in the hover card of a step.",
          "**When** The reader needs to know which model, effort and gear produced a step.",
          "**Don't** Shorten model names or word budgets inside it: the caller passes them ready, with the tooltip. With no rig it shows the `none` text, which the caller words for an agent or a code step.",
        ].join("\n\n"),
      },
    },
  },
  args: { rig: RIG_CLAUDE, none: NONE_LABEL },
} satisfies Meta<typeof RigTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClaudeHighEffort: Story = {};

export const CodexMaxEffort: Story = {
  args: { rig: RIG_CODEX },
};

export const Compact: Story = {
  args: { compact: true },
};

export const ThinkingBudget: Story = {
  args: { rig: RIG_BUDGET },
};

export const ModelOnly: Story = {
  args: { rig: RIG_MODEL_ONLY },
};

export const NotJournaled: Story = {
  args: { rig: undefined },
};
