import type { Meta, StoryObj } from "@storybook/preact-vite";
import { PHASE_LEGEND_LABELS, PHASES } from "../../../fixtures/PhaseLegend";
import { PhaseLegend } from "./PhaseLegend";

const meta = {
  title: "Atoms/PhaseLegend",
  component: PhaseLegend,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The key to the phase strip: a swatch per phase in run order, then the two marks that are not phases.",
          "**Where** Atom. Above the board's cards, with the same `.ph-*` colours as the strip and the run page's journey.",
          "**When** The board shows phase strips and a reader needs to know which colour is which phase.",
          "**Don't** Reorder or filter the phases inside it: pass them in run order. It drops `other` itself, since that is not a phase worth naming.",
        ].join("\n\n"),
      },
    },
  },
  args: { phases: PHASES, labels: PHASE_LEGEND_LABELS },
} satisfies Meta<typeof PhaseLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithOther: Story = {
  args: { phases: [...PHASES, "other"] },
};

export const ThreePhases: Story = {
  args: { phases: ["plan", "build", "test"] },
};
