import type { AppFrameView } from "../../src/pages/AppFrame/AppFrame";
import { APP_FRAME_BASE } from "../AppFrame";

/** The backlog tab is active; its header context is loose, not the board's tight row. */
export const BACKLOG_ROUTE: AppFrameView = {
  ...APP_FRAME_BASE,
  route: "backlog",
  pageClass: "page page-backlog",
  ctxTight: false,
};
