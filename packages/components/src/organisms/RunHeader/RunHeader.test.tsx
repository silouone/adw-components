import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BLOCKED,
  BLOCKED_GATE,
  FINISHED,
  IDENTITY,
  LABELS,
  LIVE,
  WORKSPACE,
} from "../../../fixtures/RunHeader";
import type { CiView } from "../../molecules/PrChips/PrChips";
import { RunHeader, type RunHeaderProps, type RunPrChip } from "./RunHeader";

afterEach(cleanup);

const mount = (over: Partial<RunHeaderProps> = {}) =>
  render(
    <RunHeader
      header={IDENTITY}
      head={FINISHED}
      tab="gantt"
      labels={LABELS}
      onViewTab={() => {}}
      onFullScreen={() => {}}
      onScope={() => {}}
      {...over}
    />,
  ).container;

const chip = (container: Element, key: string): Element | null =>
  [...container.querySelectorAll(".chip")].find((c) => c.querySelector("i")?.textContent === key) ??
  null;

describe("<RunHeader/> — status pill", () => {
  test("running -> live class and '● live' text", () => {
    const pill = mount({ head: LIVE }).querySelector(".st");
    expect(pill?.className).toContain("live");
    expect(pill?.textContent).toBe("● live");
  });

  test("dim, ok and bad pills carry their class", () => {
    for (const cls of ["dim", "ok", "bad"]) {
      const container = mount({ head: { ...FINISHED, cls, text: cls } });
      expect(container.querySelector(".st")?.className).toContain(cls);
      cleanup();
    }
  });

  test("the pill text is the view's text, whatever it falls back to", () => {
    const container = mount({ head: { ...FINISHED, cls: "bad", text: "finished" } });
    expect(container.querySelector(".st")?.textContent).toBe("finished");
  });
});

describe("<RunHeader/> — the stat chips", () => {
  test("each chip draws its key and value, the title on the chip", () => {
    const container = mount();
    expect(chip(container, "dur")?.querySelector("b")?.textContent).toBe("12.3s");
    expect(chip(container, "cost")?.getAttribute("title")).toBe(
      "estimated from the model's rate card",
    );
    expect(chip(container, "dur")?.getAttribute("title")).toBeNull();
  });

  test("a running view draws the '~' totals and a context-now chip between context and cost", () => {
    const container = mount({ head: LIVE });
    expect(chip(container, "input")?.querySelector("b")?.textContent).toBe("~300");
    expect(chip(container, "context")?.querySelector("b")?.textContent).toBe("~830");
    expect(chip(container, "context now")?.querySelector("b")?.textContent).toBe("200");
    const keys = [...container.querySelectorAll(".chip i")].map((i) => i.textContent);
    expect(keys.indexOf("context now")).toBe(keys.indexOf("context") + 1);
    expect(keys.indexOf("cost")).toBe(keys.indexOf("context now") + 1);
  });

  test("a finished view has neither the '~' prefix nor a context-now chip", () => {
    const container = mount();
    expect(chip(container, "context now")).toBeNull();
    expect(chip(container, "input")?.querySelector("b")?.textContent).toBe("1,200");
  });

  test(".ch-r ends on the stat chips; nothing mounts a chip here", () => {
    const container = mount();
    expect(
      container.querySelector(".ch-r")?.lastElementChild?.querySelector("i")?.textContent,
    ).toBe("cost");
    expect(container.querySelector(".up-fused")).toBeNull();
  });
});

describe("<RunHeader/> — factory sha/dirty", () => {
  test("factory set, dirty:true -> short sha + dirty badge", () => {
    const container = mount({
      header: { ...IDENTITY, factory: { sha: "abc1234def", dirty: true } },
    });
    const sha = container.querySelector(".sha");
    expect(sha?.textContent).toBe("abc1234");
    expect(sha?.getAttribute("title")).toBe("abc1234def");
    expect(container.querySelector(".badge.dirty")?.textContent).toBe("dirty");
  });

  test("factory set, dirty:false -> short sha, no badge", () => {
    const container = mount({
      header: { ...IDENTITY, factory: { sha: "abc1234def", dirty: false } },
    });
    expect(container.querySelector(".sha")?.textContent).toBe("abc1234");
    expect(container.querySelector(".badge.dirty")).toBeNull();
  });

  test("factory absent -> no sha, no badge", () => {
    const container = mount();
    expect(container.querySelector(".sha")).toBeNull();
    expect(container.querySelector(".badge.dirty")).toBeNull();
  });
});

describe("<RunHeader/> — structural parity", () => {
  test("the ticket id renders in an h2", () => {
    expect(mount().querySelector("h2")?.textContent).toBe("adw-render-04");
  });

  test("the view tabs ride the bar and report a pick", () => {
    const onViewTab = mock((_tab: string) => {});
    const container = mount({ onViewTab });
    fireEvent.click(container.querySelector('[data-view="ledger"]') as Element);
    expect(onViewTab).toHaveBeenCalledWith("ledger");
  });

  test("a click on the bar toggles full screen; a click on a control keeps its own action", () => {
    const onFullScreen = mock(() => {});
    const container = mount({ onFullScreen });
    fireEvent.click(container.querySelector("header.ch") as Element);
    expect(onFullScreen).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-view="ledger"]') as Element);
    expect(onFullScreen).toHaveBeenCalledTimes(1);
  });
});

describe("<RunHeader/> — a blocked run's reason", () => {
  const API_400 = "API Error: 400 messages.947: The final block cannot be 'thinking'";
  const blockedId = { ...IDENTITY, gate: BLOCKED_GATE };
  const { verdict: _verdict, ...noVerdict } = BLOCKED;

  test("a blocked run's header renders no reason text", () => {
    const container = mount({ header: blockedId, head: noVerdict });
    expect(container.querySelector(".ch-cause")).toBeNull();
    expect(container.querySelector(".cause")).toBeNull();
    expect(container.textContent).not.toContain(API_400);
    expect(container.textContent).not.toContain("API Error");
  });

  test("a blocked run draws the failing node and gate as a chip", () => {
    const container = mount({ header: blockedId, head: noVerdict });
    expect(container.querySelector(".fv-chip")?.textContent).toBe(
      "✕ gates-rebased · test-frontend",
    );
  });

  test("no known gate gives the node alone", () => {
    const container = mount({ head: noVerdict });
    expect(container.querySelector(".fv-chip")?.textContent).toBe("✕ gates-rebased");
  });

  test("a blocked run that names no node draws no chip", () => {
    const { failedNode: _node, ...nameless } = noVerdict;
    expect(mount({ head: nameless }).querySelector(".fv-chip")).toBeNull();
  });

  test("with a failure scope the chip opens the dock on it", () => {
    const onScope = mock((_scope: string) => {});
    const container = mount({ header: blockedId, head: noVerdict, failureScope: "k", onScope });
    const chipEl = container.querySelector(".fv-chip");
    expect(chipEl?.tagName).toBe("BUTTON");
    fireEvent.click(chipEl as Element);
    expect(onScope).toHaveBeenCalledWith("k");
  });

  test("without a failure scope the chip is not a button", () => {
    const container = mount({ header: blockedId, head: noVerdict });
    expect(container.querySelector(".fv-chip")?.tagName).not.toBe("BUTTON");
  });

  test("ch-why is not drawn for a blocked run without left-behind work or a verdict", () => {
    expect(mount({ header: blockedId, head: noVerdict }).querySelector(".ch-why")).toBeNull();
  });

  test("a run whose view names no failed node draws no chip", () => {
    expect(mount({ header: blockedId, head: BLOCKED }).querySelector(".fv-chip")).not.toBeNull();
    cleanup();
    expect(mount({ header: blockedId, head: FINISHED }).querySelector(".fv-chip")).toBeNull();
  });

  test("the chip carries its title and no reason text in its attributes", () => {
    const container = mount({ header: blockedId, head: noVerdict, failureScope: "k" });
    const chipEl = container.querySelector(".fv-chip");
    expect(chipEl?.getAttribute("title")).toBe("open the failing node");
    expect(chipEl?.innerHTML).not.toContain("API Error");
  });

  test("with left-behind work, ch-why holds the left-behind line and nothing of the failure", () => {
    const container = mount({
      header: blockedId,
      head: noVerdict,
      leftBehind: { files: 2, path: "/w" },
    });
    const why = container.querySelector(".ch-why");
    expect(why).not.toBeNull();
    expect(why?.querySelector(".left-behind")).not.toBeNull();
    expect(why?.querySelector(".cause, .ch-cause")).toBeNull();
    expect(why?.textContent).not.toContain("API Error");
  });

  test("the verdict's evidence and salvageable word sit in ch-why", () => {
    const why = mount({ header: blockedId, head: BLOCKED }).querySelector(".ch-why");
    expect(why?.querySelector(".cause-word")?.textContent).toBe(
      "gate-failure · repair · salvageable",
    );
    expect(why?.querySelectorAll(".verdict-evidence li")).toHaveLength(2);
  });

  test("a green run shows no reason", () => {
    const container = mount();
    expect(container.querySelector(".ch-cause")).toBeNull();
    expect(container.querySelector(".fv-chip")).toBeNull();
  });
});

describe("<RunHeader/> — work left behind", () => {
  test("present → the uncommitted-file count and the workspace path", () => {
    const line = mount({ leftBehind: { files: 25, path: WORKSPACE } }).querySelector(
      ".left-behind",
    );
    expect(line?.textContent).toContain("25 uncommitted files left in the workspace");
    expect(line?.textContent).toContain(WORKSPACE);
  });

  test("one file reads singular", () => {
    const container = mount({ leftBehind: { files: 1, path: WORKSPACE } });
    expect(container.querySelector(".left-behind")?.textContent).toContain(
      "1 uncommitted file left in the workspace",
    );
  });

  test("absent → no line at all, never a zero", () => {
    const container = mount();
    expect(container.querySelector(".left-behind")).toBeNull();
    expect(container.textContent).not.toContain("uncommitted");
  });
});

describe("<RunHeader/> — a maintenance round says what it is", () => {
  test("a rebase round shows its kind next to the title", () => {
    const container = mount({ header: { ...IDENTITY, round: "rebase" } });
    expect(container.querySelector(".round-kind")?.textContent).toBe("rebase round");
  });

  test("a CI round reads 'CI round'; a build run has no kind badge", () => {
    expect(
      mount({ header: { ...IDENTITY, round: "ci" } }).querySelector(".round-kind")?.textContent,
    ).toBe("CI round");
    cleanup();
    expect(mount().querySelector(".round-kind")).toBeNull();
  });
});

describe("<RunHeader/> — the PR's CI chip", () => {
  const failing: RunPrChip = {
    ci: {
      kind: "failing",
      label: "ci / test",
      title: "check ci / test failed",
      url: "https://ci.example/1",
    },
  };
  const passing: CiView = { kind: "passing", label: "CI passing", title: "all checks passed" };
  const renderWith = (prChip?: RunPrChip) => mount(prChip !== undefined ? { prChip } : {});

  test("green run + failing chip: the run pill is unchanged and the chip names the check", () => {
    const withChip = renderWith(failing);
    const pill = withChip.querySelector(".st");
    const without = mount();
    expect(pill?.textContent).toBe(without.querySelector(".st")?.textContent);
    expect(pill?.className).toBe(without.querySelector(".st")?.className);
    expect(pill?.className).toContain("ok");
    const bad = withChip.querySelector(".tc-pr .pr-ci.bad");
    expect(bad?.textContent).toContain("ci / test");
    expect(bad?.querySelector("a")?.getAttribute("href")).toBe("https://ci.example/1");
  });

  test("a passing chip renders the green CI chip", () => {
    expect(renderWith({ ci: passing }).querySelector(".tc-pr .pr-ci.ok")).not.toBeNull();
  });

  test("laterHead says CI is on a later head; absent otherwise", () => {
    expect(renderWith({ ...failing, laterHead: true }).textContent).toContain("CI on a later head");
    cleanup();
    expect(renderWith(failing).textContent).not.toContain("later head");
  });

  test("no prChip → nothing drawn", () => {
    expect(renderWith().querySelector(".tc-pr")).toBeNull();
  });

  test.each(["pending", "cancelled", "no-checks"])(
    "a %s no-verdict chip is neutral, never red or green",
    (label) => {
      const c = renderWith({ ci: { kind: "no-verdict", label, title: label } });
      expect(c.querySelector(".tc-pr .pr-ci.none")).not.toBeNull();
      expect(c.querySelector(".tc-pr .pr-ci.bad")).toBeNull();
      expect(c.querySelector(".tc-pr .pr-ci.ok")).toBeNull();
    },
  );

  test("a failing chip with no url still says CI failed, without a link", () => {
    const c = renderWith({ ci: { kind: "failing", label: "CI failing", title: "CI failed" } });
    const bad = c.querySelector(".tc-pr .pr-ci.bad");
    expect(bad?.textContent).toContain("CI failing");
    expect(bad?.querySelector("a")).toBeNull();
  });

  test.each([
    ["blocked", BLOCKED],
    ["finished green", FINISHED],
  ])("a failing chip leaves the %s run pill byte-identical", (_name, head) => {
    const pillOf = (prChip?: RunPrChip) =>
      mount({ head, ...(prChip !== undefined ? { prChip } : {}) }).querySelector(".st")?.outerHTML;
    const withChip = pillOf(failing);
    cleanup();
    expect(withChip).toBe(pillOf());
  });

  test("the chip sits right after the run pill, before the ticket id", () => {
    const left = renderWith(failing).querySelector(".ch-l");
    const kids = [...(left?.children ?? [])].map(
      (e) => `${e.tagName}.${e.className.split(" ")[0]}`,
    );
    expect(kids.slice(0, 3)).toEqual(["SPAN.st", "SPAN.tc-pr", "H2."]);
  });

  test("laterHead on a passing chip is still marked, once", () => {
    const c = renderWith({ ci: passing, laterHead: true });
    expect(c.querySelectorAll(".pr-later")).toHaveLength(1);
    expect(c.querySelector(".pr-later")?.textContent).toBe("CI on a later head");
  });
});

describe("<RunHeader/> — stale as a prop", () => {
  test("stale renders the notice before the header, text from staleNotice", () => {
    const container = mount({ stale: true, staleNotice: "lost it" });
    const notice = container.querySelector(".stale-notice");
    expect(notice?.textContent).toBe("lost it");
    expect(notice?.getAttribute("role")).toBe("status");
    const root = container.querySelector("header.ch");
    expect(root?.classList.contains("stale")).toBe(true);
    expect(notice?.nextElementSibling).toBe(root);
  });

  test("not stale renders no notice and no stale class", () => {
    const container = mount({ staleNotice: "lost it" });
    expect(container.querySelector(".stale-notice")).toBeNull();
    expect(container.querySelector("header.ch.stale")).toBeNull();
  });

  test("stale without a notice text renders no notice element", () => {
    expect(mount({ stale: true }).querySelector(".stale-notice")).toBeNull();
  });
});

describe("<RunHeader/> — page state as own classes", () => {
  const withPr = (embedded?: boolean) =>
    mount({
      ...(embedded !== undefined ? { embedded } : {}),
      prChip: {
        ci: { kind: "passing", label: "CI passing", title: "all checks passed" },
        laterHead: true,
      },
    });

  test("renders ch-embed iff embedded", () => {
    expect(withPr(true).querySelector("header.ch")?.classList).toContain("ch-embed");
    cleanup();
    expect(withPr(false).querySelector("header.ch")?.classList).not.toContain("ch-embed");
    cleanup();
    expect(withPr().querySelector("header.ch")?.classList).not.toContain("ch-embed");
  });

  test("the PR span carries ch-pr beside tc-pr", () => {
    expect(withPr().querySelector(".ch-l .tc-pr")?.classList).toContain("ch-pr");
  });
});
