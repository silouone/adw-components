import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  FOCUS_BODIES,
  FOCUS_PANEL,
  FOCUS_PANEL_BARE,
  FOCUS_PANEL_BLOCKED,
  FOCUS_PANEL_GREEN,
  FOCUS_PANEL_LABELS,
  focusPanelOn,
} from "../../../fixtures/FocusPanel";
import { FocusPanel } from "./FocusPanel";
import { focusBodyOf } from "./focusTabs";

const meta = {
  title: "Organisms/FocusPanel",
  component: FocusPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The selected ticket's panel: a sticky tab row, the header (project, lane, provider, short id, title, status line), the action bar and the active tab's body.",
          "**Where** Organism. The board's focus rail, opened on a selected card; its tab bodies come from the registry in `FocusPanel/focusTabs`.",
          "**When** The reader has picked a ticket and wants to see where its run stands, what it did, what it cost and what it produced.",
          "**Don't** Build the view or the active tab here: the head, the status, the actions and the tab bodies arrive finished, and every gesture goes out through a callback.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: FOCUS_PANEL,
    labels: FOCUS_PANEL_LABELS,
    token: "tok",
    density: "rail",
    onFocusTab: () => {},
    onFocusOpen: () => {},
    onAction: async () => undefined,
    onCopy: () => {},
    onStage: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: "340px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FocusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One story per tab: the panel on that tab with its body from the registry. */
const onTab = (tab: keyof typeof FOCUS_BODIES): Story => ({
  args: { view: focusPanelOn(tab) },
  render: (args) => <FocusPanel {...args}>{focusBodyOf(FOCUS_BODIES[tab])}</FocusPanel>,
});

export const RunTab: Story = onTab("run");
export const WalkTab: Story = onTab("walk");
export const GatesTab: Story = onTab("gates");
export const ToolsTab: Story = onTab("tools");
export const CostTab: Story = onTab("cost");
export const RouteTab: Story = onTab("route");
export const ResultTab: Story = onTab("result");

export const BlockedTicket: Story = {
  args: { view: { ...FOCUS_PANEL_BLOCKED, tab: "result" } },
  render: (args) => <FocusPanel {...args}>{focusBodyOf(FOCUS_BODIES.result)}</FocusPanel>,
};

export const GreenTicket: Story = {
  args: { view: { ...FOCUS_PANEL_GREEN, tab: "result" } },
  render: (args) => <FocusPanel {...args}>{focusBodyOf(FOCUS_BODIES.result)}</FocusPanel>,
};

export const BareHead: Story = {
  args: { view: FOCUS_PANEL_BARE },
  render: (args) => <FocusPanel {...args}>{focusBodyOf(FOCUS_BODIES.run)}</FocusPanel>,
};
