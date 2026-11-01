import type { Meta, StoryObj } from "@storybook/preact-vite";
import { FEATURE_LABELS, FEATURE_TREE, FEATURE_TREE_EMPTY } from "../../../fixtures/FeatureMenu";
import { FeatureMenu } from "./FeatureMenu";

const meta = {
  title: "Molecules/FeatureMenu",
  component: FeatureMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**What** The « feature ▾ » picker: a chip that opens a two-level list (a top feature, its children behind a guide line) with open counts and done/total bars. `ProjectFeaturePanel` is the same rows for one project.",
          "**Where** Molecule. In the backlog list header and in the graph drawer.",
          "**When** The reader narrows a list to one feature, or to none.",
          "**Don't** Count rows or word anything inside it: the caller passes the `tree` and the `labels`, owns `open`, and closes the menu from its own dismiss edge.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    hook: "bfeature",
    class: "",
    heading: "all features",
    buttonClass: "",
    labels: FEATURE_LABELS,
    tree: FEATURE_TREE,
    picked: undefined,
    onPick: () => {},
    open: true,
    onOpen: () => {},
    onClose: () => {},
    rootRef: { current: null },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "420px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeatureMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: { open: false },
};

export const WithPickedFeature: Story = {
  args: { picked: "board/cards" },
};

export const NoFeatures: Story = {
  args: { tree: FEATURE_TREE_EMPTY },
};
