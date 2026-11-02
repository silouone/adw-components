// Hand-written view models for `<AppFrame/>`: its test and its stories read these; the two route
// states live in `./app/`.

import type { AppFrameView } from "../src/pages/AppFrame/AppFrame";
import { APP_HEADER_BRAND, APP_HEADER_TABS, appHeaderHref } from "./AppHeaderFrame";
import { TWO_GAUGES, USAGE_LABEL } from "./UsageChip";
import { USAGE_PANEL, USAGE_PANEL_LABELS } from "./UsagePanel";

export { appHeaderHref };

/** The board route, the usage panel shut. */
export const APP_FRAME_BASE: AppFrameView = {
  route: "board",
  pageClass: "page page-board",
  brand: APP_HEADER_BRAND,
  tabs: APP_HEADER_TABS,
  ctxTight: true,
  usage: {
    chip: TWO_GAUGES,
    chipLabel: USAGE_LABEL,
    open: false,
    panel: USAGE_PANEL,
    panelLabels: USAGE_PANEL_LABELS,
  },
};
