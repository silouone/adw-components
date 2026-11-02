import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  BLOCKED as DOCK_BLOCKED,
  FAILURE_BANNER,
  LABELS as DOCK_LABELS,
  SUMMARY,
} from "../../../fixtures/Dock";
import { BLOCKED as STRIP_BLOCKED, FAILURE_TITLE, TICKET_ID } from "../../../fixtures/GanttStrip";
import {
  HOVER_BUILD,
  LABELS as HOVER_LABELS,
  RUN_FACES as HOVER_FACES,
  VIEWPORT,
} from "../../../fixtures/HoverCard";
import { LABELS as LANES_LABELS, LANES, LAYOUT, RUN_FACES } from "../../../fixtures/Lanes";
import {
  BLOCKED as HEAD_BLOCKED,
  IDENTITY,
  LABELS as HEADER_LABELS,
} from "../../../fixtures/RunHeader";
import { hrefFor, LABELS as ROUNDS_LABELS, ON_A_BUILD } from "../../../fixtures/RunRounds";
import {
  RUN_PAGE_CRUMB_HREF,
  RUN_PAGE_CRUMB_LABEL,
  RUN_PAGE_NOTICE,
} from "../../../fixtures/RunPageFrame";
import { RunRounds } from "../../molecules/RunRounds/RunRounds";
import { Dock } from "../../organisms/Dock/Dock";
import { GanttStrip } from "../../organisms/GanttStrip/GanttStrip";
import { HoverCard } from "../../organisms/HoverCard/HoverCard";
import { Lanes } from "../../organisms/Lanes/Lanes";
import { RunHeader } from "../../organisms/RunHeader/RunHeader";
import { RunPageFrame } from "./RunPageFrame";

const noop = (): void => {};

const header = (
  <>
    <RunHeader
      header={IDENTITY}
      head={HEAD_BLOCKED}
      tab="gantt"
      labels={HEADER_LABELS}
      onViewTab={noop}
      onFullScreen={noop}
      onScope={noop}
    />
    <RunRounds family={ON_A_BUILD} labels={ROUNDS_LABELS} hrefFor={hrefFor} />
  </>
);

const strip = (
  <GanttStrip
    header={{ ticketId: TICKET_ID, gate: "test-frontend" }}
    strip={STRIP_BLOCKED}
    failureTitle={FAILURE_TITLE}
    onFullScreen={noop}
    onScope={noop}
  />
);

const stage = (
  <Lanes
    layout={LAYOUT}
    lanes={LANES}
    faces={RUN_FACES}
    scope={undefined}
    onScope={noop}
    onHover={noop}
    labels={LANES_LABELS}
  />
);

const card = (
  <HoverCard
    faces={HOVER_FACES}
    hovered={HOVER_BUILD}
    viewport={VIEWPORT}
    zoom={1}
    labels={HOVER_LABELS}
  />
);

const dock = (full: boolean, shut: boolean) => (
  <Dock
    failure={FAILURE_BANNER}
    view={DOCK_BLOCKED}
    summary={SUMMARY}
    scope="run"
    shut={shut}
    full={full}
    md={false}
    labels={DOCK_LABELS}
    onScope={noop}
    onClose={noop}
    onShutDock={noop}
    onFullScreen={noop}
    onMarkdownToggle={noop}
  />
);

/** The run route's way back; the board's stage has none. */
const crumb = { crumbHref: RUN_PAGE_CRUMB_HREF, crumbLabel: RUN_PAGE_CRUMB_LABEL };

const meta = {
  title: "Templates/RunPageFrame",
  component: RunPageFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The run page's frame: the crumb back to the board, a notice, then the console box (the header over the stage, or in full screen only the strip), the hover card and the dock.",
          "**Where** Template. It places `RunHeader` and `RunRounds`, `Lanes`, `Ledger` or `Journey`, `GanttStrip`, `HoverCard` and `Dock`.",
          "**When** A run is open on its own route or on the board's stage; `full` swaps the console for the strip and `shut` marks the dock shut.",
          "**Don't** Measure, scroll or scope: it places the slots. With no slot at all (before the first frame) only the crumb and the notice render.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    full: false,
    shut: false,
    header,
    strip,
    stage,
    card,
    dock: dock(false, false),
  },
} satisfies Meta<typeof RunPageFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gantt: Story = { args: { ...crumb, notice: RUN_PAGE_NOTICE } };

export const Full: Story = { args: { ...crumb, full: true, dock: dock(true, false) } };

/** On the board's stage: no crumb, and the console is not the run route's flex column. */
export const Embedded: Story = { args: { embedded: true } };

export const DockShut: Story = { args: { ...crumb, shut: true, dock: dock(false, true) } };
