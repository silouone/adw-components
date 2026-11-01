import type { HandlesLabels, HandlesView } from "../src/molecules/Handles/Handles";

// Hand-written view models for `<Handles/>`: its test and its stories read these.

/** The words the host passes for the section. */
export const HANDLES_LABELS: HandlesLabels = {
  title: "handles",
  hint: "click to copy",
  copied: "copied",
};

export const WORKSPACE = "/home/silou/adw/runs/adw-board-15-handles-1793563146456/workspace";
const RUN_ID = "adw-board-15-handles-1793563146456";

/** Eight rows (a long workspace path among them) and the four commands of a running card. */
export const HANDLES_FULL: HandlesView = {
  rows: [
    { key: "ticket", value: "adw-board-15-handles", shown: "adw-board-15-handles" },
    { key: "run", value: RUN_ID, shown: "…ndles-1793563146456" },
    {
      key: "workspace",
      value: WORKSPACE,
      shown: "…runs/adw-board-15-handles-1793563146456/workspace",
      hint: "worktree",
    },
    { key: "branch", value: "adw/adw-board-15-handles", shown: "adw/adw-board-15-handles" },
    { key: "pr", value: "https://github.com/silouone/adw-factory/pull/12", shown: "#12 open" },
    { key: "base", value: "abcdef1234567", shown: "abcdef1" },
    { key: "journal", value: `runs/${RUN_ID}/journal.jsonl`, shown: "journal.jsonl" },
    { key: "target", value: "adw-factory", shown: "adw-factory" },
  ],
  commands: [
    { label: "journal", command: `adw journal ${RUN_ID}` },
    { label: "fails", command: `adw fails ${RUN_ID}` },
    { label: "workspace", command: `cd ${WORKSPACE}` },
    { label: "watch", command: `tail -f runs/${RUN_ID}/journal.jsonl` },
  ],
};

/** A short value: nothing is cut, no ellipsis. */
export const HANDLES_SHORT: HandlesView = {
  rows: [{ key: "ticket", value: "sabado-1", shown: "sabado-1" }],
  commands: [],
};

/** A finished run: no `watch` command. */
export const HANDLES_FINISHED: HandlesView = {
  rows: HANDLES_FULL.rows,
  commands: HANDLES_FULL.commands.filter((c) => c.label !== "watch"),
};

/** A blocked run with green gates and no PR: the `publish` command is offered. */
export const HANDLES_PUBLISH: HandlesView = {
  rows: HANDLES_FULL.rows,
  commands: [
    ...HANDLES_FINISHED.commands,
    { label: "publish", command: "adw publish --target sabado --ticket adw-board-15-handles" },
  ],
};
