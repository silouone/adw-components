import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BOARD_CHIPS, BOARD_CHIPS_FILTERS, BOARD_CHIPS_LABELS } from "../../../fixtures/BoardChips";
import { TWO_GAUGES, USAGE_LABEL } from "../../../fixtures/UsageChip";
import { APP_HEADER_BRAND, APP_HEADER_TABS, appHeaderHref } from "../../../fixtures/AppHeaderFrame";
import { UsageChip } from "../../molecules/UsageChip/UsageChip";
import { BoardChips } from "../../organisms/BoardChips/BoardChips";
import { AppHeaderFrame } from "./AppHeaderFrame";

const noop = (): void => {};

const boardChips = (
  <BoardChips
    view={BOARD_CHIPS}
    labels={BOARD_CHIPS_LABELS}
    autonomy={undefined}
    filters={BOARD_CHIPS_FILTERS}
    boardView="cards"
    open={undefined}
    pinned={undefined}
    onDropdown={noop}
    onFilter={noop}
    onWindow={noop}
    onView={noop}
    onOpenRun={noop}
  />
);

const usageChip = <UsageChip view={TWO_GAUGES} open={false} label={USAGE_LABEL} onToggle={noop} />;

const meta = {
  title: "Templates/AppHeaderFrame",
  component: AppHeaderFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The one header every screen shares: the brand, the tabs as real links, the active screen's own context, and the usage chip last.",
          "**Where** Template. Its context slot takes `BoardChips` on the board; its chip slot takes `UsageChip`.",
          "**When** The reader switches screens: the header stays mounted, and only the context and the screen below it change.",
          "**Don't** Read the address bar: `hrefFor` builds the links, token included. Without `onNavigate` the tabs are plain links; a modifier or middle click always keeps the browser's own behaviour.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    brand: APP_HEADER_BRAND,
    tabs: APP_HEADER_TABS,
    route: "board",
    hrefFor: appHeaderHref,
    context: boardChips,
    chip: usageChip,
  },
} satisfies Meta<typeof AppHeaderFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Board: Story = { args: { onNavigate: noop, ctxTight: true } };

export const Backlog: Story = {
  args: { route: "backlog", onNavigate: noop, context: <span>12 open · 3 ready</span> },
};

/** The run screen: no tab is active and the tabs are plain links. */
export const RunScreen: Story = {
  args: { route: undefined, context: <span>run 1791963430406</span> },
};
