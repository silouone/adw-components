import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BACKLOG_GRID_CSS,
  BACKLOG_SECTION_NOTES,
  BACKLOG_SECTION_ROWS,
  BACKLOG_TOKEN,
  backlogSectionRowProps,
} from "../../../fixtures/BacklogSection";
import { BacklogSection } from "./BacklogSection";

const meta = {
  title: "Organisms/BacklogSection",
  component: BacklogSection,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** One state-major section of the backlog: a disclosure head with the section name, the row count and a one-line note, over its backlog rows.",
          "**Where** Organism. One per state (blocked, waiting, ready, in flight, closed) or per wave, stacked in the backlog frame.",
          "**When** The reader wants the backlog grouped, with a section folded away to keep the rest in view.",
          "**Don't** Keep the collapse flag here: `collapsed` comes from the page, keyed by section, and the head reports a click through `onCollapse`. The rows' views and callbacks come in through `rowProps`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    sectionKey: "ready",
    notes: BACKLOG_SECTION_NOTES,
    rows: BACKLOG_SECTION_ROWS,
    token: BACKLOG_TOKEN,
    collapsed: false,
    onCollapse: () => {},
    rowProps: backlogSectionRowProps,
  },
  decorators: [
    (Story) => (
      <>
        <style>{BACKLOG_GRID_CSS}</style>
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof BacklogSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Collapsed: Story = { args: { collapsed: true } };

export const Empty: Story = { args: { sectionKey: "blocked", rows: [] } };

export const ByWave: Story = {
  args: { sectionKey: "wave-2", heading: "wave 2 · the cache" },
};
