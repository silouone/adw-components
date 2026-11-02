import type { BoardPageView } from "../../src/pages/BoardPage/BoardPage";
import {
  BOARD_PAGE_BASE,
  boardItem,
  boardSection,
  gridOf,
  panelFor,
  SHELL_BASE,
  WAVE_BLOCKED,
} from "../BoardPage";
import { FOCUS_BODIES } from "../FocusPanel";

/** One project, its exporter blocked and selected; rail 1 shut to its strip, rail 2 open. */
export const BLOCKED: BoardPageView = {
  ...BOARD_PAGE_BASE,
  grid: gridOf([
    boardSection("proj-c", [
      boardItem("blocked", WAVE_BLOCKED, "Unstick the exporter"),
      boardItem("green", "proj-c-1-add-the-probe", "Add the probe"),
    ]),
  ]),
  shell: {
    ...SHELL_BASE,
    hostOpen: false,
    selected: WAVE_BLOCKED,
    focusOpen: true,
    focus: {
      panel: panelFor(WAVE_BLOCKED, {
        glyph: "✕",
        tone: "bad",
        text: "blocked — gates red",
        title: "gates failed twice",
      }),
      body: FOCUS_BODIES.run,
    },
  },
};
