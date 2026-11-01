import type { Meta, StoryObj } from "@storybook/preact-vite";
import {
  AWAITING,
  BEHIND,
  CHANGES_REQUESTED,
  CI_FAILING,
  CI_PASSING,
  CI_PENDING,
  CONFLICTS,
  MERGED,
  MERGED_WITHOUT_APPROVAL,
  NOT_FETCHED,
  NO_REPO,
  PARKED,
  REJECTED,
  UNAVAILABLE,
  prOf,
} from "../../../fixtures/PrChips";
import { PrChips } from "./PrChips";

const meta = {
  title: "Molecules/PrChips",
  component: PrChips,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "**What** The pull-request chip row of a card: the CI verdict, the review verdict, the merge state and the PR number, or one chip saying why there is no PR.",
          "**Where** Molecule. At the foot of a board card, on a ledger row and in the run header.",
          "**When** A run has a pull request, or the reader needs to know why it has none.",
          "**Don't** Word the chips inside it: each arrives with its label and tooltip. With `pr` undefined it renders nothing, not an empty row; `compact` swaps in the short review labels for a ledger row.",
        ].join("\n\n"),
      },
    },
  },
  args: { pr: prOf(CI_PASSING, AWAITING) },
} satisfies Meta<typeof PrChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenAndGreen: Story = {};

export const Compact: Story = {
  args: { pr: prOf(CI_PASSING, CHANGES_REQUESTED), compact: true },
};

export const CiFailing: Story = {
  args: { pr: prOf(CI_FAILING, AWAITING) },
};

export const CiPending: Story = {
  args: { pr: prOf(CI_PENDING) },
};

export const MergeConflicts: Story = {
  args: { pr: prOf(CI_PASSING, AWAITING, CONFLICTS) },
};

export const BehindBase: Story = {
  args: { pr: prOf(CI_PASSING, AWAITING, BEHIND) },
};

export const ParkedDraft: Story = {
  args: { pr: prOf(CI_PASSING, undefined, PARKED) },
};

export const Merged: Story = {
  args: { pr: prOf(CI_PASSING, MERGED) },
};

export const MergedWithoutApproval: Story = {
  args: { pr: prOf(CI_PASSING, MERGED_WITHOUT_APPROVAL) },
};

export const Rejected: Story = {
  args: { pr: prOf(CI_PASSING, REJECTED) },
};

export const NoRepo: Story = {
  args: { pr: NO_REPO },
};

export const GithubUnavailable: Story = {
  args: { pr: UNAVAILABLE },
};

export const NotFetched: Story = {
  args: { pr: NOT_FETCHED },
};

export const NoPr: Story = {
  args: { pr: undefined },
};
