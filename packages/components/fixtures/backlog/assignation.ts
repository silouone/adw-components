import type {
  BacklogPageView,
  BacklogProjectChipView,
} from "../../src/pages/BacklogPage/BacklogPage";
import { backlogRow, backlogRowView, dispatchLineFor } from "../BacklogRow";
import { BACKLOG_PAGE_HERO, BACKLOG_PAGE_VIEW } from "../BacklogPage";
import { FEATURE_TREE, FEATURE_TREE_EMPTY } from "../FeatureMenu";
import { deskView } from "../ReviewDesk";

// The assignation feature: nine projects share one feature, shown with every project on and the
// feature picked. The names and the counts are invented; the shape is the committed assignation
// fixture's (epics are rows, every ticket belongs to the feature).

const PROJECTS: readonly string[] = [
  "adw-factory",
  "adw-components",
  "adw-site",
  "cqc-be",
  "cqc-fe",
  "courses",
  "api-content",
  "infra",
  "docs",
];

const chipOf = (name: string, hue: number): BacklogProjectChipView => ({
  name,
  hue,
  on: true,
  out: false,
  counts: [
    { state: "ready", n: 2 },
    { state: "waiting", n: 1 },
  ],
  bar: { done: 3, total: 9 },
  tree: name === "adw-factory" ? FEATURE_TREE : FEATURE_TREE_EMPTY,
});

const ROWS = PROJECTS.slice(0, 4).map((project, n) =>
  backlogRow({
    id: `${project}-0${n + 1}`,
    project,
    title: `Assignation step ${n + 1}`,
    lane: n % 2 === 0 ? "feat" : "chore",
    priority: 1 + (n % 3),
  }),
);

/** Nine projects on, the assignation feature picked, four ready rows, the next-up row shown. */
export const ASSIGNATION: BacklogPageView = {
  ...BACKLOG_PAGE_VIEW,
  head: {
    ...BACKLOG_PAGE_VIEW.head,
    chips: {
      open: 27,
      allOn: true,
      projects: PROJECTS.map((name, n) => chipOf(name, n % 8)),
      noStore: [],
      showNoStore: false,
      graphOn: false,
    },
    features: { tree: FEATURE_TREE, picked: "assignation" },
    filters: { ...BACKLOG_PAGE_VIEW.head.filters, q: "", anyOn: false },
  },
  desk: { view: deskView(2), open: true, prFilter: [] },
  hero: {
    ...BACKLOG_PAGE_HERO,
    row: ROWS[0] ?? BACKLOG_PAGE_HERO.row,
    idText: "01",
    dispatch: dispatchLineFor("adw-factory-01", "adw-factory"),
    project: "adw-factory",
  },
  sections: [{ key: "ready", rows: ROWS, collapsed: false }],
  rows: Object.fromEntries(
    ROWS.map((row, n) => [
      row.id,
      {
        view: backlogRowView({
          idText: `0${n + 1}`,
          dispatchLine: dispatchLineFor(row.id, row.project),
        }),
        hue: n % 8,
        cursor: n === 0,
        selected: false,
        tabbable: n === 0,
      },
    ]),
  ),
  hues: Object.fromEntries(PROJECTS.map((name, n) => [name, n % 8])),
  drawer: undefined,
};
