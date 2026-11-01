import type {
  CiView,
  MergeView,
  PrAbsentView,
  PrFoundView,
  ValidationView,
} from "../src/molecules/PrChips/PrChips";

// Hand-written view models for `<PrChips/>` and `<Ci/>`: their test and stories read these.

export const PR_URL = "https://github.com/acme/widgets/pull/61";
export const JOB_URL = "https://github.com/acme/widgets/actions/runs/1/job/2";

export const CI_PASSING: CiView = {
  kind: "passing",
  label: "CI green",
  title: "CI: all checks passing",
};

export const CI_FAILING: CiView = {
  kind: "failing",
  label: "unit-tests",
  title: "CI failing: unit-tests",
  url: JOB_URL,
};

/** A failing check with neither a name nor a job to link to. */
export const CI_FAILING_BARE: CiView = {
  kind: "failing",
  label: "CI failing",
  title: "CI failing",
};

export const CI_CANCELLED: CiView = { kind: "no-verdict", label: "CI", title: "CI: cancelled" };
export const CI_PENDING: CiView = {
  kind: "no-verdict",
  label: "CI",
  title: "CI: pending — checks still running",
};
export const CI_NO_CHECKS: CiView = {
  kind: "no-verdict",
  label: "CI",
  title: "CI: no checks reported",
};

/** A check name that tries to be markup. */
export const CI_HOSTILE: CiView = {
  kind: "failing",
  label: '<img src=x onerror="alert(1)">',
  title: "CI failing",
  url: "https://ci.example/1",
};

export const MERGED: ValidationView = {
  kind: "merged",
  label: "merged",
  title: "PR merged",
  withoutApproval: false,
};
export const MERGED_WITHOUT_APPROVAL: ValidationView = {
  kind: "merged",
  label: "merged",
  title:
    "merged without an approving review — an admin override, or a review dismissed by a later push",
  withoutApproval: true,
};
export const REJECTED: ValidationView = {
  kind: "rejected",
  label: "rejected",
  title: "PR closed without merging — closure is rejection",
};
export const APPROVED: ValidationView = {
  kind: "approved",
  label: "approved",
  title: "approved, not merged yet",
};
export const CHANGES_REQUESTED: ValidationView = {
  kind: "changes-requested",
  label: "changes requested",
  compactLabel: "changes",
  title: "a reviewer requested changes",
};
export const REVIEW_REQUIRED: ValidationView = {
  kind: "review-required",
  label: "review required",
  compactLabel: "review req.",
  title: "the base branch requires a review that has not happened yet",
};
export const AWAITING: ValidationView = {
  kind: "awaiting",
  label: "awaiting review",
  compactLabel: "awaiting",
  title: "PR is open",
};

export const CONFLICTS: MergeView = {
  kind: "conflicts",
  label: "conflicts",
  title: "the PR conflicts with its base branch",
};
export const BEHIND: MergeView = {
  kind: "behind",
  label: "behind",
  title: "the base branch has moved ahead of this PR",
};
export const PARKED: MergeView = {
  kind: "parked",
  label: "parked",
  title: "draft parked, awaiting a rebase",
};

export const NO_REPO: PrAbsentView = {
  kind: "no-repo",
  label: "no repo",
  title: 'no GitHub repo for this target — set "github" in the target file',
};
export const UNAVAILABLE: PrAbsentView = {
  kind: "unavailable",
  label: "gh",
  title: "GitHub is unavailable (logged out, offline or rate-limited)",
};
export const NOT_FETCHED: PrAbsentView = {
  kind: "unfetched",
  label: "",
  title: "PR state not fetched yet",
};
export const UNMATCHED: PrAbsentView = {
  kind: "unfetched",
  label: "",
  title: "no PR found for this run's branch in the last fetch",
};

/** A PR view from its chips; the number and URL are fixed. */
export const prOf = (
  ci: CiView = CI_PASSING,
  validation?: ValidationView,
  merge?: MergeView,
): PrFoundView => ({
  kind: "pr",
  number: 61,
  url: PR_URL,
  ci,
  ...(validation !== undefined ? { validation } : {}),
  ...(merge !== undefined ? { merge } : {}),
});
