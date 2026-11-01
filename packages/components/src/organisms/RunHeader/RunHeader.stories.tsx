import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BLOCKED,
  BLOCKED_GATE,
  FINISHED,
  IDENTITY,
  LABELS,
  LIVE,
  WORKSPACE,
} from "../../../fixtures/RunHeader";
import { RunHeader } from "./RunHeader";

const meta = {
  title: "Organisms/RunHeader",
  component: RunHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The run screen's header: the status pill, the PR's CI chip, the ticket id, the view tabs and the stat chips, then the verdict and the work left behind when the run is blocked.",
          "**Where** Organism. At the top of the run screen, and on the board's stage when embedded.",
          "**When** A run is open, running, finished or blocked.",
          "**Don't** Sum the figures, price the run or read the clock here: it takes a header view whose pill and chips are already worded, and reports a tab pick, a bar click or a chip click through callbacks.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    header: IDENTITY,
    head: FINISHED,
    tab: "gantt",
    labels: LABELS,
    onViewTab: () => {},
    onFullScreen: () => {},
    onScope: () => {},
  },
} satisfies Meta<typeof RunHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Finished: Story = {};

export const Running: Story = {
  args: {
    head: LIVE,
    providers: ["claude"],
    prChip: {
      ci: { kind: "failing", label: "ci / test", title: "check ci / test failed", url: "#" },
      laterHead: true,
    },
  },
};

export const Blocked: Story = {
  args: {
    header: { ...IDENTITY, gate: BLOCKED_GATE, factory: { sha: "abc1234def", dirty: true } },
    head: BLOCKED,
    failureScope: "gates::x::1",
    leftBehind: { files: 25, path: WORKSPACE },
  },
};

export const StaleRebaseRound: Story = {
  args: {
    header: { ...IDENTITY, round: "rebase" },
    stale: true,
    staleNotice: "The stream dropped; reconnecting.",
  },
};
