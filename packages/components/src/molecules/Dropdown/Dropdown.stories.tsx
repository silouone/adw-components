import type { Meta, StoryObj } from "@storybook/preact-vite";
import { ALPHA, PANEL_ROWS } from "../../../fixtures/Dropdown";
import { Dropdown } from "./Dropdown";

const meta = {
  title: "Molecules/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**What** The one top-bar chip gesture: a chip with a `▾` caret and a panel that opens on hover, pins on click and reports every gesture through `onOpenChange`. It is controlled by `open` and `pinned`.",
          "**Where** Molecule. In the top bar, one per filter or picker chip.",
          "**When** A chip owns a panel of choices that must stay reachable while the pointer moves from the chip into the panel.",
          "**Don't** Keep the open state inside it: the page owns which dropdown is open and pinned, and closes it on an outside click or Escape. The panel is hidden, never unmounted, so a search field in it keeps its value.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    id: ALPHA.id,
    open: false,
    pinned: false,
    onOpenChange: () => {},
    chip: <b>{ALPHA.chip}</b>,
    children: (
      <ul>
        {PANEL_ROWS.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    ),
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const Pinned: Story = {
  args: { open: true, pinned: true },
};

export const Warn: Story = {
  args: { warn: true },
};
