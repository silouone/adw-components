// `<BacklogPanel/>`: the drawer opened by a row. Literal view models; rendering the markdown, tidying
// the reason and building the dispatch lines are the factory's, and the menu's Esc / outside-click
// dismissal is the owner's (the panel holds only the menu's open flag).

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { BACKLOG_TOKEN } from "../../../fixtures/BacklogRow";
import {
  BACKLOG_PANEL_LABELS,
  BLOCKED_PANEL_ROW,
  BLOCKED_PANEL_VIEW,
  backlogPanelRow,
  backlogPanelView,
  COPY_MANY_HOSTS,
  COPY_ONE_HOST,
  PANEL_FLAGGED_LINE,
  PANEL_PLAIN_LINE,
} from "../../../fixtures/BacklogPanel";
import { BacklogPanel, type BacklogPanelProps } from "./BacklogPanel";

afterEach(cleanup);

const mount = (over: Partial<BacklogPanelProps> = {}) => {
  const onClose = mock(() => {});
  const onPickHost = mock((_host: string | undefined) => {});
  const onScroll = mock((_top: number) => {});
  const onCopy = mock((_text: string, _label: string) => {});
  const out = render(
    <BacklogPanel
      row={backlogPanelRow()}
      token={BACKLOG_TOKEN}
      view={backlogPanelView()}
      labels={BACKLOG_PANEL_LABELS}
      scrollTop={0}
      onClose={onClose}
      onPickHost={onPickHost}
      onScroll={onScroll}
      onCopy={onCopy}
      {...over}
    />,
  );
  return { ...out, onClose, onPickHost, onScroll, onCopy };
};

describe("<BacklogPanel/> — body rendered as real HTML", () => {
  test("the view's body becomes an <h1>/<p>, not raw text", () => {
    const { container } = mount();
    expect(container.querySelector("h1")?.textContent).toBe("Heading");
    expect(container.querySelector("p")?.textContent).toBe("Some text.");
    expect(container.querySelector(".bl-panel-body")?.textContent).not.toContain("<h1>");
  });
});

describe("<BacklogPanel/> — the attempts ledger", () => {
  test("one link per attempt, href carries the run id; the head is the label", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const links = container.querySelectorAll(".bl-ledger a[href*='/run?id=']");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("href")).toContain("proj-abc123-1000");
    expect(links[1]?.getAttribute("href")).toContain("proj-abc123-2000");
    expect(container.querySelector(".bl-ledger-head")?.textContent).toBe("attempts");
  });

  test("attempt links carry the encoded token, each with its outcome tone and its PR", () => {
    const { container } = mount({
      row: BLOCKED_PANEL_ROW,
      view: BLOCKED_PANEL_VIEW,
      token: "a b",
    });
    const rows = [...container.querySelectorAll(".bl-ledger-row")];
    expect(rows[0]?.querySelector("a")?.getAttribute("href")).toBe(
      "/run?id=proj-abc123-1000&token=a%20b",
    );
    expect(rows[0]?.querySelector(".o-blocked")?.textContent).toBe("blocked");
    expect(rows[1]?.querySelector(".o-green")?.textContent).toBe("green");
    expect(rows[0]?.querySelector(".bl-pr")).toBeNull();
    expect(rows[1]?.querySelector(".bl-pr")?.getAttribute("href")).toBe(
      "https://github.com/o/r/pull/42",
    );
  });

  test("no attempts — no ledger", () => {
    expect(mount().container.querySelector(".bl-ledger")).toBeNull();
  });
});

describe("<BacklogPanel/> — scroll position", () => {
  test("scrolling the panel reports the new scrollTop", () => {
    const { container, onScroll } = mount();
    const panel = container.querySelector(".bl-panel") as HTMLElement;
    Object.defineProperty(panel, "scrollTop", { value: 123, writable: true });
    fireEvent.scroll(panel);
    expect(onScroll).toHaveBeenCalledWith(123);
  });

  test("mounting with a scrollTop restores it", () => {
    const { container } = mount({ scrollTop: 77 });
    expect((container.querySelector(".bl-panel") as HTMLElement).scrollTop).toBe(77);
  });
});

describe("<BacklogPanel/> — optional frontmatter fields", () => {
  test("present fields each render a dt/dd pair, in order", () => {
    const { container } = mount({
      row: backlogPanelRow({
        lane: "bug",
        priority: 1,
        state: "waiting",
        created: "2026-09-20",
        model: "claude-sonnet-5",
        review: false,
        parseError: "bad frontmatter",
      }),
    });
    const dl = container.querySelector(".bl-panel-fields") as HTMLElement;
    expect([...dl.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual([
      "id",
      "project",
      "kind",
      "status",
      "lane",
      "priority",
      "state",
      "created",
      "model",
      "review",
      "parseError",
    ]);
    for (const text of ["bug", "1", "waiting", "2026-09-20", "claude-sonnet-5", "false"])
      expect(dl.textContent).toContain(text);
    expect(dl.textContent).toContain("bad frontmatter");
  });

  test("absent optional fields render no dt/dd pair for them", () => {
    const { lane: _l, priority: _p, state: _s, ...bare } = backlogPanelRow();
    const { container } = mount({ row: bare });
    expect(
      [...container.querySelectorAll(".bl-panel-fields dt")].map((d) => d.textContent),
    ).toEqual(["id", "project", "kind", "status"]);
  });

  test("each field is a cell (dt+dd in one wrapper), in the bl-panel-fields grid", () => {
    const cells = mount().container.querySelectorAll(".bl-panel-fields > .bl-fm-cell");
    expect(cells.length).toBeGreaterThanOrEqual(4);
    for (const c of cells) {
      expect(c.querySelectorAll("dt")).toHaveLength(1);
      expect(c.querySelectorAll("dd")).toHaveLength(1);
    }
  });
});

describe("<BacklogPanel/> — dep chips", () => {
  test("a chip per dep: the view's short id, the full id in data-dep-id and title", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const chips = [...container.querySelectorAll(".bl-deps [data-dep-id]")];
    expect(chips.map((c) => c.textContent)).toEqual(["0001", "0002", "0003"]);
    expect(chips.map((c) => c.getAttribute("data-dep-id"))).toEqual([
      "proj-0001",
      "proj-0002",
      "proj-0003",
    ]);
    expect(chips[1]?.getAttribute("title")).toBe("proj-0002 — blocked");
  });

  test("hard, soft and met deps take their own tone; a met dep is never a blocker", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const classes = [...container.querySelectorAll(".bl-deps [data-dep-id]")].map(
      (c) => c.className,
    );
    expect(classes).toEqual(["bl-dep dep-met", "bl-dep dep-hard", "bl-dep dep-soft"]);
  });

  test("a met (done) dep gets neither dep-hard nor dep-soft", () => {
    const { container } = mount({
      row: backlogPanelRow({ deps: [{ id: "proj-met1", status: "done", met: true, hard: false }] }),
      view: backlogPanelView({ depIds: ["met1"] }),
    });
    expect(container.querySelector(".dep-hard, .dep-soft")).toBeNull();
  });

  test("no deps — no chip row", () => {
    expect(mount().container.querySelector(".bl-deps")).toBeNull();
  });
});

describe("<BacklogPanel/> — why it is stuck, in full", () => {
  test("a blocked row shows its whole reason in a bad alert", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const alert = container.querySelector(".bl-alert.bad");
    expect(alert?.textContent).toContain("why blocked — last run");
    expect(alert?.textContent).toContain(
      "build: agent reported an error result: API Error: 400 — long tail kept",
    );
  });

  test("a drifted row shows a warn alert naming the drift, and no bad alert", () => {
    const { container } = mount({
      row: backlogPanelRow({
        state: "blocked",
        status: "in-review",
        drift: "in-review, no PR recorded",
      }),
      view: backlogPanelView({ section: "in-flight", reasonText: "ignored" }),
    });
    expect(container.querySelector(".bl-alert.warn")?.textContent).toContain(
      "in-review, no PR recorded",
    );
    expect(container.querySelector(".bl-alert.warn b")?.textContent).toBe("ledger drift");
    expect(container.querySelector(".bl-alert.bad")).toBeNull();
  });

  test("a healthy row shows no alert", () => {
    expect(mount().container.querySelector(".bl-alert")).toBeNull();
  });
});

describe("<BacklogPanel/> — the head and the actions", () => {
  test("title, state badge, project hue and full id", () => {
    const { container } = mount({ hue: 3, view: backlogPanelView({ section: "waiting" }) });
    expect(container.querySelector(".bl-panel-title")?.textContent).toBe("Add the export button");
    expect(container.querySelector(".bl-state")?.className).toBe("bl-state s-waiting");
    expect(container.querySelector(".bl-state")?.textContent).toBe("◷ waiting");
    expect(container.querySelector(".bl-proj")?.className).toBe("bl-proj hue-3");
    expect(container.querySelector(".bl-panel-fullid")?.textContent).toBe("proj-abc123");
  });

  test("the close button reports through onClose", () => {
    const { container, onClose } = mount();
    const x = container.querySelector(".bl-panel-x") as HTMLElement;
    expect(x.getAttribute("title")).toBe("close (esc)");
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("the copy-id button hands the id to onCopy", () => {
    const { container, onCopy } = mount();
    const btn = container.querySelector(".bl-panel-acts .bl-copy") as HTMLElement;
    expect(btn.textContent).toBe("⧉ copy id");
    fireEvent.click(btn);
    expect(onCopy).toHaveBeenCalledWith("proj-abc123", "id");
  });

  test("last run and PR links appear only when the row has them", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const open = container.querySelector(".bl-panel-acts .bl-open");
    expect(open?.getAttribute("href")).toBe("/run?id=proj-abc123-2000&token=tok");
    expect(open?.textContent).toBe("↗ last run");
    expect(container.querySelector(".bl-panel-acts .bl-pr")?.getAttribute("href")).toBe(
      "https://github.com/o/r/pull/42",
    );
    const bare = mount();
    expect(bare.container.querySelector(".bl-panel-acts .bl-open")).toBeNull();
    expect(bare.container.querySelector(".bl-panel-acts .bl-pr")).toBeNull();
  });

  test("a closed row and a non-ticket row have no run control and no bucket hint", () => {
    const view = backlogPanelView({ bucketHint: "draws on Fable 31% used" });
    for (const row of [
      backlogPanelRow({ closed: true, status: "done" }),
      backlogPanelRow({ kind: "epic" }),
    ]) {
      const { container } = mount({ row, view });
      expect(container.querySelector(".bl-panel-acts .bl-run")).toBeNull();
      expect(container.textContent).not.toContain("draws on");
      cleanup();
    }
  });

  test("a ticket shows the bucket hint beside the run control", () => {
    const { container } = mount({
      view: backlogPanelView({ bucketHint: "draws on Fable 31% used" }),
    });
    expect(container.textContent).toContain("draws on Fable 31% used");
  });

  test("each button in the action row carries bl-panel-btn", () => {
    const { container } = mount({ row: BLOCKED_PANEL_ROW, view: BLOCKED_PANEL_VIEW });
    const btns = [...container.querySelectorAll(".bl-panel-acts .bl-btn")];
    expect(btns.length).toBeGreaterThan(0);
    for (const b of btns) expect(b.classList.contains("bl-panel-btn")).toBe(true);
  });
});

describe("<BacklogPanel/> — the copy menu", () => {
  const trigger = (c: Element) => c.querySelector(".bl-panel-acts .bl-run") as HTMLElement;
  const menu = (c: Element) => c.querySelector("[role=menu]");
  const items = (c: Element) => [...c.querySelectorAll("[role=menuitem]")] as HTMLElement[];

  test("without hosts one click on « ▶ copy » copies the plain line, no menu", () => {
    const { container, onCopy } = mount();
    expect(trigger(container).textContent).toBe("▶ copy");
    fireEvent.click(trigger(container));
    expect(onCopy).toHaveBeenCalledWith(PANEL_PLAIN_LINE, "dispatch line");
    expect(menu(container)).toBeNull();
  });

  test("without hosts the trigger is a plain button, not a popup", () => {
    const { container } = mount();
    expect(trigger(container).getAttribute("aria-haspopup")).toBeNull();
    expect(trigger(container).getAttribute("aria-expanded")).toBeNull();
    expect(trigger(container).getAttribute("title")).toBe(PANEL_PLAIN_LINE);
  });

  test("no select.bl-host and no « copy run command » render", () => {
    const { container } = mount({ view: backlogPanelView({ copy: COPY_ONE_HOST }) });
    expect(container.querySelector("select.bl-host")).toBeNull();
    expect(container.textContent).not.toContain("copy run command");
  });

  test("with a host the click opens a two-item menu and copies nothing", () => {
    const { container, onCopy } = mount({ view: backlogPanelView({ copy: COPY_ONE_HOST }) });
    expect(trigger(container).textContent).toBe("▶ copy ▾");
    expect(menu(container)).toBeNull();
    fireEvent.click(trigger(container));
    expect(items(container).map((i) => i.textContent)).toEqual(["this mac", "m1max"]);
    expect(onCopy).not.toHaveBeenCalled();
  });

  test("a pick copies its line, records the host and closes the menu", () => {
    const { container, onCopy, onPickHost } = mount({
      view: backlogPanelView({ copy: COPY_ONE_HOST }),
    });
    fireEvent.click(trigger(container));
    fireEvent.click(items(container)[1] as HTMLElement);
    expect(onCopy).toHaveBeenCalledWith(PANEL_FLAGGED_LINE, "dispatch line");
    expect(onPickHost).toHaveBeenCalledWith("m1max");
    expect(menu(container)).toBeNull();
  });

  test("« this mac » records no host", () => {
    const { container, onCopy, onPickHost } = mount({
      view: backlogPanelView({ copy: COPY_ONE_HOST }),
    });
    fireEvent.click(trigger(container));
    fireEvent.click(items(container)[0] as HTMLElement);
    expect(onCopy).toHaveBeenCalledWith(PANEL_PLAIN_LINE, "dispatch line");
    expect(onPickHost).toHaveBeenCalledWith(undefined);
  });

  test("a second click on the trigger closes the menu and copies nothing", () => {
    const { container, onCopy } = mount({ view: backlogPanelView({ copy: COPY_ONE_HOST }) });
    expect(trigger(container).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(trigger(container));
    expect(menu(container)).toBeNull();
    expect(trigger(container).getAttribute("aria-expanded")).toBe("false");
    expect(onCopy).not.toHaveBeenCalled();
  });

  test("several hosts list in declared order after « this mac »", () => {
    const { container } = mount({ view: backlogPanelView({ copy: COPY_MANY_HOSTS }) });
    fireEvent.click(trigger(container));
    expect(items(container).map((i) => i.textContent)).toEqual([
      "this mac",
      "zeta",
      "alpha",
      "m1max",
    ]);
  });
});
