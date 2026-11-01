import type { Meta, StoryObj } from "@storybook/preact-vite";
import { CopyId } from "./CopyId";

const meta = {
  title: "Atoms/CopyId",
  component: CopyId,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** A small `⧉` button that reports the full ticket id through `onCopy` and flashes `copiedLabel` for `flashMs`; its name and tooltip come from `label`.",
          "**Where** Atom. In a card's corner, hidden until hover, and in the focus panel's head, always shown.",
          "**When** A reader needs the whole ticket id on their clipboard without following the card's link.",
          "**Don't** Touch the clipboard from it: `onCopy` receives the id and the host copies. Its click never reaches the card's stretched link.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    ticketId: "demo-12-fix-the-login-redirect",
    onCopy: () => {},
    label: "copy demo-12-fix-the-login-redirect",
    copiedLabel: "copied",
    shown: true,
  },
} satisfies Meta<typeof CopyId>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shown: Story = {};

export const HoverOnly: Story = {
  args: { shown: false },
};

export const LongFlash: Story = {
  args: { flashMs: 5000 },
};
