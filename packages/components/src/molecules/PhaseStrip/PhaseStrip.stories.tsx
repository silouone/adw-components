import type { Meta, StoryObj } from "@storybook/preact-vite";
import { PhaseStrip, type PhaseStripView } from "./PhaseStrip";

const segment = (
  cls: string,
  left: number,
  width: number,
  title: string,
): PhaseStripView["segments"][number] => ({
  cls: `tc-ph ${cls}`,
  place: { left: `${left}%`, width: `${width}%` },
  title,
});

const meta = {
  title: "Molecules/PhaseStrip",
  component: PhaseStrip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The card's thin row of run phases: one segment per bar, placed by percent, plus the hatched wait for a slot.",
          "**Where** Molecule. Under a run card's header; the run table and the card feet read it too.",
          "**When** A run has phases with start and end times and the row must show how long each took.",
          "**Don't** Compute the percentages inside it: the caller passes `left` and `width` ready, and each segment carries its own `title`.",
        ].join("\n\n"),
      },
    },
  },
  args: { view: { segments: [] } },
} satisfies Meta<typeof PhaseStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullRun: Story = {
  args: {
    view: {
      segments: [
        segment("ph-setup", 0, 6, "setup · 12s"),
        segment("ph-plan", 6, 14, "plan · 41s"),
        segment("ph-build", 20, 34, "build · 2m 10s"),
        segment("ph-test", 54, 12, "test · 38s"),
        segment("ph-gates", 66, 10, "gates · 31s"),
        segment("ph-review", 76, 16, "review · 52s"),
        segment("ph-ship", 92, 8, "ship · 20s"),
      ],
    },
  },
};

export const LiveAndWaiting: Story = {
  args: {
    view: {
      segments: [
        segment("wait", 0, 18, "waiting for a slot · 1m 5s"),
        segment("ph-build blocked", 18, 20, "build · blocked"),
        segment("ph-test warn", 38, 20, "test · flaky"),
        segment("ph-review live", 58, 22, "review · running"),
      ],
    },
  },
};
