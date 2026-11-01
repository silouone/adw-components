import type { Meta, StoryObj } from "@storybook/preact-vite";
import { LABELS, NO_HOSTS, WITH_HOSTS } from "../../../fixtures/CopyRunMenu";
import { CopyRunMenu } from "./CopyRunMenu";

const meta = {
  title: "Molecules/CopyRunMenu",
  component: CopyRunMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The compact « ▶ copy ▾ » control that copies a run command. With gate hosts it opens a small menu, « this mac » first and then each host; without hosts one click copies the line.",
          "**Where** Molecule. On a backlog row, beside the ticket it dispatches.",
          "**When** The reader wants the command that runs a ticket, and where the gate should run decides which line.",
          "**Don't** Copy to the clipboard or close the menu on Escape inside it: it reports through `onCopy`, `onPickHost` and `onOpenChange`, and the owner does the rest. Its words come in as `labels`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: WITH_HOSTS,
    className: "bl-btn",
    labels: LABELS,
    open: false,
    onOpenChange: () => {},
    onPickHost: () => {},
    onCopy: () => {},
    rootRef: { current: null },
  },
} satisfies Meta<typeof CopyRunMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHostsClosed: Story = {};

export const WithHostsOpen: Story = {
  args: { open: true },
};

export const NoHosts: Story = {
  args: { view: NO_HOSTS },
};
