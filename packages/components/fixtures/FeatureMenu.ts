import type { FeatureMenuLabels, FeatureTree } from "../src/molecules/FeatureMenu/FeatureMenu";

// Hand-written view models for `<FeatureMenu/>`: its test and its stories read these.

/** The words the host passes for the menu and the project panel. */
export const FEATURE_LABELS: FeatureMenuLabels = {
  feature: "feature",
  none: "— no feature —",
  open: "open",
  done: "done",
  unfiled: (count) => `unfiled · bugs and one-offs · ${count} open`,
};

/** Two top features, one with two children, one idle; two open rows are in no feature. */
export const FEATURE_TREE: FeatureTree = {
  groups: [
    {
      top: { name: "board", label: "board", open: 4, done: 6, total: 10, spans: 2 },
      children: [
        { name: "board/cards", label: "cards", open: 3, done: 2, total: 5, spans: 1 },
        { name: "board/filters", label: "filters", open: 0, done: 4, total: 4, spans: 1 },
      ],
    },
    {
      top: { name: "tokens", label: "tokens", open: 0, done: 3, total: 3, spans: 1 },
      children: [],
    },
  ],
  unfiled: 2,
};

/** No feature at all. */
export const FEATURE_TREE_EMPTY: FeatureTree = { groups: [], unfiled: 0 };
