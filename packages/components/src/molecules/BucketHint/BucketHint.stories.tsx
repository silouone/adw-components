import type { Meta, StoryObj } from "@storybook/preact-vite";
import { HINT_ONE, HINT_TWO, HINT_UNKNOWN } from "../../../fixtures/BucketHint";
import { BucketHint } from "./BucketHint";

const meta = {
  title: "Molecules/BucketHint",
  component: BucketHint,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A dim one-line hint: which per-model weekly buckets a run will draw on and how much of each is used. The sentence arrives whole as `text`.",
          "**Where** Molecule. Next to a dispatch action in the backlog.",
          "**When** The reader is about to start a run and should see what it will spend from.",
          "**Don't** Build the sentence inside it, or print `0%` for a bucket with no figure: the caller words it as `unknown`. It renders nothing when `text` is `undefined`.",
        ].join("\n\n"),
      },
    },
  },
  args: { text: HINT_ONE },
} satisfies Meta<typeof BucketHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneBucket: Story = {};

export const UnknownFigure: Story = {
  args: { text: HINT_UNKNOWN },
};

export const SeveralBuckets: Story = {
  args: { text: HINT_TWO },
};

export const NothingToDrawOn: Story = {
  args: { text: undefined },
};
