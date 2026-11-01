#!/usr/bin/env bash
set -euo pipefail

# Publish a branch's Storybook to Chromatic: dispatch chromatic.yml on the pushed
# branch, wait for the run, print the two links. Handles no secret: the workflow holds it.
# Usage: bun run storybook:publish [branch]   (default: the current branch)

branch="${1:-$(git branch --show-current)}"
if [ -z "$branch" ]; then
  echo "publish-storybook: no branch given and HEAD is detached" >&2
  exit 1
fi
if ! git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
  echo "publish-storybook: branch '$branch' is not on origin; push it first" >&2
  exit 1
fi

latest_run() {
  gh run list --workflow chromatic.yml --branch "$branch" --event workflow_dispatch \
    --limit 1 --json databaseId --jq '.[0].databaseId // 0'
}

before="$(latest_run)"
gh workflow run chromatic.yml --ref "$branch"

id=0
for _ in $(seq 1 30); do
  id="$(latest_run)"
  [ "$id" -gt "$before" ] && break
  sleep 2
done
if [ "$id" -le "$before" ]; then
  echo "publish-storybook: no new chromatic.yml run appeared for '$branch'" >&2
  exit 1
fi

gh run watch "$id" --exit-status
gh run view "$id" --log | grep -E '(STORYBOOK_URL|BUILD_URL)=' | sed -E 's/^.*(STORYBOOK_URL|BUILD_URL)=/\1=/' | sort -u
