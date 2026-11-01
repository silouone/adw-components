import type { Meta, StoryObj } from "@storybook/preact-vite";
import { EMPTY, LABELS, LEDGER, NOW, RUN_FACES, UP_NEXT } from "../../../fixtures/Ledger";
import { Ledger } from "./Ledger";

const meta = {
  title: "Organisms/Ledger",
  component: Ledger,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run as a ledger: one row per step with what it did, its rig, when and how long it took, and a row for each node still to come.",
          "**Where** Organism. The run screen's timeline, as the second of its views.",
          "**When** The reader wants every step readable without hovering.",
          "**Don't** Fold, measure or format the steps here: it takes the `ledger` rows and the `faces`, reports a click through `onScope` and the pointer through `onHover`, and holds only which folds are open.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    ledger: LEDGER,
    upNext: UP_NEXT,
    faces: RUN_FACES,
    now: NOW,
    scope: undefined,
    onScope: () => {},
    onHover: () => {},
    labels: LABELS,
  },
} satisfies Meta<typeof Ledger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveRun: Story = {};

export const StepSelected: Story = { args: { scope: "workspace::gates::1" } };

export const NothingPending: Story = { args: { upNext: [] } };

export const BeforeTheFirstStep: Story = { args: { ledger: EMPTY, faces: new Map(), upNext: [] } };
