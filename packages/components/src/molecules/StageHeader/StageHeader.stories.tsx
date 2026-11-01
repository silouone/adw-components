import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  CRUMBS_ALL,
  CRUMBS_NO_GLYPH,
  CRUMBS_THREE,
  RUN,
  STAGE_LABELS,
} from "../../../fixtures/StageHeader";
import { StageHeader } from "./StageHeader";

const meta = {
  title: "Molecules/StageHeader",
  component: StageHeader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The one-line breadcrumb above the stage: segments of a small eyebrow over a value, joined by a separator. With a run open it gains a back button, the run segment with a copy control, and a full screen chip.",
          "**Where** Molecule. Above the board and above the run page.",
          "**When** The reader needs to know which runner, project or agent the stage is filtered to, or which run is open.",
          "**Don't** Restate the brand or the tabs in it, or copy to the clipboard: it calls `onCopy` with the full run id and the host copies. The words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    crumbs: CRUMBS_ALL,
    labels: STAGE_LABELS,
    onCloseRun: () => {},
    onFullScreen: () => {},
    onCopy: () => {},
  },
} satisfies Meta<typeof StageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {};

export const ThreeSegments: Story = {
  args: { crumbs: CRUMBS_THREE },
};

export const SegmentWithoutGlyph: Story = {
  args: { crumbs: CRUMBS_NO_GLYPH },
};

export const RunOpenOnTheStage: Story = {
  args: { crumbs: CRUMBS_THREE, run: RUN },
};
