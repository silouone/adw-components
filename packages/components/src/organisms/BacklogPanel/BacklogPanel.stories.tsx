import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BACKLOG_PANEL_LABELS,
  BACKLOG_TOKEN,
  BLOCKED_PANEL_ROW,
  BLOCKED_PANEL_VIEW,
  backlogPanelRow,
  backlogPanelView,
  COPY_MANY_HOSTS,
} from "../../../fixtures/BacklogPanel";
import { BacklogPanel } from "./BacklogPanel";

const meta = {
  title: "Organisms/BacklogPanel",
  component: BacklogPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The drawer a backlog row opens: title, state badge and actions, why the ticket is stuck, its frontmatter as a grid, its dep chips, its rendered body and its attempts ledger.",
          "**Where** Organism. Fixed to the right edge of the backlog screen.",
          "**When** The reader selects a row and wants the whole ticket without leaving the backlog.",
          "**Don't** Render the markdown, tidy the reason or build the dispatch lines here: the view arrives finished. The scroll offset is a prop read once on mount and written back through `onScroll`, and every copy goes out through `onCopy`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    row: backlogPanelRow(),
    token: BACKLOG_TOKEN,
    view: backlogPanelView(),
    labels: BACKLOG_PANEL_LABELS,
    scrollTop: 0,
    onClose: () => {},
    onPickHost: () => {},
    onScroll: () => {},
    onCopy: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", transform: "translateZ(0)", minHeight: "720px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BacklogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const BlockedWithAttempts: Story = {
  args: { row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW, hue: 3 },
};

export const Drifted: Story = {
  args: {
    row: backlogPanelRow({
      state: "in-flight",
      status: "in-review",
      drift: "in-review, no PR recorded",
    }),
    view: backlogPanelView({ section: "in-flight" }),
  },
};

export const ManyGateHosts: Story = {
  args: { view: backlogPanelView({ copy: COPY_MANY_HOSTS }) },
};

export const Closed: Story = {
  args: {
    row: backlogPanelRow({ closed: true, status: "done" }),
    view: backlogPanelView({ section: "closed" }),
  },
};
