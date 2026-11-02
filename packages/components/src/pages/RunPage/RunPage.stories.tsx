import type { Meta, StoryObj } from "@storybook/preact-vite";
import { fn } from "storybook/test";
import { hrefFor } from "../../../fixtures/RunRounds";
import { RUN_PAGE_BASE } from "../../../fixtures/RunPage";
import { BLOCKED_FAILURE } from "../../../fixtures/run/blocked-failure";
import { GREEN_PR } from "../../../fixtures/run/green-pr";
import { LIVE_GATES } from "../../../fixtures/run/live-gates";
import { RunPage } from "./RunPage";

const meta = {
  title: "Pages/RunPage",
  component: RunPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run screen as a view: one `RunPageView` and one `RunPageActions`, composed into the run page frame with the header, the rounds, the lanes, ledger or journey, the hover card and the dock.",
          "**Where** Page. It is the whole run route, or the run mounted on the board's stage (`embedded`).",
          "**When** A run is open. Each story is one screen state: a run in flight, a blocked run with its failure, a green run with a passing pull request, and the page before its first frame.",
          "**Don't** Read the store, a clock or the viewport: the view carries the derived figures and the measured viewport, and every gesture reports through an action.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: LIVE_GATES,
    actions: {
      onScope: fn(),
      onClose: fn(),
      onHover: fn(),
      onViewTab: fn(),
      onFullScreen: fn(),
      onShutDock: fn(),
      onMarkdownToggle: fn(),
      hrefFor,
    },
  },
} satisfies Meta<typeof RunPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveGates: Story = {};

export const BlockedFailure: Story = { args: { view: BLOCKED_FAILURE } };

export const GreenPr: Story = { args: { view: GREEN_PR } };

/** The stream has not delivered its first frame: only the crumb. */
export const BeforeFirstFrame: Story = { args: { view: RUN_PAGE_BASE } };
