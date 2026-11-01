import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BACKLOG_GRID_CSS,
  BACKLOG_ROW_LABELS,
  BACKLOG_TOKEN,
  BLOCKED_ROW,
  BLOCKED_VIEW,
  backlogRow,
  backlogRowView,
  REVIEW_PR,
  waitingRow,
  waitingView,
} from "../../../fixtures/BacklogRow";
import { BacklogRow } from "./BacklogRow";

const meta = {
  title: "Organisms/BacklogRow",
  component: BacklogRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One backlog row on a fixed column grid: state glyph, project, short id, title, lane, priority, why it is here, last run (or its open PR) and the copy / run / PR / last-run actions.",
          "**Where** Organism. Stacked inside a backlog section; the parent's `grid-template-columns` lines the columns up across rows.",
          "**When** The reader scans the backlog and wants to know, per ticket, what state it is in and what to do next.",
          "**Don't** Derive the section, the why line, the wave, the age or the dispatch line here: the view arrives finished, the page owns selection and copying, and the row only reports through `onSelect` and `onCopy`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    row: backlogRow(),
    token: BACKLOG_TOKEN,
    view: backlogRowView(),
    labels: BACKLOG_ROW_LABELS,
    onSelect: () => {},
    onCopy: () => {},
  },
  decorators: [
    (Story) => (
      <>
        <style>{BACKLOG_GRID_CSS}</style>
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof BacklogRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Blocked: Story = { args: { row: BLOCKED_ROW, view: BLOCKED_VIEW, hue: 2 } };

export const Waiting: Story = {
  args: {
    row: waitingRow(["proj-02", "proj-03"]),
    view: waitingView(["proj-02", "proj-03"], { "proj-02": "blocked", "proj-03": "running" }),
  },
};

export const OpenPr: Story = {
  args: {
    row: backlogRow({ status: "in-review", state: "in-flight" }),
    view: backlogRowView({ section: "in-flight", pr: REVIEW_PR }),
  },
};

export const Closed: Story = {
  args: {
    row: backlogRow({ closed: true, status: "done", lastRunId: "proj-abc123-1000" }),
    view: backlogRowView({
      section: "closed",
      last: { outcome: "green", tone: "green", age: "3d ago", attempts: 1 },
    }),
  },
};

export const CursorAndSelected: Story = { args: { cursor: true, selected: true } };

export const ReviewOff: Story = { args: { row: backlogRow({ review: false }) } };
