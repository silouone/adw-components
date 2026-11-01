// `<Card/>` tests: one ticket of the board as a pure render of its `CardView` — the
// top row, the title, the step thread, the now line and the KPI row. A view in, markup
// out; the copy and the selection are callbacks.
//

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import {
  BLOCKED_CARD,
  CARD_LABELS,
  CLAUDE,
  CODEX,
  cardWith,
  DEFERRED_CARD,
  FELL_BACK_HOST,
  GREEN_CARD,
  LIVE_CARD,
  LOCAL_HOST,
  PAUSED_CARD,
  PR_URL,
  QUEUED_HOST,
  REMOTE_HOST,
  WAITING_CARD,
} from "../../../fixtures/Card";
import { prOf } from "../../../fixtures/PrChips";
import { Card, type CardProps, type CardView, selectOnClick } from "./Card";

afterEach(cleanup);

const draw = (view: CardView, extra: Partial<CardProps> = {}): Element =>
  render(<Card view={view} labels={CARD_LABELS} onCopy={() => {}} {...extra} />).container;

const text = (container: Element, selector: string): string | undefined =>
  container.querySelector(selector)?.textContent ?? undefined;

describe("<Card/> — top row", () => {
  test(".tc-id is an <a> with the view's href and the short id as text", () => {
    const link = draw(GREEN_CARD).querySelector(".tc-id") as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(GREEN_CARD.idHref);
    expect(link.textContent).toBe(GREEN_CARD.headShort);
  });

  test.each(["just now", "5m ago", "3h ago", "2d ago", "—"])(
    ".tc-ago prints the view's age verbatim: %s",
    (ago) => {
      expect(text(draw(cardWith({ ago })), ".tc-ago")).toBe(ago);
    },
  );
});

describe("<Card/> — provider mark", () => {
  test("a single claude provider renders one .prov.claude glyph, titled 'built by claude'", () => {
    const c = draw(GREEN_CARD);
    const glyphs = c.querySelectorAll(".tc-prov i.prov");
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0]?.className).toBe("prov claude");
    expect(glyphs[0]?.textContent).toBe("✳");
    expect(glyphs[0]?.getAttribute("title")).toBe("built by claude");
    expect(c.querySelector(".tc-prov")?.getAttribute("title")).toBe("built by claude");
  });

  test("a single codex provider renders one .prov.codex glyph", () => {
    const glyphs = draw(cardWith({ providers: [CODEX] })).querySelectorAll(".tc-prov i.prov");
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0]?.className).toBe("prov codex");
    expect(glyphs[0]?.textContent).toBe("◉");
    expect(glyphs[0]?.getAttribute("title")).toBe("built by codex");
  });

  test("both providers render in the view's order, the wrapper titled 'claude and codex'", () => {
    const c = draw(cardWith({ providers: [CLAUDE, CODEX] }));
    const glyphs = c.querySelectorAll(".tc-prov i.prov");
    expect(glyphs).toHaveLength(2);
    expect(glyphs[0]?.className).toBe("prov claude");
    expect(glyphs[1]?.className).toBe("prov codex");
    expect(c.querySelector(".tc-prov")?.getAttribute("title")).toBe("claude and codex");
  });

  test("no provider renders no .tc-prov at all", () => {
    expect(draw(cardWith({ providers: [] })).querySelector(".tc-prov")).toBeNull();
  });

  test("R2: .tc-prov sits immediately left of .tc-ago inside .tc-meta (DOM order, not just presence)", () => {
    const children = [...(draw(GREEN_CARD).querySelector(".tc-meta")?.children ?? [])];
    const classes = children.map((el) => el.className);
    const provIndex = classes.indexOf("tc-prov");
    expect(provIndex).toBeGreaterThanOrEqual(0);
    expect(classes.indexOf("tc-ago")).toBe(provIndex + 1);
  });

  test("a card with no provider leaves only the age and the copy icon in .tc-meta", () => {
    const children = [
      ...(draw(cardWith({ providers: [] })).querySelector(".tc-meta")?.children ?? []),
    ];
    expect(children.map((el) => el.className)).toEqual(["tc-ago", "tc-copy"]);
  });
});

describe("<Card/> — no lane on the card", () => {
  test("neither a lane tag nor a lane line is drawn", () => {
    const c = draw(GREEN_CARD);
    expect(c.querySelector(".tc-tag")).toBeNull();
    expect(c.querySelector(".tc-lane")).toBeNull();
  });
});

describe("<Card/> — root class (health x live)", () => {
  test("green, not live -> 'tc green'", () => {
    expect(draw(GREEN_CARD).querySelector(".tc")?.className).toBe("tc green");
  });

  test("live -> 'tc live'", () => {
    expect(draw(LIVE_CARD).querySelector(".tc")?.className).toBe("tc live");
  });

  test("paused wins over live", () => {
    expect(draw(cardWith({ ...PAUSED_CARD, live: true })).querySelector(".tc")?.className).toBe(
      "tc paused",
    );
  });

  test("blocked -> 'tc blocked', carrying its health and ticket as data attributes", () => {
    const root = draw(BLOCKED_CARD).querySelector(".tc") as HTMLElement;
    expect(root.className).toBe("tc blocked");
    expect(root.getAttribute("data-health")).toBe("blocked");
    expect(root.getAttribute("data-ticket")).toBe("adw-render-03");
  });

  test.each([
    ["feat", "190"],
    ["bug", "20"],
    ["chore", "265"],
    ["unknown", "220"],
  ])("the view's hue for lane %s (%s) is written as --hue on the .tc root", (_lane, hue) => {
    const root = draw(cardWith({ hue })).querySelector(".tc") as HTMLElement;
    expect(root.style.getPropertyValue("--hue")).toBe(hue);
  });
});

describe("<Card/> — now line and beacon", () => {
  test("a waiting card reads the whole queue sentence, untruncated, with the waiting beacon", () => {
    const c = draw(WAITING_CARD);
    const now = c.querySelector(".tc-now") as HTMLElement;
    expect(now.textContent).toMatch(
      /^waiting for a slot \(3rd in line, since \d\d:\d\d, behind sabado-278\)$/,
    );
    expect(now.textContent).not.toContain("…");
    expect(now.classList.contains("wait")).toBe(true);
    expect(text(c, ".tc-beacon")).toBe("⏳");
  });

  test("a waiting card's step thread ends in a wait dot worded by the labels", () => {
    expect(draw(WAITING_CARD).querySelector(".st-dot.wait")?.getAttribute("data-tip")).toBe(
      CARD_LABELS.waitingForSlot,
    );
  });

  test("a running gate reads in the live tone with the live beacon", () => {
    const c = draw(LIVE_CARD);
    const now = c.querySelector(".tc-now") as HTMLElement;
    expect(now.textContent).toBe("running test (slot 1, 1m)");
    expect(now.classList.contains("run")).toBe(true);
    expect(text(c, ".tc-beacon")).toBe("●");
  });

  test("a green card reads success", () => {
    const c = draw(GREEN_CARD);
    const now = c.querySelector(".tc-now") as HTMLElement;
    expect(now.textContent).toBe("success");
    expect(now.classList.contains("ok")).toBe(true);
    expect(text(c, ".tc-beacon")).toBe("✓");
  });

  test("a deferred card reads deferred in the warn tone, its reason on hover", () => {
    const c = draw(DEFERRED_CARD);
    const now = c.querySelector(".tc-now") as HTMLElement;
    expect(now.textContent).toBe("deferred");
    expect(now.getAttribute("title")).toContain("the plan is missing");
    expect(now.classList.contains("warn")).toBe(true);
    expect(text(c, ".tc-beacon")).toBe("↩");
  });

  test("a blocked card shows the cause line in the bad tone, full text on hover", () => {
    const c = draw(BLOCKED_CARD);
    const now = c.querySelector(".tc-now") as HTMLElement;
    expect(now.textContent).toBe("npm error 404 Not Found");
    expect(now.getAttribute("title")).toContain("npm error 404 Not Found");
    expect(now.classList.contains("bad")).toBe(true);
    expect(text(c, ".tc-beacon")).toBe("✕");
  });

  test("a run with no run-end reads · and no tone", () => {
    const c = draw(cardWith({ beacon: "·", beaconTone: "", nowText: "no run-end", nowTone: "" }));
    expect(text(c, ".tc-beacon")).toBe("·");
    expect(text(c, ".tc-now")).toBe("no run-end");
  });

  test("a green card has no cause line", () => {
    expect(draw(GREEN_CARD).querySelector(".tc-now.bad")).toBeNull();
  });

  test("a 140-character cause stays one line in the now line, and the card keeps its four rows", () => {
    const capped = `${"x".repeat(139)}…`;
    const c = draw(cardWith({ ...BLOCKED_CARD, nowText: capped }));
    expect(text(c, ".tc-now")).toHaveLength(140);
    expect(c.querySelector(".tc")?.children).toHaveLength(4);
  });
});

describe("<Card/> — pause", () => {
  test("a paused card is dimmed by class and shows no pause control", () => {
    const c = draw(PAUSED_CARD);
    expect(c.querySelector(".tc")?.className).toBe("tc paused");
    expect(c.querySelector("button.arm-btn")).toBeNull();
  });

  test("a pending request reads its sentence in the now line, with no control", () => {
    const c = draw(cardWith({ nowText: "pausing… (after build)" }));
    expect(text(c, ".tc-now")).toBe("pausing… (after build)");
    expect(c.querySelector(".arm-btn")).toBeNull();
  });

  test("a card without a request has no pause text", () => {
    expect(text(draw(LIVE_CARD), ".tc-now")).not.toContain("pausing");
  });
});

describe("<Card/> — pending auto-continue", () => {
  test("the auto line follows the now text in .tc-auto", () => {
    const line = draw(
      cardWith({ ...BLOCKED_CARD, autoLine: "auto-continue in 7 min (2/3)" }),
    ).querySelector(".tc-now") as HTMLElement;
    expect(line.textContent).toContain("auto-continue in 7 min (2/3)");
    expect(line.querySelector(".tc-auto")?.textContent).toBe(" · auto-continue in 7 min (2/3)");
  });

  test("without an auto line nothing is drawn", () => {
    const c = draw(BLOCKED_CARD);
    expect(c.querySelector(".tc-auto")).toBeNull();
    expect(text(c, ".tc-now")).not.toContain("auto-continue");
  });
});

describe("<Card/> — attempt dots", () => {
  const attempt = (runId: string, cls: string, glyph: string) => ({
    runId,
    cls,
    href: `/run?id=${runId}`,
    title: cls,
    glyph,
  });

  test("a single attempt renders no .tc-att element at all", () => {
    expect(draw(GREEN_CARD).querySelector(".tc-att")).toBeNull();
  });

  test("2+ attempts render in the view's order, with the glyph, class and href of each", () => {
    const c = draw(
      cardWith({
        attempts: [
          attempt("run-c-100000", "dot live", "◌"),
          attempt("run-c-200000", "dot blocked", "✕"),
          attempt("run-c-300000", "dot green", "✓"),
        ],
      }),
    );
    const dots = c.querySelectorAll(".tc-att a.dot");
    expect(dots).toHaveLength(3);
    expect(dots[0]?.getAttribute("href")).toContain("run-c-100000");
    expect(dots[0]?.className).toBe("dot live");
    expect(dots[0]?.textContent).toBe("◌");
    expect(dots[1]?.getAttribute("href")).toContain("run-c-200000");
    expect(dots[1]?.className).toBe("dot blocked");
    expect(dots[1]?.textContent).toBe("✕");
    expect(dots[2]?.getAttribute("href")).toContain("run-c-300000");
    expect(dots[2]?.className).toBe("dot green");
    expect(dots[2]?.textContent).toBe("✓");
    expect(c.querySelector(".tc-att")?.getAttribute("title")).toBe("3 attempts, oldest first");
  });

  test("the attempt dots sit in the KPI row", () => {
    const c = draw(
      cardWith({
        attempts: [attempt("run-a", "dot green", "✓"), attempt("run-b", "dot green", "✓")],
      }),
    );
    expect(c.querySelectorAll(".tc-kpis .tc-att .dot")).toHaveLength(2);
  });

  test("a round shows as an attempt dot, not a chip row", () => {
    const c = draw(
      cardWith({
        attempts: [
          attempt("t-a-rebase-150000", "dot live", "◌"),
          attempt("t-a-100000", "dot green", "✓"),
        ],
      }),
    );
    expect(c.querySelector(".tc-round")).toBeNull();
    expect(c.querySelectorAll(".tc-att .dot")).toHaveLength(2);
  });
});

describe("<Card/> — KPI: cost chip", () => {
  test("a priced run: the view's value, its basis in the tooltip", () => {
    const kpi = draw(GREEN_CARD).querySelector(".kpi-cost") as HTMLElement;
    expect(kpi.querySelector("b")?.textContent).toBe("~$0.67");
    expect(kpi.getAttribute("title")).toContain("sonnet-4.5 pricing");
    expect(kpi.className).not.toContain("est-none");
  });

  test("an unpriced run: em-dash, est-none class, the no-estimate tooltip", () => {
    const kpi = draw(LIVE_CARD).querySelector(".kpi-cost") as HTMLElement;
    expect(kpi.className).toContain("est-none");
    expect(kpi.querySelector("b")?.textContent).toBe("—");
    expect(kpi.getAttribute("title")).toBe(LIVE_CARD.cost.title);
  });

  test("a zero price is a real price, not the no-estimate branch", () => {
    const kpi = draw(
      cardWith({ cost: { value: "~$0.00", title: "estimated", estNone: false } }),
    ).querySelector(".kpi-cost") as HTMLElement;
    expect(kpi.className).not.toContain("est-none");
    expect(kpi.querySelector("b")?.textContent).toBe("~$0.00");
  });
});

describe("<Card/> — KPI: time chip", () => {
  test("a finished run: the view's time and its wall-clock tooltip", () => {
    const kpi = draw(GREEN_CARD).querySelector(".kpi-time") as HTMLElement;
    expect(kpi.querySelector("b")?.textContent).toBe("1m 05s");
    expect(kpi.getAttribute("title")).toBe("wall clock, run-start to run-end");
  });

  test("an unfinished run: the view's elapsed time and its 'elapsed since' tooltip", () => {
    const kpi = draw(
      cardWith({
        timeText: "1m 05s",
        timeTitle: "elapsed since run-start; the run hasn't ended yet",
      }),
    ).querySelector(".kpi-time") as HTMLElement;
    expect(kpi.querySelector("b")?.textContent).toBe("1m 05s");
    expect(kpi.getAttribute("title")).toContain("hasn't ended yet");
  });

  test("an unknown elapsed time renders '—', not NaN", () => {
    expect(draw(cardWith({ timeText: "—" })).querySelector(".kpi-time b")?.textContent).toBe("—");
  });
});

describe("<Card/> — KPI row: three pills only", () => {
  test("no .kpi-tok, no .kpi-tok-cache; cost, time and total tokens remain, tooltip unchanged", () => {
    const c = draw(GREEN_CARD);
    expect(c.querySelector(".kpi-tok")).toBeNull();
    expect(c.querySelector(".kpi-tok-cache")).toBeNull();
    expect(c.querySelector(".kpi-cost")).not.toBeNull();
    expect(c.querySelector(".kpi-time")).not.toBeNull();
    const kpi = c.querySelector(".kpi-tok-total") as HTMLElement;
    expect(kpi.querySelector("b")?.textContent).toBe("1.23M");
    expect(kpi.getAttribute("title")).toBe("1,234,567 tokens processed");
  });

  test("a live total keeps the view's single '~' marker", () => {
    const text = draw(cardWith({ tokens: { value: "~1.23M", title: "live" } })).querySelector(
      ".kpi-tok-total b",
    )?.textContent;
    expect(text).toBe("~1.23M");
    expect(text?.match(/~/g)?.length).toBe(1);
  });

  test("no usage recorded: em-dash and the view's tooltip", () => {
    const kpi = draw(
      cardWith({ tokens: { value: "—", title: "no usage recorded in this journal" } }),
    ).querySelector(".kpi-tok-total") as HTMLElement;
    expect(kpi.querySelector("b")?.textContent).toBe("—");
    expect(kpi.getAttribute("title")).toBe("no usage recorded in this journal");
  });

  test("the rounds' cost is its own named chip beside the build run's own $ chip", () => {
    const c = draw(
      cardWith({
        cost: { value: "~$30.00", title: "estimate", estNone: false },
        rounds: { value: "+$0.40", title: "rebase/CI rounds, ~$30.40 with the rounds" },
      }),
    );
    expect(text(c, ".kpi-cost b")).toBe("~$30.00");
    const rounds = c.querySelector(".kpi-rounds") as HTMLElement;
    expect(rounds.querySelector("b")?.textContent).toBe("+$0.40");
    expect(rounds.getAttribute("title")).toContain("rebase/CI rounds");
    expect(rounds.getAttribute("title")).toContain("$30.40");
  });

  test("no priced round -> no rounds chip", () => {
    expect(draw(GREEN_CARD).querySelector(".kpi-rounds")).toBeNull();
  });
});

describe("<Card/> — re-render", () => {
  test("re-rendering with a new view updates in place, no duplicate or stale nodes", () => {
    const { container, rerender } = render(
      <Card view={GREEN_CARD} labels={CARD_LABELS} onCopy={() => {}} />,
    );
    expect(container.querySelector(".kpi-tok-total b")?.textContent).toBe("1.23M");

    rerender(
      <Card
        view={cardWith({ tokens: { value: "300", title: "300 tokens" } })}
        labels={CARD_LABELS}
        onCopy={() => {}}
      />,
    );
    const kpis = container.querySelectorAll(".kpi-tok-total");
    expect(kpis).toHaveLength(1);
    expect(kpis[0]?.querySelector("b")?.textContent).toBe("300");
  });
});

describe("<Card/> — PR chips", () => {
  const pr = prOf();

  test("a card without a pr is byte-identical to one rendered with pr undefined", () => {
    const a = draw(GREEN_CARD).innerHTML;
    cleanup();
    const b = draw(cardWith({ pr: undefined })).innerHTML;
    expect(a).toBe(b);
    expect(a).not.toContain('class="tc-pr"');
    expect(a).not.toContain("pr-row");
  });

  test("the PR chips sit in the KPI row, after the cost, time and tokens", () => {
    const c = draw(cardWith({ pr }));
    const row = c.querySelector(".tc-kpis .tc-end .pr-row") as HTMLElement;
    const tokens = c.querySelector(".kpi-tok-total") as HTMLElement;
    expect(row).not.toBeNull();
    expect(tokens.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("the attempt dots are the same when a PR is shown", () => {
    const attempts = [
      {
        runId: "run-a-200",
        cls: "dot green",
        href: "/run?id=run-a-200",
        title: "green",
        glyph: "✓",
      },
      {
        runId: "run-a-100",
        cls: "dot blocked",
        href: "/run?id=run-a-100",
        title: "blocked",
        glyph: "✕",
      },
    ];
    const outer = (view: CardView) => {
      const html = draw(view).querySelector(".tc-att")?.outerHTML;
      cleanup();
      return html;
    };
    expect(outer(cardWith({ attempts, pr }))).toBe(outer(cardWith({ attempts })));
  });
});

describe("<Card/> — the PR the run opened", () => {
  const latestPr = { number: 7, url: PR_URL };

  test("renders #N and the terminal state, linked to the PR", () => {
    const link = draw(cardWith({ latestPr: { ...latestPr, state: "merged" } })).querySelector(
      ".pr-num",
    ) as HTMLAnchorElement;
    expect(link.textContent).toBe("#7 merged");
    expect(link.getAttribute("href")).toBe(PR_URL);
  });

  test("renders just #N while no terminal state is known", () => {
    expect(text(draw(cardWith({ latestPr })), ".pr-num")).toBe("#7");
  });

  test("renders nothing without a recorded PR", () => {
    expect(draw(GREEN_CARD).querySelector(".pr-num")).toBeNull();
  });

  test("does not duplicate #N beside a live PR chip", () => {
    const c = draw(cardWith({ latestPr, pr: { ...prOf(), number: 7, url: PR_URL } }));
    expect(c.querySelectorAll(".pr-num")).toHaveLength(1);
  });
});

describe("<Card/> — the compact card", () => {
  const FOUR_ROWS = ["tc-top", "tc-title", "tc-thread", "tc-foot"];
  const cards: ReadonlyArray<readonly [string, CardView]> = [
    ["waiting", WAITING_CARD],
    ["running", LIVE_CARD],
    ["green", GREEN_CARD],
    ["blocked", BLOCKED_CARD],
    ["deferred", DEFERRED_CARD],
  ];

  test.each(cards)("a %s card has exactly the four rows, in order", (_name, view) => {
    const rows = Array.from((draw(view).querySelector(".tc") as HTMLElement).children).map(
      (c) => c.classList[0],
    );
    expect(rows).toEqual(FOUR_ROWS);
  });

  test.each(cards)("a %s card has none of the retired elements", (_name, view) => {
    const c = draw(view);
    for (const sel of [
      ".mc",
      ".tc-lane",
      ".tc-steps",
      ".step",
      ".arm-btn",
      ".tc-publish",
      ".tc-round",
      ".tc-status",
    ]) {
      expect(c.querySelector(sel)).toBeNull();
    }
    expect(c.textContent).not.toContain("this mac");
    expect(c.textContent).not.toMatch(/Pause|Resume/);
  });

  test("the top row holds the short id link; the title is its own row, as a sentence", () => {
    const c = draw(
      cardWith({
        ticketId: "sabado-274-foo-bar",
        headShort: "sabado-274",
        headTitle: "sabado-274-foo-bar",
        title: "Foo bar",
      }),
    );
    const id = c.querySelector("a.tc-id") as HTMLElement;
    expect(id.textContent).toBe("sabado-274");
    expect(id.getAttribute("title")).toBe("sabado-274-foo-bar");
    expect(text(c, ".tc-title")).toBe("Foo bar");
    expect(c.querySelector(".tc-top .tc-title")).toBeNull();
    expect(c.querySelector(".tc-foot .tc-now")).not.toBeNull();
  });

  test("a ticket id with no number shows whole as the short id, with no title words", () => {
    const c = draw(
      cardWith({ ticketId: "no-number-here", headShort: "no-number-here", title: "" }),
    );
    expect(text(c, "a.tc-id")).toBe("no-number-here");
    expect((text(c, ".tc-title") ?? "").trim()).toBe("");
  });
});

describe("<Card/> — copy the ticket id", () => {
  const stubClipboard = (value: unknown) =>
    Object.defineProperty(navigator, "clipboard", { configurable: true, value });

  test("clicking ⧉ reports the full ticket id, prevents the default, flashes copied; the card never touches the clipboard", async () => {
    const calls: string[] = [];
    stubClipboard({
      writeText: (t: string) => {
        calls.push(t);
        return Promise.resolve();
      },
    });
    const copied: string[] = [];
    const c = draw(cardWith({ ticketId: "sabado-274-foo-bar" }), { onCopy: (t) => copied.push(t) });
    const btn = c.querySelector(".tc-copy") as HTMLElement;
    expect(btn.textContent).toBe("⧉");
    expect(btn.closest("a")).toBeNull();
    expect(fireEvent.click(btn)).toBe(false);
    expect(copied).toEqual(["sabado-274-foo-bar"]);
    expect(calls).toEqual([]);
    await waitFor(() => expect(btn.textContent).toBe("copied"));
  });

  test("the click does not bubble to the card", () => {
    const c = draw(GREEN_CARD);
    let reached = false;
    c.querySelector(".tc")?.addEventListener("click", () => {
      reached = true;
    });
    fireEvent.click(c.querySelector(".tc-copy") as HTMLElement);
    expect(reached).toBe(false);
  });

  test("a browser without a clipboard still flashes copied and does not throw", async () => {
    stubClipboard(undefined);
    const btn = draw(GREEN_CARD).querySelector(".tc-copy") as HTMLElement;
    expect(() => fireEvent.click(btn)).not.toThrow();
    await waitFor(() => expect(btn.textContent).toBe("copied"));
  });

  test("the flash reverts to ⧉ after a moment", async () => {
    const btn = draw(GREEN_CARD).querySelector(".tc-copy") as HTMLElement;
    fireEvent.click(btn);
    await waitFor(() => expect(btn.textContent).toBe("copied"));
    await waitFor(() => expect(btn.textContent).toBe("⧉"), { timeout: 3_000 });
  });

  test("unmounting during the flash leaves no timer to fire", () => {
    fireEvent.click(draw(GREEN_CARD).querySelector(".tc-copy") as HTMLElement);
    expect(() => cleanup()).not.toThrow();
  });

  test("the control carries the full id in its label", () => {
    const btn = draw(GREEN_CARD).querySelector(".tc-copy") as HTMLElement;
    expect(btn.getAttribute("aria-label")).toBe("copy adw-render-03");
    expect(btn.getAttribute("type")).toBe("button");
  });
});

describe("<Card/> — the host chip", () => {
  const chipOf = (gateHost: CardView["gateHost"]) =>
    draw(cardWith({ gateHost })).querySelector(".tc-host");

  test("a remote host reads ⇢ m1max, titled with the gates that ran there", () => {
    const chip = chipOf(REMOTE_HOST);
    expect(chip?.textContent).toBe("⇢ m1max");
    expect(chip?.className).toBe("tc-host remote");
    expect(chip?.getAttribute("title")).toBe("test ran on m1max");
  });

  test("a fallback reads m1max → local in the warn tone, its tooltip listing the gates that re-ran", () => {
    const chip = chipOf(FELL_BACK_HOST);
    expect(chip?.textContent).toBe("m1max → local");
    expect(chip?.classList.contains("warn")).toBe(true);
    expect(chip?.getAttribute("title")).toBe("test, lint re-ran on this mac");
  });

  test("a remote host with no gates yet says the run is queued there", () => {
    const chip = chipOf(QUEUED_HOST);
    expect(chip?.textContent).toBe("⇢ m1max");
    expect(chip?.getAttribute("title")).toBe("queued for a slot on m1max");
    expect(chip?.classList.contains("warn")).toBe(false);
  });

  test("local and absent draw no chip", () => {
    expect(chipOf(LOCAL_HOST)).toBeNull();
    cleanup();
    expect(chipOf(undefined)).toBeNull();
  });
});

describe("<Card/> — the KPI row's right side", () => {
  test("a ship chip carries the view's publish recipe in its tooltip", () => {
    const ship = draw(BLOCKED_CARD).querySelector(".tc-kpis .tc-ship") as HTMLElement;
    expect(ship.textContent).toBe("ship ▸");
    expect(ship.getAttribute("title")).toBe("adw publish --target acme --ticket adw-render-03");
  });

  test("a recipe without a target is shown as the view words it", () => {
    const ship = draw(cardWith({ shipTitle: "adw publish --ticket adw-render-03" })).querySelector(
      ".tc-ship",
    );
    expect(ship?.getAttribute("title")).toBe("adw publish --ticket adw-render-03");
  });

  test("no recipe, no ship chip", () => {
    expect(draw(GREEN_CARD).querySelector(".tc-ship")).toBeNull();
    cleanup();
    expect(draw(DEFERRED_CARD).querySelector(".tc-ship")).toBeNull();
  });

  test("the ship chip stays beside a PR chip that is not an open PR", () => {
    const pr = { kind: "no-repo", label: "no repo", title: "no GitHub repo" } as const;
    expect(draw(cardWith({ ...BLOCKED_CARD, pr })).querySelector(".tc-ship")).not.toBeNull();
  });
});

describe("<Card/> — the stage's click target", () => {
  test("a click on the card body calls onSelect with the ticket id", () => {
    const picked: string[] = [];
    const c = draw(GREEN_CARD, { onSelect: (id) => picked.push(id) });
    fireEvent.click(c.querySelector(".tc-title") as Element);
    expect(picked).toEqual(["adw-render-03"]);
  });

  test("a click on the id link, or a button, does not select", () => {
    const picked: string[] = [];
    const c = draw(GREEN_CARD, { onSelect: (id) => picked.push(id) });
    fireEvent.click(c.querySelector(".tc-id") as Element);
    for (const b of c.querySelectorAll("button")) fireEvent.click(b);
    expect(picked).toEqual([]);
  });

  test("selected adds .sel and data-selected; unselected has neither", () => {
    const on = draw(GREEN_CARD, { selected: true }).querySelector(".tc") as HTMLElement;
    expect(on.classList.contains("sel")).toBe(true);
    expect(on.getAttribute("data-selected")).toBe("true");
    cleanup();
    const off = draw(GREEN_CARD).querySelector(".tc") as HTMLElement;
    expect(off.classList.contains("sel")).toBe(false);
    expect(off.hasAttribute("data-selected")).toBe(false);
  });

  test("without a handler a click throws nothing", () => {
    const c = draw(GREEN_CARD);
    expect(() => fireEvent.click(c.querySelector(".tc") as Element)).not.toThrow();
  });
});

describe("selectOnClick — the shared click guard", () => {
  const clickOn = (html: string, pick: string) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const picked: string[] = [];
    const handler = selectOnClick("t-1-x", (id) => picked.push(id));
    const target = host.querySelector(pick) as HTMLElement;
    target.addEventListener("click", (e) => handler(e));
    target.click();
    host.remove();
    return picked;
  };

  test("a click on an element nested inside a link does not select", () => {
    expect(clickOn(`<a href="#x"><span class="in">id</span></a>`, ".in")).toEqual([]);
  });

  test("a click on an element nested inside a button does not select", () => {
    expect(clickOn(`<button><b class="in">x</b></button>`, ".in")).toEqual([]);
  });

  test("a click on plain body text selects once", () => {
    expect(clickOn(`<p class="in">body</p>`, ".in")).toEqual(["t-1-x"]);
  });

  test("with no handler the guard does nothing", () => {
    const handler = selectOnClick("t-1-x", undefined);
    const target = document.createElement("p");
    document.body.appendChild(target);
    target.addEventListener("click", (e) => handler(e));
    expect(() => target.click()).not.toThrow();
    target.remove();
  });
});

describe("<Card/> — the base red chip", () => {
  const BASE_RED = { sha: "abcdef1234567", gates: [{ name: "test", count: 12 }] };

  test("a view with baseRed renders the chip in tc-meta with the title", () => {
    const chip = draw(cardWith({ baseRed: BASE_RED })).querySelector(".tc-meta .base-red-chip");
    expect(chip?.textContent).toBe("base red");
    expect(chip?.getAttribute("title")).toBe("base abcdef1 was red: test (12 tests)");
  });

  test("a view without baseRed renders no .base-red-chip", () => {
    expect(draw(GREEN_CARD).querySelector(".base-red-chip")).toBeNull();
  });

  test("the chip appears once, as a direct child of tc-meta", () => {
    const c = draw(cardWith({ baseRed: BASE_RED }));
    expect(c.querySelectorAll(".base-red-chip")).toHaveLength(1);
    expect(c.querySelector(".base-red-chip")?.parentElement?.className).toBe("tc-meta");
  });

  test("every red gate is named in the title", () => {
    const chip = draw(
      cardWith({
        baseRed: {
          sha: "abcdef1234567",
          gates: [
            { name: "test", count: 12 },
            { name: "lint", count: 2 },
          ],
        },
      }),
    ).querySelector(".base-red-chip");
    expect(chip?.getAttribute("title")).toBe(
      "base abcdef1 was red: test (12 tests), lint (2 tests)",
    );
  });
});
