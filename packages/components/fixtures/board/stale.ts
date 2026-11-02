import type { BoardPageView } from "../../src/pages/BoardPage/BoardPage";
import { BOARD_PAGE_BASE, BOARD_PAGE_NOTICE, gridOf, WAVE_SECTIONS } from "../BoardPage";

/** The stream dropped: the wave as last seen, the frame marked and the notice above it. */
export const STALE: BoardPageView = {
  ...BOARD_PAGE_BASE,
  grid: gridOf(WAVE_SECTIONS),
  shell: { ...BOARD_PAGE_BASE.shell, stale: true, staleNotice: BOARD_PAGE_NOTICE },
};
