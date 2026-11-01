import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BLOCKED, FAILURE_TITLE, GREEN, RUNNING, TICKET_ID } from "../../../fixtures/GanttStrip";
import { GanttStrip } from "./GanttStrip";

const meta = {
  title: "Organisms/GanttStrip",
  component: GanttStrip,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The run header and the gantt collapsed to one line: the state pill, the ticket id, a mini timeline with a span per lane, the failure chip and the duration.",
          "**Where** Organism. At the top of the run screen when the gantt is collapsed.",
          "**When** The operator collapses the run header; a click on the bar outside any control opens it again.",
          "**Don't** Compute the spans or format the clock here: it takes a strip view whose spans are percentages and whose clock is already worded, and reports the click through callbacks.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    header: { ticketId: TICKET_ID, gate: "test-frontend" },
    strip: BLOCKED,
    failureTitle: FAILURE_TITLE,
    onFullScreen: () => {},
    onScope: () => {},
  },
} satisfies Meta<typeof GanttStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blocked: Story = { args: { failureScope: "gates::x::1" } };

export const Green: Story = { args: { strip: GREEN } };

export const LiveRunWithRepairRound: Story = { args: { strip: RUNNING } };
