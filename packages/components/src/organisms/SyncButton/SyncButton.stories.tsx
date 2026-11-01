import type { Meta, StoryObj } from "@storybook/preact-vite";
import { SYNC_BUTTON_LABELS } from "../../../fixtures/SyncButton";
import { SyncButton } from "./SyncButton";

const meta = {
  title: "Organisms/SyncButton",
  component: SyncButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The backlog header's one control: a button that shows whether a sync sweep is running and asks for one.",
          "**Where** Organism. The backlog header, beside the backlog's counts.",
          "**When** The reader wants the in-review tickets reconciled against GitHub.",
          "**Don't** Post or poll from here: it reports a click through `onSync` and shows the `status` it is given.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    status: "idle",
    labels: SYNC_BUTTON_LABELS,
    onSync: () => {},
  },
} satisfies Meta<typeof SyncButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Syncing: Story = { args: { status: "syncing" } };
