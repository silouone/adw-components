import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BASE_RED,
  BASE_RED_LABELS,
  BASE_RED_ONE_GATE,
  BASE_RED_THREE_GATES,
} from "../../../fixtures/BaseRedChip";
import { BaseRedChip } from "./BaseRedChip";

const meta = {
  title: "Atoms/BaseRedChip",
  component: BaseRedChip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A filled red chip reading `base red`; its title names the seven-char base sha and each red gate with its count. The words arrive as `labels`.",
          "**Where** Atom. On a board card and on a ledger row, one chip shared by both.",
          "**When** A run went green over a base that was already red, and the reader should know the green is not the whole story.",
          "**Don't** Make it a link or a button: a filled block is a status, not a control. It renders nothing when `baseRed` is `undefined`.",
        ].join("\n\n"),
      },
    },
  },
  args: { baseRed: BASE_RED, labels: BASE_RED_LABELS },
} satisfies Meta<typeof BaseRedChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneGate: Story = {
  args: { baseRed: BASE_RED_ONE_GATE },
};

export const ThreeGates: Story = {
  args: { baseRed: BASE_RED_THREE_GATES },
};

export const BaseGreen: Story = {
  args: { baseRed: undefined },
};
