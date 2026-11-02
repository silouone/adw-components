import type { Meta, StoryObj } from "@storybook/preact-vite";
import { FOCUS_RAIL_LABELS, FOCUS_RAIL_TABS } from "../../../fixtures/FocusRail";
import { FOCUS_BODIES, FOCUS_PANEL, FOCUS_PANEL_LABELS } from "../../../fixtures/FocusPanel";
import { NETWORK, NETWORK_LABELS, NETWORK_TALLY } from "../../../fixtures/NetworkTree";
import { RUNNER_RAIL, RUNNER_RAIL_LABELS } from "../../../fixtures/RunnerRail";
import { SECTION_CARDS, SECTION_LABELS } from "../../../fixtures/SectionView";
import { CRUMBS_THREE, STAGE_LABELS } from "../../../fixtures/StageHeader";
import { SHELL_NOTICE, SHELL_RAIL1_WIDTH, SHELL_RAIL2_WIDTH } from "../../../fixtures/ShellFrame";
import { FocusPanel } from "../../organisms/FocusPanel/FocusPanel";
import { focusBodyOf } from "../../organisms/FocusPanel/focusTabs";
import { FocusRail } from "../../organisms/FocusRail/FocusRail";
import { NetworkTree } from "../../organisms/NetworkTree/NetworkTree";
import { RunnerRail } from "../../organisms/RunnerRail/RunnerRail";
import { SectionView } from "../../organisms/SectionView/SectionView";
import { StageHeader } from "../../molecules/StageHeader/StageHeader";
import { ShellFrame } from "./ShellFrame";

const noop = (): void => {};

const networkTree = (
  <NetworkTree
    net={NETWORK}
    tally={NETWORK_TALLY}
    labels={NETWORK_LABELS}
    hostFilter="*"
    projFilter="*"
    selected={null}
    expandedRunners={new Set(["local"])}
    collapsedProjects={new Set<string>()}
    onFilter={noop}
    onToggleRail={noop}
    onToggleRunner={noop}
    onToggleProject={noop}
    onOpenRun={noop}
  />
);

const runnerRail = (
  <RunnerRail
    view={RUNNER_RAIL}
    labels={RUNNER_RAIL_LABELS}
    hostFilter="*"
    expandedRunners={new Set<string>()}
    onHoverRunner={noop}
    onFilter={noop}
    onToggleRail={noop}
    onToggleRunner={noop}
  />
);

const focusRail = (open: boolean) => (
  <FocusRail
    selected="sabado-276-strip-tags"
    tab="run"
    open={open}
    tabs={FOCUS_RAIL_TABS}
    labels={FOCUS_RAIL_LABELS}
    panel={
      open ? (
        <FocusPanel
          view={FOCUS_PANEL}
          labels={FOCUS_PANEL_LABELS}
          token="tok"
          density="rail"
          onFocusTab={noop}
          onFocusOpen={noop}
          onAction={async () => undefined}
          onCopy={noop}
          onStage={noop}
        >
          {focusBodyOf(FOCUS_BODIES.run)}
        </FocusPanel>
      ) : undefined
    }
    onFocusTab={noop}
    onFocusOpen={noop}
  />
);

const stage = (
  <>
    <StageHeader
      crumbs={CRUMBS_THREE}
      labels={STAGE_LABELS}
      onCloseRun={noop}
      onFullScreen={noop}
      onCopy={noop}
    />
    {[SECTION_CARDS, { ...SECTION_CARDS, target: "acme-gadgets" }].map((view) => (
      <SectionView
        key={view.target}
        view={view}
        labels={SECTION_LABELS}
        onPause={() => Promise.resolve(undefined)}
        onContinue={() => Promise.resolve(undefined)}
        onCopy={noop}
      />
    ))}
  </>
);

const meta = {
  title: "Templates/ShellFrame",
  component: ShellFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The board's frame: a `[rail 1][rail 2][stage]` grid under the top bar, with the rails' open states and widths as props and a notice for a dropped stream.",
          "**Where** Template. It places `NetworkTree` or `RunnerRail` in the first rail, `FocusRail` in the second and the stage header over the board in the stage.",
          "**When** The board and the run screen need their rails and their stage side by side. Below the rail breakpoint an open rail floats over the stage and the stage takes the width.",
          "**Don't** Decide which rail is a strip or a panel, read the viewport, or own the flyout close: the caller passes the open flags and the words of the notice.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    rail1: networkTree,
    rail2: focusRail(true),
    stage,
    rail1Open: true,
    rail2Open: true,
    stale: false,
  },
} satisfies Meta<typeof ShellFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both rails open: at the `rail` viewport the panels float over the stage. */
export const BothRailsOpen: Story = {
  args: { rail1Width: SHELL_RAIL1_WIDTH },
  globals: { viewport: { value: "rail", isRotated: false } },
};

/** Both rails shut to their strips, at the `narrow` viewport. */
export const Collapsed: Story = {
  args: {
    rail1: runnerRail,
    rail2: focusRail(false),
    rail1Open: false,
    rail2Open: false,
    rail2Width: SHELL_RAIL2_WIDTH,
  },
  globals: { viewport: { value: "narrow", isRotated: false } },
};

export const Stale: Story = {
  args: { stale: true, staleNotice: SHELL_NOTICE },
};
