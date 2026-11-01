import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BLOCKED, FAILURE_BANNER, GREEN, LABELS, SUMMARY } from "../../../fixtures/Dock";
import { Dock } from "./Dock";

const meta = {
  title: "Organisms/Dock",
  component: Dock,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What** The run panel: a status and crumb row with its tools, the rail of drawn boxes, and the one active scope's section — the run scope on the overview, the drawers of a box on a step.",
          "**Where** Organism. Below the gantt on the run screen.",
          "**When** The operator opens a run; the dock opens on the failing node of a blocked run and on the overview of a green one.",
          "**Don't** Hold the active scope here: it arrives as a prop and every pick, close, collapse and toggle reports through a callback. Only the box matching the scope is mounted.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    failure: FAILURE_BANNER,
    view: BLOCKED,
    summary: SUMMARY,
    scope: "run",
    shut: false,
    full: false,
    md: false,
    labels: LABELS,
    onScope: () => {},
    onClose: () => {},
    onShutDock: () => {},
    onFullScreen: () => {},
    onMarkdownToggle: () => {},
  },
} satisfies Meta<typeof Dock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunScopeOnOverview: Story = {};

export const RunScopeAsMarkdown: Story = { args: { md: true } };

export const DrawerOpenOnAStep: Story = { args: { scope: "build::1" } };

export const DrawerOnTheFailingNode: Story = { args: { scope: "gates::1" } };

export const GreenRun: Story = { args: { view: GREEN, failure: undefined } };

export const Shut: Story = { args: { shut: true } };
