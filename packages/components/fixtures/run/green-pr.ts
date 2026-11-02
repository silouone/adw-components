import type { RunPageView } from "../../src/pages/RunPage/RunPage";
import { FINISHED } from "../RunHeader";
import { RUN_PAGE_BASE, RUN_SCREEN } from "../RunPage";

/** A green run whose pull request passes CI, embedded on the board's stage. */
export const GREEN_PR: RunPageView = {
  ...RUN_PAGE_BASE,
  embedded: true,
  run: {
    ...RUN_SCREEN,
    head: FINISHED,
    prChip: { ci: { kind: "passing", label: "CI passing", title: "all checks passed" } },
  },
};
