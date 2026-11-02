import "./AppFrame.css";

import type { ComponentChildren } from "preact";
import { UsageChip, type UsageChipView } from "../../molecules/UsageChip/UsageChip";
import {
  UsagePanel,
  type UsagePanelLabels,
  type UsagePanelView,
} from "../../organisms/UsagePanel/UsagePanel";
import { AppHeaderFrame, type AppHeaderTab } from "../../templates/AppHeaderFrame/AppHeaderFrame";

// `<AppFrame/>`: the application's frame, a pure view. One persistent header (brand, the Board and
// Backlog tabs, the active screen's context, the usage chip) over the screen the route picks; the
// usage panel is a sibling of the header, never inside it, because it floats over the page. The
// route, the page class and every word arrive in an `AppFrameView`; a tab click and the chip report
// through `AppFrameActions`. The context and the screen are slots filled by the container with the
// page views of the route.

export type AppRoute = "board" | "backlog" | "run";

export interface AppFrameUsageView {
  readonly chip: UsageChipView;
  /** The chip's name, shown while it loads or is unavailable. */
  readonly chipLabel: string;
  readonly open: boolean;
  readonly panel: UsagePanelView;
  readonly panelLabels: UsagePanelLabels;
}

export interface AppFrameView {
  readonly route: AppRoute;
  /** The page's class list, derived from the route and the screen state by the container. */
  readonly pageClass: string;
  readonly brand: string;
  readonly tabs: readonly AppHeaderTab[];
  /** The context holds dropdown chips: one row, tight gap. */
  readonly ctxTight: boolean;
  readonly usage: AppFrameUsageView;
}

export interface AppFrameActions {
  /** The tab's link target, token already folded in. */
  readonly hrefFor: (route: string) => string;
  /** Client-side switch; absent → the tabs are plain links (the run screen). */
  readonly onNavigate?: ((route: string) => void) | undefined;
  readonly onToggleUsage: () => void;
  readonly onCloseUsage: () => void;
}

export interface AppFrameProps {
  readonly view: AppFrameView;
  readonly actions: AppFrameActions;
  /** The active screen's counts and controls, inside the header. */
  readonly context?: ComponentChildren;
  /** The screen below the header. */
  readonly screen?: ComponentChildren;
}

export function AppFrame({ view, actions, context, screen }: AppFrameProps) {
  const { usage } = view;
  return (
    <div class={view.pageClass}>
      <AppHeaderFrame
        brand={view.brand}
        tabs={view.tabs}
        route={view.route === "run" ? undefined : view.route}
        hrefFor={actions.hrefFor}
        onNavigate={actions.onNavigate}
        ctxTight={view.ctxTight}
        context={context}
        chip={
          <UsageChip
            view={usage.chip}
            open={usage.open}
            label={usage.chipLabel}
            onToggle={actions.onToggleUsage}
          />
        }
      />
      <UsagePanel
        view={usage.panel}
        labels={usage.panelLabels}
        open={usage.open}
        onClose={actions.onCloseUsage}
      />
      {screen}
    </div>
  );
}
