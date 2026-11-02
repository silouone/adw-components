import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BOARD_GRID_COLUMNS,
  BOARD_GRID_EMPTY,
  BOARD_GRID_NO_MATCH,
  BOARD_GRID_NOTICES,
} from "../../../fixtures/BoardGrid";
import { PHASE_LEGEND_LABELS, PHASES } from "../../../fixtures/PhaseLegend";
import { SECTION_CARDS, SECTION_LABELS, SECTION_LEDGER } from "../../../fixtures/SectionView";
import { PhaseLegend } from "../../atoms/PhaseLegend/PhaseLegend";
import { SectionView } from "../../organisms/SectionView/SectionView";
import { BoardGrid } from "./BoardGrid";

const noop = (): void => {};

/** Sections are keyed by their target: a section keeps its open flag across an update. */
const sections = (layout: typeof SECTION_CARDS) =>
  [layout, { ...layout, target: "acme-gadgets" }].map((view) => (
    <SectionView
      key={view.target}
      view={view}
      labels={SECTION_LABELS}
      onPause={() => Promise.resolve(undefined)}
      onContinue={() => Promise.resolve(undefined)}
      onCopy={noop}
    />
  ));

const legend = <PhaseLegend phases={PHASES} labels={PHASE_LEGEND_LABELS} />;

const meta = {
  title: "Templates/BoardGrid",
  component: BoardGrid,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board's frame, top to bottom: the notices, the empty paragraph, the phase legend, the ledger's column header, the sections in a column, and the message for a filter that hides every ticket.",
          "**Where** Template. It places `PhaseLegend` and one `SectionView` per project.",
          "**When** The board draws its projects, as cards or as a ledger, or tells the reader why it is empty.",
          "**Don't** Count tickets or build sections: the caller decides which parts exist and passes the sections as keyed children. Every word arrives as a prop.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    notices: [],
    legend,
    noMatch: BOARD_GRID_NO_MATCH,
    children: sections(SECTION_CARDS),
  },
} satisfies Meta<typeof BoardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};

export const Ledger: Story = {
  args: { columns: BOARD_GRID_COLUMNS, children: sections(SECTION_LEDGER) },
};

export const Empty: Story = {
  args: {
    legend: undefined,
    noMatch: undefined,
    children: undefined,
    empty: (
      <>
        {BOARD_GRID_EMPTY} <code>adw run</code>
      </>
    ),
  },
};

export const NoMatch: Story = {
  args: { children: undefined },
};

export const Notices: Story = {
  args: { notices: BOARD_GRID_NOTICES },
};
