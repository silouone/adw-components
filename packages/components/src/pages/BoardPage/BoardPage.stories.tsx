import type { Meta, StoryObj } from "@storybook/preact-vite";
import { fn } from "storybook/test";
import { BOARD_PAGE_CHIPS, recordingActions } from "../../../fixtures/BoardPage";
import { BLOCKED } from "../../../fixtures/board/blocked";
import { EMPTY } from "../../../fixtures/board/empty";
import { STALE } from "../../../fixtures/board/stale";
import { WAVE } from "../../../fixtures/board/wave";
import { BoardPage, type BoardPageActions, BoardPageChips } from "./BoardPage";

/** Every callback of the page as a Storybook spy. */
const spies = (): BoardPageActions =>
  Object.fromEntries(
    Object.keys(recordingActions().actions).map((key) => [key, fn()]),
  ) as unknown as BoardPageActions;

const meta = {
  title: "Pages/BoardPage",
  component: BoardPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board as a view: one `BoardPageView` and one `BoardPageActions`, composed into the shell frame with the network tree or the runner rail, the focus rail and its panel, the stage header, the phase legend and one section per project. `BoardPageChips` is the header's half of the same view.",
          "**Where** Page. It is the whole board route, below the app frame's header; the run screen mounts in its `runSlot` while a run is open on the stage.",
          "**When** The board route is open. Each story is one screen state: nothing banked yet, a wave of thirteen runs on three slots with a queue, a blocked ticket selected, and a dropped stream.",
          "**Don't** Read the store or the stream: the view carries the finished sections, rails and figures, and every gesture reports through an action.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    view: WAVE,
    actions: spies(),
  },
} satisfies Meta<typeof BoardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wave: Story = {};

/** Nothing banked yet: the empty paragraph, no legend. */
export const Empty: Story = { args: { view: EMPTY } };

/** A blocked ticket selected, rail 1 shut to its strip. */
export const Blocked: Story = { args: { view: BLOCKED } };

/** The stream dropped: the last frame, marked, with the notice above it. */
export const Stale: Story = { args: { view: STALE } };

/** The header's chips for the wave: figures, slots, autonomy, filters and the view toggle. */
export const HeaderChips: Story = {
  render: () => <BoardPageChips view={BOARD_PAGE_CHIPS} actions={spies()} />,
};
