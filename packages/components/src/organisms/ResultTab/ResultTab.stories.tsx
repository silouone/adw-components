import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  RESULT_TAB_BLOCKED,
  RESULT_TAB_DEFERRED,
  RESULT_TAB_LABELS,
  RESULT_TAB_LINK,
  RESULT_TAB_LIVE,
  RESULT_TAB_TAUGHT,
} from "../../../fixtures/ResultTab";
import { ResultTab } from "./ResultTab";

const meta = {
  title: "Organisms/ResultTab",
  component: ResultTab,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The focus panel's Result tab: the end of a run in one place — its PR, the factory review, why it stopped and what it taught.",
          "**Where** Organism. The `result` tab of the focus panel.",
          "**When** The reader wants to know how a run ended and what to do next.",
          "**Don't** Derive the PR line, the cause word or the ledger sentence: they arrive finished, and a stopped run only shows its block when the view carries one.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: RESULT_TAB_TAUGHT,
    labels: RESULT_TAB_LABELS,
  },
} satisfies Meta<typeof ResultTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MergedPullRequest: Story = {};

export const LinkOnly: Story = { args: { view: RESULT_TAB_LINK } };

export const LiveCard: Story = { args: { view: RESULT_TAB_LIVE } };

export const BlockedCard: Story = { args: { view: RESULT_TAB_BLOCKED } };

export const DeferredCard: Story = { args: { view: RESULT_TAB_DEFERRED } };

export const RailDensity: Story = { args: { density: "rail" } };
