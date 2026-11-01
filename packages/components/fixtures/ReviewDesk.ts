import type {
  DeskCardView,
  DeskView,
  ReviewDeskLabels,
} from "../src/organisms/ReviewDesk/ReviewDesk";

// Hand-written view models for `<ReviewDesk/>`: its test and its stories read these.

export const REVIEW_DESK_LABELS: ReviewDeskLabels = {
  title: "review desk",
  open: "open PR",
  ready: "merge-ready",
  oldest: "oldest",
  note: "a column filters the list · a card opens the ticket",
  empty: "no open PR in this selection",
  more: (count) => `+${count} more ↓`,
};

/** A pull-request card of project `proj`, numbered `n`, aged one day. */
export const deskCard = (n: number, over: Partial<DeskCardView> = {}): DeskCardView => ({
  id: `proj-${n}`,
  project: "proj",
  title: `t${n}`,
  number: n,
  age: "1d",
  ...over,
});

/** A desk with a review column of `cardCount` cards and an empty merge column. */
export const deskView = (cardCount = 2): DeskView => ({
  columns: [
    {
      bucket: "review",
      glyph: "◐",
      label: "review",
      who: "you",
      cards: Array.from({ length: cardCount }, (_, i) => deskCard(i + 1)),
    },
    { bucket: "merge", glyph: "✓", label: "merge", who: "you", cards: [] },
  ],
  open: 2,
  ready: 1,
  oldest: "3d",
});

/** No open pull request in the selection. */
export const EMPTY_DESK: DeskView = { columns: [], open: 0, ready: 0, oldest: undefined };

/** Three columns, the way a busy selection reads. */
export const BUSY_DESK: DeskView = {
  columns: [
    {
      bucket: "review",
      glyph: "◐",
      label: "review",
      who: "you",
      cards: [
        deskCard(41, { project: "courses", title: "Add the export button", age: "2h" }),
        deskCard(42, { project: "api", title: "Fix the stale cache", age: "1d" }),
        deskCard(43, { project: "courses", title: "Tidy the settings page", age: "3d" }),
      ],
    },
    {
      bucket: "merge",
      glyph: "✓",
      label: "merge",
      who: "you",
      cards: [deskCard(40, { project: "api", title: "Bump the client", age: "5h" })],
    },
    {
      bucket: "ci",
      glyph: "✗",
      label: "fix CI",
      who: "the author",
      cards: [deskCard(39, { project: "courses", title: "Rework the sidebar", age: "4d" })],
    },
  ],
  open: 5,
  ready: 4,
  oldest: "4d",
};

export const hueOf = (project: string): number => project.length % 8;
