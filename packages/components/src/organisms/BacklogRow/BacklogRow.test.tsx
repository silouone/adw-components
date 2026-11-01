// `<BacklogRow/>`: one row over its data, its view and its labels. Literal view models; the
// age buckets, the wave maths, the met-dep filter and the why-line projection are the
// factory's, so their cases stay there.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BACKLOG_ROW_LABELS,
  BACKLOG_TOKEN,
  BLOCKED_ROW,
  BLOCKED_VIEW,
  backlogRow,
  backlogRowView,
  backlogRowWithoutLane,
  dispatchLineFor,
  REVIEW_PR,
  waitingRow,
  waitingView,
} from "../../../fixtures/BacklogRow";
import { BacklogRow, type BacklogRowProps, runHrefOf } from "./BacklogRow";

afterEach(cleanup);

const mount = (over: Partial<BacklogRowProps> = {}) => {
  const onSelect = mock((_id: string) => {});
  const onCopy = mock((_text: string, _label: string) => {});
  const out = render(
    <BacklogRow
      row={backlogRow()}
      token={BACKLOG_TOKEN}
      view={backlogRowView()}
      labels={BACKLOG_ROW_LABELS}
      onSelect={onSelect}
      onCopy={onCopy}
      {...over}
    />,
  );
  return { ...out, onSelect, onCopy };
};
const rowEl = (c: Element) => c.querySelector(".bl-row") as HTMLElement;
const whyEl = (c: Element) => c.querySelector(".bl-why") as HTMLElement;

describe("<BacklogRow/> — done vs rejected glyphs differ", () => {
  test("a done row and a rejected row render distinct glyphs", () => {
    const done = mount({ row: backlogRow({ closed: true, status: "done" }) });
    const rejected = mount({ row: backlogRow({ closed: true, status: "rejected" }) });
    const doneGlyph = done.container.querySelector(".bl-glyph")?.textContent;
    const rejectedGlyph = rejected.container.querySelector(".bl-glyph")?.textContent;
    expect(doneGlyph).toBeTruthy();
    expect(rejectedGlyph).toBeTruthy();
    expect(doneGlyph).not.toBe(rejectedGlyph);
  });
});

describe("<BacklogRow/> — a stale row shows its drift cause, not a bare marker", () => {
  test("drift renders on the why-line; there is no separate .bl-stale marker", () => {
    const { container } = mount({
      row: backlogRow({
        state: "in-flight",
        status: "in-progress",
        drift: "in-progress, no live run",
      }),
      view: backlogRowView({
        section: "in-flight",
        why: { text: "⚠ in-progress, no live run", tone: "warn" },
      }),
    });
    expect(whyEl(container).textContent).toBe("⚠ in-progress, no live run");
    expect(container.querySelector(".bl-stale")).toBeNull();
  });
});

describe("<BacklogRow/> — 'review: off' marker gated on review===false", () => {
  test("review:false renders the marker; review absent does not", () => {
    const off = mount({ row: backlogRow({ review: false }) });
    const noField = mount();
    expect(off.container.querySelector(".bl-review-off")?.textContent).toBe("review: off");
    expect(noField.container.querySelector(".bl-review-off")).toBeNull();
  });
});

describe("<BacklogRow/> — row click selects the row", () => {
  test("clicking the row (not the copy button) reports this row's id", () => {
    const { container, onSelect } = mount({ row: backlogRow({ id: "click-me" }) });
    fireEvent.click(rowEl(container));
    expect(onSelect).toHaveBeenCalledWith("click-me");
  });
});

describe("<BacklogRow/> — copy button copies the id, does not select the row", () => {
  test("clicking the copy button hands the id to onCopy and selects nothing", () => {
    const { container, onSelect, onCopy } = mount({ row: backlogRow({ id: "copy-me" }) });
    fireEvent.click(container.querySelector(".bl-copy") as HTMLElement);
    expect(onCopy).toHaveBeenCalledWith("copy-me", "id");
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("<BacklogRow/> — epic rows", () => {
  test("shows children progress, no dep chips, no PR link", () => {
    const { container } = mount({
      row: backlogRow({
        id: "epic-1",
        kind: "epic",
        deps: [{ id: "x", status: "done", met: true, hard: false }],
        lastPr: "42",
      }),
      view: backlogRowView({ why: { text: "3/5 done", tone: "dim" } }),
    });
    expect(container.textContent).toContain("3/5 done");
    expect(container.querySelector(".dep-hard, .dep-soft")).toBeNull();
    expect(container.querySelector("a[href*='42']")).toBeNull();
  });
});

describe("<BacklogRow/> — malformed rows", () => {
  test("shows parseError", () => {
    const { container } = mount({
      row: backlogRow({ id: "malformed-1", kind: "malformed", parseError: "priority: missing" }),
      view: backlogRowView({ why: { text: "priority: missing", tone: "bad" } }),
    });
    expect(container.textContent).toContain("priority: missing");
  });
});

describe("<BacklogRow/> — manual rows", () => {
  test("glyph + title only — no children progress, no parseError leaking in", () => {
    const { container } = mount({
      row: backlogRow({ id: "manual-1", kind: "manual", title: "A manual step" }),
    });
    expect(container.querySelector(".bl-title")?.textContent).toBe("A manual step");
    expect(container.querySelector(".bl-children")).toBeNull();
    expect(container.querySelector(".bl-parse-error")).toBeNull();
  });
});

describe("<BacklogRow/> — the id cell", () => {
  test("shows the view's id text, keeping the full id in title", () => {
    const { container } = mount();
    const idEl = container.querySelector(".bl-id");
    expect(idEl?.textContent).toBe("abc123");
    expect(idEl?.getAttribute("title")).toBe("proj-abc123");
  });

  test("an id the view leaves whole renders in full", () => {
    const { container } = mount({
      row: backlogRow({ id: "other-xyz" }),
      view: backlogRowView({ idText: "other-xyz" }),
    });
    expect(container.querySelector(".bl-id")?.textContent).toBe("other-xyz");
  });
});

describe("<BacklogRow/> — the last-run cell", () => {
  test("a run whose time is unknown reads '—'", () => {
    const { container } = mount({
      view: backlogRowView({
        last: { outcome: "blocked", tone: "blocked", age: undefined, attempts: 1 },
      }),
    });
    expect(container.querySelector(".bl-last")?.textContent).toContain("—");
  });

  test("the age text is printed as the view gives it", () => {
    const { container } = mount({
      view: backlogRowView({
        last: { outcome: "green", tone: "green", age: "59m ago", attempts: 1 },
      }),
    });
    expect(container.querySelector(".bl-last")?.textContent).toBe("green · 59m ago");
  });
});

describe("<BacklogRow/> — PR link", () => {
  test("a ticket row with lastPr renders an <a> whose href is that PR url", () => {
    const { container } = mount({
      row: backlogRow({ lastPr: "https://github.com/o/r/pull/42" }),
    });
    expect(container.querySelector(".bl-pr")?.getAttribute("href")).toBe(
      "https://github.com/o/r/pull/42",
    );
  });

  test("no lastPr — no PR link rendered", () => {
    expect(mount().container.querySelector(".bl-pr")).toBeNull();
  });
});

describe("<BacklogRow/> — keyboard activation (Enter/Space)", () => {
  test("Enter on the row itself selects it", () => {
    const { container, onSelect } = mount({ row: backlogRow({ id: "kbd-enter" }) });
    fireEvent.keyDown(rowEl(container), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("kbd-enter");
  });

  test("Space on the row itself selects it", () => {
    const { container, onSelect } = mount({ row: backlogRow({ id: "kbd-space" }) });
    fireEvent.keyDown(rowEl(container), { key: " " });
    expect(onSelect).toHaveBeenCalledWith("kbd-space");
  });

  test("a keydown bubbling up from the copy button does not select the row", () => {
    const { container, onSelect } = mount();
    fireEvent.keyDown(container.querySelector(".bl-copy") as HTMLElement, {
      key: "Enter",
      bubbles: true,
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("an unrelated key (e.g. Tab) on the row does not select it", () => {
    const { container, onSelect } = mount();
    fireEvent.keyDown(rowEl(container), { key: "Tab" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("the tabbable flag sets the roving tabindex", () => {
    expect(rowEl(mount().container).getAttribute("tabindex")).toBe("0");
    expect(rowEl(mount({ tabbable: false }).container).getAttribute("tabindex")).toBe("-1");
  });
});

describe("<BacklogRow/> — one fixed column grid, in order", () => {
  test("glyph · project · id · title · lane · P · why · last run · actions", () => {
    const { container } = mount({
      row: { ...BLOCKED_ROW, title: "A long title" },
      view: BLOCKED_VIEW,
    });
    const el = rowEl(container);
    expect(el.classList.contains("bl-cols")).toBe(true);
    expect(el.getAttribute("data-row")).toBe("proj-abc123");
    expect(Array.from(el.children).map((c) => c.className.split(" ")[0])).toEqual([
      "bl-glyph",
      "bl-proj",
      "bl-id",
      "bl-title",
      "bl-lane",
      "bl-prio",
      "bl-why",
      "bl-last",
      "bl-acts",
    ]);
    expect(el.querySelector(".bl-proj")?.textContent).toBe("proj");
    expect(el.querySelector(".bl-id")?.getAttribute("title")).toBe("proj-abc123");
    expect(el.querySelector(".bl-title")?.getAttribute("title")).toBe("A long title");
    expect(el.querySelector(".bl-prio")?.textContent).toBe("P1");
    expect(el.querySelector(".bl-why")?.textContent).toBe("gates: gates exhausted 3 repair rounds");
    expect(el.querySelector(".bl-why")?.getAttribute("title")).toBe(
      "gates: gates exhausted 3 repair rounds",
    );
    expect(el.querySelector(".bl-last")?.textContent).toBe("blocked · 2h ago · ×2");
    expect(el.querySelector(".bl-last")?.getAttribute("title")).toBe("2 attempt(s)");
  });

  test("a row with no runs says so", () => {
    expect(mount().container.querySelector(".bl-last")?.textContent).toBe("no runs");
  });

  test("data-driven classes: lane, priority (and none), outcome tone, project hue, state", () => {
    const { container } = mount({
      row: backlogRow({ lane: "feat", priority: 3, state: "in-flight" }),
      view: backlogRowView({
        section: "in-flight",
        last: { outcome: "green (salvaged by hand)", tone: "green", age: "just now", attempts: 1 },
      }),
      hue: 4,
    });
    expect(container.querySelector(".bl-lane")?.className).toBe("bl-lane lane-feat");
    expect(container.querySelector(".bl-prio")?.className).toBe("bl-prio prio-3");
    expect(container.querySelector(".bl-proj")?.className).toBe("bl-proj hue-4");
    expect(container.querySelector(".bl-glyph")?.className).toBe("bl-glyph s-in-flight");
    expect(container.querySelector(".bl-last .o-green")?.textContent).toBe(
      "green (salvaged by hand)",
    );
    const epic = mount({ row: backlogRowWithoutLane({ kind: "epic" }) });
    expect(epic.container.querySelector(".bl-prio")?.className).toBe("bl-prio prio-none");
    expect(epic.container.querySelector(".bl-lane")?.textContent).toBe("epic");
  });
});

describe("<BacklogRow/> — per-row actions", () => {
  test("▶ run copies the view's dispatch line and does not select the row", () => {
    const line = dispatchLineFor("cmc-9", "cmc", " --provider codex");
    const { container, onSelect, onCopy } = mount({
      row: backlogRow({ id: "cmc-9", project: "cmc" }),
      view: backlogRowView({ dispatchLine: line }),
    });
    fireEvent.click(container.querySelector(".bl-run") as HTMLElement);
    expect(onCopy).toHaveBeenCalledWith(
      "adw run --target cmc --ticket cmc-9 --isolation worktree --provider codex",
      "dispatch line",
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("▶ run title and click carry the line of the picked gate host", () => {
    const line = dispatchLineFor("cmc-9", "cmc", " --gate-host m1max");
    const { container, onCopy } = mount({
      row: backlogRow({ id: "cmc-9", project: "cmc" }),
      view: backlogRowView({ dispatchLine: line }),
    });
    const button = container.querySelector(".bl-run") as HTMLElement;
    expect(button.getAttribute("title")).toBe(
      "adw run --target cmc --ticket cmc-9 --isolation worktree --gate-host m1max  (c)",
    );
    expect(button.textContent).toBe("▶ run");
    fireEvent.click(button);
    expect(onCopy).toHaveBeenCalledWith(line, "dispatch line");
  });

  test("no ▶ run on a closed row or a non-ticket row", () => {
    const closed = mount({ row: backlogRow({ closed: true, status: "done" }) });
    const epic = mount({ row: backlogRow({ kind: "epic" }) });
    expect(closed.container.querySelector(".bl-run")).toBeNull();
    expect(epic.container.querySelector(".bl-run")).toBeNull();
  });

  test("↗ opens the last run on the run screen, token carried and encoded", () => {
    const { container } = mount({
      row: backlogRow({ lastRunId: "proj-abc123-1000" }),
      token: "a b",
    });
    const open = container.querySelector(".bl-open");
    expect(open?.getAttribute("href")).toBe("/run?id=proj-abc123-1000&token=a%20b");
    expect(open?.getAttribute("title")).toBe("open the last run");
    expect(mount().container.querySelector(".bl-open")).toBeNull();
  });

  test("runHrefOf encodes the run id and the token", () => {
    expect(runHrefOf("a/b", "t&k")).toBe("/run?id=a%2Fb&token=t%26k");
  });

  test("the cursor and the selection are styled on the row", () => {
    const { container } = mount({ cursor: true, selected: true });
    const cls = rowEl(container).classList;
    expect(cls.contains("cur")).toBe(true);
    expect(cls.contains("sel")).toBe(true);
  });
});

describe("<BacklogRow/> — waiting why-cell speaks waves", () => {
  const ids2 = ["proj-02", "proj-03"];
  const mountWaiting = (ids: readonly string[], states: Record<string, string> = {}) =>
    mount({ row: waitingRow(ids), view: waitingView(ids, states) });

  test("two deps: `W3 need 02 & 03`, wave in a badge", () => {
    const { container } = mountWaiting(ids2);
    expect(whyEl(container).textContent).toBe("W3 need 02 & 03");
    expect(container.querySelector(".bl-why .bl-wave")?.textContent).toBe("W3");
  });

  test("one dep: `need 02`; three deps: `need 04, 05 & 06`", () => {
    expect(whyEl(mountWaiting(["proj-02"]).container).textContent).toBe("W3 need 02");
    cleanup();
    expect(whyEl(mountWaiting(["proj-04", "proj-05", "proj-06"]).container).textContent).toBe(
      "W3 need 04, 05 & 06",
    );
  });

  test("each label is a typed button carrying the full dep id, coloured by dep state", () => {
    const { container } = mountWaiting(ids2, { "proj-02": "blocked", "proj-03": "running" });
    const chips = [...container.querySelectorAll("button[data-dep-id]")];
    expect(chips.map((c) => c.getAttribute("data-dep-id"))).toEqual(ids2);
    expect(chips.map((c) => c.classList.contains("s-blocked"))).toEqual([true, false]);
    expect(chips.map((c) => c.classList.contains("s-running"))).toEqual([false, true]);
    for (const c of chips) expect(c.getAttribute("type")).toBe("button");
  });

  test("the tooltip lists each dep's full id and status; tone class survives", () => {
    const row = {
      ...waitingRow(ids2),
      deps: [
        { id: "proj-02", status: "blocked", met: false, hard: true },
        { id: "proj-03", status: "queued", met: false, hard: false },
      ],
    };
    const { container } = mount({ row, view: waitingView(ids2, {}, "bad") });
    expect(whyEl(container).getAttribute("title")).toBe("proj-02 — blocked\nproj-03 — queued");
    expect(whyEl(container).classList.contains("bad")).toBe(true);
  });

  test("a dep with a PR names it in the tooltip; an unknown dep says so", () => {
    const row = {
      ...waitingRow(["proj-02"]),
      deps: [{ id: "proj-02", status: "in-review", pr: 7, met: false, hard: false }],
    };
    const known = mount({ row, view: waitingView(["proj-02"]) });
    expect(whyEl(known.container).getAttribute("title")).toBe("proj-02 — in-review (PR #7)");
    cleanup();
    const unknown = mount({ row: waitingRow([]), view: waitingView(["proj-77"]) });
    expect(whyEl(unknown.container).getAttribute("title")).toBe("proj-77 — unknown");
  });

  test("a chip click does not select the row", () => {
    const { container, onSelect } = mountWaiting(ids2);
    fireEvent.click(container.querySelector("button[data-dep-id]") as Element);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("a dep outside the graph still renders a chip, dim, with the stripped id", () => {
    const { container } = mountWaiting(["proj-02", "proj-77"], { "proj-77": "other" });
    const chips = [...container.querySelectorAll("button[data-dep-id]")];
    expect(chips.map((c) => c.textContent)).toEqual(["02", "77"]);
    expect(chips[1]?.classList.contains("s-other")).toBe(true);
  });

  test("a closed dep's chip takes the closed palette", () => {
    const { container } = mountWaiting(["proj-02"], { "proj-02": "closed" });
    expect(container.querySelector("button[data-dep-id]")?.classList.contains("s-closed")).toBe(
      true,
    );
  });

  test("a soft first dep keeps the warn tone on the why-cell", () => {
    const why = whyEl(mountWaiting(ids2).container);
    expect(why.classList.contains("warn")).toBe(true);
    expect(why.classList.contains("bad")).toBe(false);
  });

  test("Enter/Space on a chip does not select the row", () => {
    const { container, onSelect } = mountWaiting(["proj-02"]);
    const chip = container.querySelector("button[data-dep-id]") as Element;
    fireEvent.keyDown(chip, { key: "Enter" });
    fireEvent.keyDown(chip, { key: " " });
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("a view without waits prints its why text, no chip", () => {
    const { container } = mount({
      row: waitingRow(["proj-02", "proj-03"]),
      view: backlogRowView({
        section: "waiting",
        why: { text: "waits on proj-02, proj-03", tone: "warn" },
      }),
    });
    expect(whyEl(container).textContent).toBe("waits on proj-02, proj-03");
    expect(container.querySelector(".bl-wave")).toBeNull();
    expect(container.querySelector("[data-dep-id]")).toBeNull();
  });
});

describe("<BacklogRow/> — the PR cell", () => {
  const withPr = (pr = REVIEW_PR) =>
    mount({
      row: backlogRow({ status: "in-review", state: "in-flight" }),
      view: backlogRowView({ section: "in-flight", pr }),
    });

  test("with an open PR the last-run cell becomes a link to the PR: glyph, number, bucket, age", () => {
    const { container } = withPr();
    expect(container.querySelector(".bl-last")).toBeNull();
    const cell = container.querySelector(".bl-pr-cell") as HTMLAnchorElement;
    expect(cell.tagName).toBe("A");
    expect(cell.getAttribute("href")).toBe("https://github.com/o/r/pull/612");
    expect(cell.getAttribute("target")).toBe("_blank");
    expect(cell.classList.contains("rb-review")).toBe(true);
    expect(cell.textContent).toContain("#612");
    expect(cell.textContent).toContain("review");
    expect(cell.textContent).toContain("3d");
    expect(cell.textContent).not.toContain("⇄");
  });

  test("a PR out of sync with its ticket carries ⇄ and the view's title", () => {
    const { container } = withPr({
      ...REVIEW_PR,
      bucket: "rebase",
      desync: true,
      title: "PR #612 · author · ticket says blocked",
    });
    const cell = container.querySelector(".bl-pr-cell") as HTMLElement;
    expect(cell.textContent).toContain("⇄");
    expect(cell.getAttribute("title")).toContain("blocked");
    expect(cell.classList.contains("rb-rebase")).toBe(true);
  });

  test("clicking the cell does not open the panel", () => {
    const { container, onSelect } = withPr();
    fireEvent.click(container.querySelector(".bl-pr-cell") as HTMLElement);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("without a PR the last-run cell is unchanged", () => {
    const { container } = mount({
      view: backlogRowView({
        last: { outcome: "green", tone: "green", age: "1m ago", attempts: 1 },
      }),
    });
    expect(container.querySelector(".bl-pr-cell")).toBeNull();
    expect(container.querySelector(".bl-last")?.textContent).toContain("green");
  });

  test("a PR without a url renders the cell as a span, same content", () => {
    const { container } = withPr({ ...REVIEW_PR, url: undefined });
    const cell = container.querySelector(".bl-pr-cell") as HTMLElement;
    expect(cell.tagName).toBe("SPAN");
    expect(cell.textContent).toContain("#612");
  });
});
