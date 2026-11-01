import type { Meta, StoryObj } from "@storybook/preact-vite";
import { VerdictEvidence } from "./Verdict";

const meta = {
  title: "Atoms/Verdict",
  component: VerdictEvidence,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The evidence behind a blocked run's verdict: a cause word reading `class · action`, then one line per fact the classifier read.",
          "**Where** Atom. In the run header; the board card shows only the cause word.",
          "**When** A run is blocked and the reader needs to see why the classifier chose its action.",
          "**Don't** Classify inside it: pass the verdict as the classifier reached it, with `salvageable` and the evidence lines ready.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    salvageableLabel: "salvageable",
    verdict: {
      class: "gate-red",
      suggestedAction: "retry",
      salvageable: false,
      evidence: ["lint exited 1", "2 tests failed in Wizard.flow.test.tsx"],
    },
  },
} satisfies Meta<typeof VerdictEvidence>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Salvageable: Story = {
  args: {
    verdict: {
      class: "timeout",
      suggestedAction: "resume",
      salvageable: true,
      evidence: ["no output for 15m", "branch holds 3 commits"],
    },
  },
};

export const NoEvidence: Story = {
  args: {
    verdict: { class: "unknown", suggestedAction: "inspect", salvageable: false, evidence: [] },
  },
};
