// `<UsagePanel/>`: the pinned subscription-headroom panel. Literal view models; deriving tones,
// the read age, the plan line, the Codex header, the spend figures and the contributing grid from
// the reads is the factory's projection.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  CODEX_BARE,
  CODEX_ONE_GAUGE,
  CODEX_ROW_HEADER,
  CODEX_SPEND_CONTROL,
  CODEX_TWO_GAUGES,
  CONTRIBUTING,
  CONTRIBUTING_MARKUP,
  CONTRIBUTING_TOPS,
  FABLE_GAUGE,
  MARKUP_SKILL,
  OPUS_GAUGE,
  RESETTING_GAUGE,
  SESSION_GAUGE,
  SPEND,
  SPEND_EMPTY,
  SPEND_WITH_UNKNOWN,
  USAGE_PANEL,
  USAGE_PANEL_FULL,
  USAGE_PANEL_LABELS,
  USAGE_PANEL_LOADING,
  USAGE_PANEL_UNAVAILABLE,
  WEEK_GAUGE,
} from "../../../fixtures/UsagePanel";
import { UsagePanel, type UsagePanelProps } from "./UsagePanel";

afterEach(cleanup);

const panel = (over: Partial<UsagePanelProps> = {}) =>
  render(
    <UsagePanel
      view={USAGE_PANEL}
      labels={USAGE_PANEL_LABELS}
      open={true}
      onClose={() => {}}
      {...over}
    />,
  );

const ok = (over: Partial<typeof USAGE_PANEL> = {}): UsagePanelProps["view"] => ({
  ...USAGE_PANEL,
  ...over,
});

describe("<UsagePanel/> — hidden vs open", () => {
  test("hidden when open is false", () => {
    const { container } = panel({ open: false });
    expect((container.querySelector(".up-panel") as HTMLElement).hidden).toBe(true);
  });

  test("populated when open is true", () => {
    const { container } = panel();
    expect((container.querySelector(".up-panel") as HTMLElement).hidden).toBe(false);
  });
});

describe("<UsagePanel/> — no reading yet", () => {
  test("loading → the panel exists, opens, and says it is reading", () => {
    const { container } = panel({ view: USAGE_PANEL_LOADING });
    const el = container.querySelector(".up-panel") as HTMLElement;
    expect(el.hidden).toBe(false);
    expect(el.querySelector(".up-title")?.textContent).toContain("subscription headroom");
    expect(el.querySelector(".up-loading")?.textContent).toContain("reading usage");
  });
});

describe("<UsagePanel/> — degraded reading", () => {
  test("unavailable shows the reason, never a crash", () => {
    const { container } = panel({ view: USAGE_PANEL_UNAVAILABLE });
    expect(container.querySelector(".up-none")?.textContent).toContain("no usage read");
  });
});

describe("<UsagePanel/> — read age", () => {
  test("shows the age text it is given", () => {
    const { container } = panel();
    expect(container.querySelector(".up-age")?.textContent).toBe("read 30s ago");
  });
});

describe("<UsagePanel/> — close button", () => {
  test("clicking the close button calls onClose", () => {
    let closed = 0;
    const { container } = panel({ onClose: () => closed++ });
    fireEvent.click(container.querySelector(".up-x") as HTMLElement);
    expect(closed).toBe(1);
  });
});

describe("<UsagePanel/> — gauge cards carry their tone", () => {
  test("a warn gauge reads 'up-g warn', a bad one 'up-g bad'", () => {
    const warn = panel({ view: ok({ gauges: [WEEK_GAUGE] }) });
    expect(warn.container.querySelector(".up-g")?.className).toBe("up-g warn");
    warn.unmount();

    const bad = panel({ view: ok({ gauges: [FABLE_GAUGE] }) });
    expect(bad.container.querySelector(".up-g")?.className).toBe("up-g bad");
  });

  test("a card shows its percent, its bar width, its remainder and its countdown", () => {
    const { container } = panel({ view: ok({ gauges: [SESSION_GAUGE] }) });
    expect(container.querySelector(".up-g-n b")?.textContent).toBe("14%");
    expect((container.querySelector(".up-bar > span") as HTMLElement).style.width).toBe("14%");
    expect(container.querySelector(".up-left")?.textContent).toBe("86% left");
    expect(container.querySelector(".up-cd")?.textContent).toBe("4h 12m");
  });
});

describe("<UsagePanel/> — plan line", () => {
  test("a plan renders as the up-plan tag", () => {
    const { container } = panel({ view: ok({ plan: "You are on the Max plan." }) });
    expect(container.querySelector(".up-plan")?.textContent).toBe("You are on the Max plan.");
  });

  test("no plan, no tag", () => {
    const { container } = panel();
    expect(container.querySelector(".up-plan")).toBeNull();
  });
});

describe("<UsagePanel/> — the gauge order is the view's", () => {
  test("cards render in the order the view lists them", () => {
    const { container } = panel({
      view: ok({ gauges: [SESSION_GAUGE, WEEK_GAUGE, FABLE_GAUGE], unknownBuckets: ["Opus"] }),
    });
    const labels = Array.from(container.querySelectorAll(".up-g-l")).map((el) => el.textContent);
    expect(labels).toEqual(["5-hour session", "week · all models", "week · Fable", "week · Opus"]);
  });
});

describe("<UsagePanel/> — the contributing grid", () => {
  test("a missing metric renders '—' in its column, a present one its figure", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING }) });
    const rows = Array.from(container.querySelectorAll(".up-gr-r"));
    const row = rows.find((r) => r.textContent?.includes("at >150k context"));
    expect(row?.querySelector(".up-nil")?.textContent).toBe("—");
    expect(row?.textContent).toContain("75%");
  });

  test("an unmatched behaviour spills verbatim below the grid", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING }) });
    expect(container.querySelector(".up-loose")?.textContent).toBe(
      "Last 24h · 10% of your usage was while 4+ sessions ran in parallel",
    );
  });

  test("requests and sessions render as real figures", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING }) });
    expect(container.textContent).toContain("1,528");
    expect(container.textContent).toContain("1,940");
  });

  test("a grid with its own column template puts it on every row", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING }) });
    for (const row of container.querySelectorAll(".up-gr-h, .up-gr-r")) {
      expect(row.getAttribute("style")).toContain("grid-template-columns");
    }
  });

  test("no grid in the view renders no contributing grid, no crash", () => {
    const { container } = panel();
    expect(container.querySelector(".up-grid")).toBeNull();
  });

  test("a hovered 'scope' note shows when the view carries a disclaimer", () => {
    const withNote = panel({ view: USAGE_PANEL_FULL });
    expect(withNote.container.querySelector(".up-sec:last-child .up-sec-h em")?.textContent).toBe(
      "this machine only — not other devices or claude.ai",
    );
    withNote.unmount();

    const without = panel();
    expect(without.container.querySelector(".up-sec-h em")).toBeNull();
  });
});

describe("<UsagePanel/> — untrusted text renders as literal text, not markup", () => {
  test("a skill name with HTML-special characters renders literally", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING_MARKUP }) });
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(MARKUP_SKILL);
  });
});

describe("<UsagePanel/> — the contributing grid's skills/MCP 'tops' rows", () => {
  test("a period with skills renders .up-top chips; a period with none renders up-nil in its own column", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING_TOPS }) });
    const skillsRow = Array.from(container.querySelectorAll(".up-gr-r.up-gr-c")).find(
      (r) => r.querySelector("i")?.textContent === "skills",
    );
    expect(skillsRow).toBeDefined();
    const tops = skillsRow?.querySelectorAll(".up-top") ?? [];
    expect(tops).toHaveLength(2);
    expect(tops[0]?.textContent).toContain("/prime");
    expect(tops[0]?.textContent).toContain("40%");
    const cols = skillsRow?.querySelectorAll(".up-tops") ?? [];
    expect(cols[1]?.querySelector(".up-nil")).not.toBeNull();
  });

  test("no tops in the view → no tops row renders", () => {
    const { container } = panel({ view: ok({ contributing: CONTRIBUTING }) });
    expect(container.querySelectorAll(".up-gr-c")).toHaveLength(0);
  });
});

describe("<UsagePanel/> — a gauge with resetsAt renders its own reset line and tooltip", () => {
  test("resetsAt renders the .up-rs line; the title is the card's tooltip", () => {
    const { container } = panel({ view: ok({ gauges: [RESETTING_GAUGE] }) });
    const card = container.querySelector(".up-g") as HTMLElement;
    expect(card.querySelector(".up-rs")?.textContent).toBe("resets Sep 17 at 2:50am");
    expect(card.getAttribute("title")).toBe("resets Sep 17 at 2:50am Europe/Paris");
  });

  test("no resetsAt at all -> no .up-rs line, no crash", () => {
    const { container } = panel({ view: ok({ gauges: [SESSION_GAUGE] }) });
    expect(container.querySelector(".up-rs")).toBeNull();
    expect(container.querySelector(".up-g")?.hasAttribute("title")).toBe(false);
  });
});

describe("<UsagePanel/> — the Codex row", () => {
  test("no codex in the view -> no .cx-row, no crash", () => {
    const { container } = panel();
    expect(container.querySelector(".cx-row")).toBeNull();
  });

  test("a row without gauges prints its header verbatim and no .up-gs", () => {
    const { container } = panel({ view: ok({ codex: CODEX_BARE }) });
    const row = container.querySelector(".cx-row");
    expect(row?.className).toBe("cx-row");
    expect(row?.textContent).toBe(CODEX_ROW_HEADER);
    expect(container.querySelector(".cx-row .up-gs")).toBeNull();
  });

  test("spend control reached -> red row, exact text, no gauges", () => {
    const { container } = panel({ view: ok({ codex: CODEX_SPEND_CONTROL }) });
    const row = container.querySelector(".cx-row");
    expect(row?.className).toBe("cx-row bad");
    expect(row?.textContent).toBe("Plan spend control reached");
    expect(row?.querySelectorAll(".up-g")).toHaveLength(0);
  });

  test("two gauges -> two .up-g cards inside .cx-row, with the right label and pct", () => {
    const { container } = panel({ view: ok({ codex: CODEX_TWO_GAUGES }) });
    const cards = container.querySelectorAll(".cx-row .up-g");
    expect(cards).toHaveLength(2);
    expect(cards[0]?.querySelector(".up-g-l")?.textContent).toBe("Codex primary");
    expect(cards[0]?.querySelector(".up-g-n b")?.textContent).toContain("42");
    expect(cards[1]?.querySelector(".up-g-l")?.textContent).toBe("Codex secondary");
    expect(cards[1]?.querySelector(".up-g-n b")?.textContent).toContain("15");
  });

  test("one gauge -> exactly one .up-g card", () => {
    const { container } = panel({ view: ok({ codex: CODEX_ONE_GAUGE }) });
    expect(container.querySelectorAll(".cx-row .up-g")).toHaveLength(1);
  });

  test("a Codex gauge with an empty countdown keeps .up-cd empty and .up-rs shows resetsAt verbatim", () => {
    const { container } = panel({ view: ok({ codex: CODEX_ONE_GAUGE }) });
    const card = container.querySelector(".cx-row .up-g");
    expect(card?.querySelector(".up-cd")?.textContent).toBe("");
    expect(card?.querySelector(".up-rs")?.textContent).toBe("resets 2026-09-28T08:00:00Z");
  });

  test("the Codex row still renders when the Claude read is unavailable", () => {
    const { container } = panel({ view: { ...USAGE_PANEL_UNAVAILABLE, codex: CODEX_ONE_GAUGE } });
    expect(container.querySelector(".cx-row")).not.toBeNull();
  });
});

describe("<UsagePanel/> — factory spend by provider", () => {
  const rows = (c: Element) => [...c.querySelectorAll(".sp-sec .up-gr-r")] as HTMLElement[];
  const hasRow = (c: Element, name: string) => rows(c).some((r) => r.textContent?.includes(name));

  test("no spend in the view → nothing rendered", () => {
    const { container } = panel();
    expect(container.textContent).not.toContain("FACTORY SPEND BY PROVIDER");
  });

  test("heading and the 'factory runs only' scope note", () => {
    const { container } = panel({ view: ok({ spend: SPEND_EMPTY }) });
    expect(container.textContent).toContain("FACTORY SPEND BY PROVIDER");
    expect(container.textContent).toContain(
      "factory runs only — interactive sessions are not in the journals",
    );
  });

  test("a row prints its provider and its honesty note", () => {
    const { container } = panel({ view: ok({ spend: SPEND_EMPTY }) });
    expect(hasRow(container, "claude")).toBe(true);
    expect(hasRow(container, "codex")).toBe(true);
    expect(container.textContent).toContain("API-equivalent, you pay a subscription");
    expect(container.textContent).toContain("API-equivalent, not your plan bill");
  });

  test("its columns are Last 24h / Last 7d, on the same grid template on every row", () => {
    const { container } = panel({ view: ok({ spend: SPEND_EMPTY }) });
    const head = container.querySelector(".sp-sec .up-gr-h") as HTMLElement;
    expect([...head.querySelectorAll("span")].map((s) => s.textContent)).toEqual([
      "",
      "Last 24h",
      "Last 7d",
    ]);
    expect(head.classList.contains("up-sp-cols")).toBe(true);
    for (const row of rows(container)) expect(row.classList.contains("up-sp-cols")).toBe(true);
  });

  test("a priced cell shows tokens, runs and ~$ with the basis as its tooltip", () => {
    const { container } = panel({ view: ok({ spend: SPEND }) });
    const cell = rows(container)[0]?.querySelectorAll(":scope > span")[0] as HTMLElement;
    expect(cell.textContent).toContain("1,500");
    expect(cell.textContent).toContain("2 runs");
    expect(cell.textContent).toContain("~$3.50");
    expect(cell.querySelector('[title="the-basis"]')).not.toBeNull();
  });

  test("an unpriced share reads `N tok unpriced`, and no price at all never renders $0", () => {
    const { container } = panel({ view: ok({ spend: SPEND }) });
    const codexRow = rows(container)[1] as HTMLElement;
    expect(codexRow.textContent).toContain("700 tok unpriced");
    expect(codexRow.textContent).not.toContain("$0");
    expect(codexRow.textContent).not.toContain("~$");
  });

  test("an empty cell is '—'", () => {
    const { container } = panel({ view: ok({ spend: SPEND_EMPTY }) });
    const cell = rows(container)[0]?.querySelectorAll(":scope > span")[0] as HTMLElement;
    expect(cell.querySelector(".up-nil")?.textContent).toBe("—");
  });

  test("the rows are the view's: unknown shows when the view lists it, not otherwise", () => {
    const first = panel({ view: ok({ spend: SPEND }) });
    expect(hasRow(first.container, "unknown")).toBe(false);
    cleanup();

    const second = panel({ view: ok({ spend: SPEND_WITH_UNKNOWN }) });
    expect(hasRow(second.container, "unknown")).toBe(true);
  });

  test("still renders when the Claude read is unavailable", () => {
    const { container } = panel({ view: { ...USAGE_PANEL_UNAVAILABLE, spend: SPEND_EMPTY } });
    expect(container.textContent).toContain("FACTORY SPEND BY PROVIDER");
  });
});

describe("<UsagePanel/> — per-model weekly buckets", () => {
  const cards = (container: Element): string[] =>
    [...container.querySelectorAll(".up-g")].map((c) => c.textContent ?? "");

  test("both reported → both figures, no 'unknown'", () => {
    const { container } = panel({
      view: ok({ gauges: [SESSION_GAUGE, OPUS_GAUGE, FABLE_GAUGE], unknownBuckets: [] }),
    });
    const text = cards(container).join("|");
    expect(text).toContain("week · Opus");
    expect(text).toContain("week · Fable");
    expect(text).not.toContain("unknown");
    expect(container.querySelectorAll(".up-g")).toHaveLength(3);
  });

  test("Opus unreported → Opus renders unknown: no %, no bar", () => {
    const { container } = panel({
      view: ok({ gauges: [SESSION_GAUGE, FABLE_GAUGE], unknownBuckets: ["Opus"] }),
    });
    const unknown = [...container.querySelectorAll(".up-g")].find((c) =>
      (c.textContent ?? "").includes("week · Opus"),
    ) as HTMLElement;
    expect(unknown.textContent).toContain("unknown");
    expect(unknown.textContent).not.toContain("%");
    expect(unknown.querySelector(".up-bar")).toBeNull();
    expect(unknown.querySelector(".up-nil")).not.toBeNull();
  });

  test("neither reported → both unknown", () => {
    const { container } = panel({
      view: ok({ gauges: [SESSION_GAUGE], unknownBuckets: ["Opus", "Fable"] }),
    });
    const unknowns = cards(container).filter((t) => t.includes("unknown"));
    expect(unknowns).toHaveLength(2);
    expect(unknowns.some((t) => t.includes("week · Opus"))).toBe(true);
    expect(unknowns.some((t) => t.includes("week · Fable"))).toBe(true);
  });

  test("an unavailable view renders no per-model unknown cards", () => {
    const { container } = panel({ view: USAGE_PANEL_UNAVAILABLE });
    expect(container.textContent).not.toContain("week · Opus");
    expect(container.textContent).not.toContain("week · Fable");
  });

  test("a reported 0% is a figure, not unknown", () => {
    const { container } = panel({
      view: ok({
        gauges: [
          { ...OPUS_GAUGE, pct: 0, left: 100 },
          { ...FABLE_GAUGE, pct: 0, left: 100, tone: "ok" },
        ],
        unknownBuckets: [],
      }),
    });
    expect(container.textContent).not.toContain("unknown");
  });
});
