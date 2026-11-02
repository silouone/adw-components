import type { Meta, StoryObj } from "@storybook/preact-vite";
import { fn } from "storybook/test";
import {
  BACKLOG_PAGE_EMPTY,
  BACKLOG_PAGE_LOADING,
  noopPageActions,
} from "../../../fixtures/BacklogPage";
import { ASSIGNATION } from "../../../fixtures/backlog/assignation";
import { DRAWER_OPEN_SEARCH_HIT } from "../../../fixtures/backlog/drawer-open-search-hit";
import { BacklogPage, type BacklogPageActions } from "./BacklogPage";

/** Every callback of the page as a Storybook spy. */
const spies = (): BacklogPageActions => {
  const { drawer, ...page } = noopPageActions();
  const spy = <T extends object>(shape: T): T =>
    Object.fromEntries(Object.keys(shape).map((key) => [key, fn()])) as T;
  return { ...spy(page), drawer: spy(drawer) };
};

const meta = {
  title: "Pages/BacklogPage",
  component: BacklogPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The backlog as a view: one `BacklogPageView` and one `BacklogPageActions`, composed into the backlog frame with the project chips, the filter bar, the review desk, the next-up row, the state-major sections, the ticket panel and the graph drawer.",
          "**Where** Page. It is the whole backlog route, below the app frame's header.",
          "**When** The backlog route is open. Each story is one screen state: the assignation feature across nine projects, the graph drawer open on a search hit, the page before its first frame, and a filter that matches nothing.",
          "**Don't** Read the store or the stream: the view carries the finished rows, chips and figures, and every gesture reports through an action. The page keeps only the open flags of its three menus.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: ASSIGNATION,
    actions: spies(),
  },
} satisfies Meta<typeof BacklogPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assignation: Story = {};

export const DrawerOpenSearchHit: Story = { args: { view: DRAWER_OPEN_SEARCH_HIT } };

/** Nothing has arrived yet: the loading line and no column header. */
export const Loading: Story = { args: { view: BACKLOG_PAGE_LOADING } };

/** A query matching nothing: the empty line. */
export const NothingMatches: Story = { args: { view: BACKLOG_PAGE_EMPTY } };
