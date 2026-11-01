import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BARS_ALL,
  BARS_BUSY_TODAY,
  BARS_THREE_DAY,
  LABEL_ALL,
  LABEL_EMPTY_WINDOW,
  LABEL_THREE_DAY,
  WINDOWS,
} from "../../../fixtures/RangeChips";
import { RangeChips } from "./RangeChips";

const meta = {
  title: "Molecules/RangeChips",
  component: RangeChips,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The time-window row of a filters panel: one chip per window, a per-day histogram of the archive and a label saying how many runs the window holds.",
          "**Where** Molecule. The `window` row of the board's filters panel.",
          "**When** The reader picks how far back the board loads.",
          "**Don't** Compute the bars or the label here: the caller passes heights as percentages, which bars are lit and the finished label. A chip click reports `onPick(days, true)`; it never stores the pick.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    windows: WINDOWS,
    days: "3d",
    bars: BARS_THREE_DAY,
    label: LABEL_THREE_DAY,
    onPick: () => {},
  },
} satisfies Meta<typeof RangeChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeDays: Story = {};

export const AllRuns: Story = {
  args: { days: "all", bars: BARS_ALL, label: LABEL_ALL },
};

export const BusyToday: Story = {
  args: { days: "7d", bars: BARS_BUSY_TODAY, label: "since Oct 26 · 4 of 4" },
};

export const EmptyWindow: Story = {
  args: { days: "2h", bars: [], label: LABEL_EMPTY_WINDOW },
};
