import type { Meta, StoryObj } from "@storybook/preact-vite";
import { fn } from "storybook/test";
import { appHeaderHref } from "../../../fixtures/AppFrame";
import { BACKLOG_ROUTE } from "../../../fixtures/app/backlog-route";
import { BOARD_ROUTE } from "../../../fixtures/app/board-route";
import { AppFrame } from "./AppFrame";

const meta = {
  title: "Pages/AppFrame",
  component: AppFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The application's frame as a view: the one header every screen shares (brand, the Board and Backlog tabs, the screen's context, the usage chip), the usage panel and the screen below.",
          "**Where** Page. It wraps the board, backlog and run pages; the container fills `context` and `screen` with the page views of the route.",
          "**When** Always: the header stays mounted across a tab switch, only the context and the screen change. Each story is one route.",
          "**Don't** Read the route or the usage from the store, or set the document title: the view carries the route, the page class and the usage figures, and the tabs report through `onNavigate`.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: BOARD_ROUTE,
    actions: {
      hrefFor: appHeaderHref,
      onNavigate: fn(),
      onToggleUsage: fn(),
      onCloseUsage: fn(),
    },
    context: <span>5 runs · 2 live</span>,
    screen: <main>The board page fills this slot.</main>,
  },
} satisfies Meta<typeof AppFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BoardRoute: Story = {};

export const BacklogRoute: Story = {
  args: {
    view: BACKLOG_ROUTE,
    context: <span>82 open</span>,
    screen: <main>The backlog page fills this slot.</main>,
  },
};
