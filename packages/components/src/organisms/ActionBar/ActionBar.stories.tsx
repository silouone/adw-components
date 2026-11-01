import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  ACTION_BAR_BLOCKED,
  ACTION_BAR_CONTINUE,
  ACTION_BAR_DEFERRED,
  ACTION_BAR_LABELS,
  ACTION_BAR_PAUSED,
  ACTION_BAR_PAUSING,
  ACTION_BAR_PUBLISH,
  ACTION_BAR_RUNNING,
  ACTION_BAR_WITH_PR,
} from "../../../fixtures/ActionBar";
import { ActionBar } from "./ActionBar";

const meta = {
  title: "Organisms/ActionBar",
  component: ActionBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's arm-then-confirm bar: the first click arms a control and words its consequence, a second click inside the window fires it.",
          "**Where** Organism. At the foot of the focus panel, and in its dense rail form.",
          "**When** The reader acts on a ticket: pause, resume, kill, requeue, retry, continue, boost, publish, or open its run.",
          "**Don't** Post or copy by itself: `onAction` posts, `onCopy` copies, `onStage` opens the run, and a click elsewhere reaches it through `awayKey`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: ACTION_BAR_RUNNING,
    labels: ACTION_BAR_LABELS,
    token: "token",
    onAction: async () => undefined,
    onCopy: () => {},
    onStage: () => {},
  },
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Pausing: Story = { args: { view: ACTION_BAR_PAUSING } };

export const Paused: Story = { args: { view: ACTION_BAR_PAUSED } };

export const BlockedWithGreenGates: Story = { args: { view: ACTION_BAR_PUBLISH } };

export const Blocked: Story = { args: { view: ACTION_BAR_BLOCKED } };

export const BlockedAndResumable: Story = { args: { view: ACTION_BAR_CONTINUE } };

export const Deferred: Story = { args: { view: ACTION_BAR_DEFERRED } };

export const Published: Story = { args: { view: ACTION_BAR_WITH_PR } };

export const InTheRail: Story = { args: { density: "rail" } };
