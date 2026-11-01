// `<KpiPanel/>` tests: the KPI chip's dropdown body — a pure render of a `KpiPanelView`: five
// headline cells, three sparklines with deltas, the time and outcome stacks, and the
// per-project table.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { KPI_PANEL, KPI_PANEL_EMPTY, KPI_PANEL_LABELS } from "../../../fixtures/KpiPanel";
import { KpiPanel, type KpiPanelView } from "./KpiPanel";

afterEach(cleanup);

const draw = (view: KpiPanelView): Element =>
  render(<KpiPanel view={view} labels={KPI_PANEL_LABELS} />).container;

const text = (c: Element, sel: string): string | null | undefined =>
  c.querySelector(sel)?.textContent;

const cell = (c: Element, name: string, part: string): Element =>
  c.querySelector(`[data-cell="${name}"] .${part}`) as Element;

const spark = (c: Element, name: string): Element =>
  c.querySelector(`[data-spark="${name}"]`) as Element;

const stack = (c: Element, name: string): Element =>
  c.querySelector(`[data-stack="${name}"]`) as Element;

const row = (c: Element, target: string): Element =>
  c.querySelector(`[data-project="${target}"]`) as Element;

describe("<KpiPanel/> — the five headline cells", () => {
  test("the cells come in the view's order, each with label, value and sub-line", () => {
    const c = draw(KPI_PANEL);
    expect([...c.querySelectorAll("[data-cell]")].map((e) => e.getAttribute("data-cell"))).toEqual([
      "green",
      "blocked",
      "median",
      "spend",
      "prs",
    ]);
    expect(text(cell(c, "green", "kp-l").parentElement as Element, ".kp-l")).toBe("green");
    expect(cell(c, "green", "kp-v").textContent).toBe("74%");
    expect(cell(c, "green", "kp-s").textContent).toBe("74 of 99 runs");
    expect(cell(c, "median", "kp-v").textContent).toBe("12m 34s");
    expect(cell(c, "prs", "kp-s").textContent).toBe("72 merged");
  });

  test("blocked takes the bad hue and spend the ok hue", () => {
    const c = draw(KPI_PANEL);
    expect(cell(c, "blocked", "kp-v").className).toBe("kp-v bad");
    expect(cell(c, "spend", "kp-v").className).toBe("kp-v ok");
  });

  test("the green and PR cells carry no hue", () => {
    const c = draw(KPI_PANEL);
    expect(cell(c, "green", "kp-v").className).toBe("kp-v");
    expect(cell(c, "prs", "kp-v").className).toBe("kp-v");
  });

  test("an unmeasured window shows a dash, not NaN", () => {
    const c = draw(KPI_PANEL_EMPTY);
    expect(cell(c, "green", "kp-v").textContent).toBe("—");
    expect(cell(c, "blocked", "kp-v").textContent).toBe("—");
    expect(cell(c, "blocked", "kp-v").className).toBe("kp-v bad");
    expect(c.textContent).not.toContain("NaN");
  });

  test("the footer is the view's foot line", () => {
    expect(text(draw(KPI_PANEL), ".kp-foot")).toBe("last 7 days · adw metrics");
  });

  test("rendering twice gives the same markup (pure)", () => {
    expect(draw(KPI_PANEL).innerHTML).toBe(draw(KPI_PANEL).innerHTML);
  });
});

describe("<KpiPanel/> — the per-project table", () => {
  test("rows follow the view's order under the labelled header", () => {
    const c = draw(KPI_PANEL);
    expect([...c.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "project",
      "runs",
      "live",
      "green",
      "blocked",
      "median",
      "spend",
    ]);
    expect(
      [...c.querySelectorAll("tbody tr")].map((tr) => tr.getAttribute("data-project")),
    ).toEqual(["proj-a", "proj-b"]);
    expect([...row(c, "proj-a").querySelectorAll("td")].map((td) => td.textContent)).toEqual([
      "proj-a",
      "60",
      "2",
      "80%",
      "12",
      "11m 02s",
      "$80.10",
    ]);
  });

  test("the green cell is a bar plus the percent; a project with no measure shows a dash and no bar", () => {
    const c = draw(KPI_PANEL);
    const measured = row(c, "proj-a").querySelector('[data-col="green"]') as Element;
    expect(measured.querySelector(".kp-gtrack .kp-gbar")?.getAttribute("style")).toContain(
      "width: 80%",
    );
    const unmeasured = row(c, "proj-b").querySelector('[data-col="green"]') as Element;
    expect(unmeasured.querySelector(".kp-gtrack")).toBeNull();
    expect(unmeasured.textContent).toBe("—");
  });

  test("blocked is bad only when above zero; spend is ok", () => {
    const c = draw(KPI_PANEL);
    expect(row(c, "proj-a").querySelector('[data-col="blocked"]')?.className).toBe("bad");
    expect(row(c, "proj-b").querySelector('[data-col="blocked"]')?.className).toBe("");
    expect(row(c, "proj-b").querySelector('[data-col="spend"]')?.className).toBe("ok");
  });

  test("a window with no project draws the header and no row", () => {
    const c = draw(KPI_PANEL_EMPTY);
    expect(c.querySelectorAll("thead th")).toHaveLength(7);
    expect(c.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});

describe("<KpiPanel/> — the three sparklines", () => {
  test("they come in the view's order, eight bars each", () => {
    const c = draw(KPI_PANEL);
    expect(
      [...c.querySelectorAll("[data-spark]")].map((e) => e.getAttribute("data-spark")),
    ).toEqual(["runs", "green", "spend"]);
    for (const name of ["runs", "green", "spend"]) {
      expect(spark(c, name).querySelectorAll(".kp-bar")).toHaveLength(8);
    }
  });

  test("each bar's height is the view's percent", () => {
    const heights = [...spark(draw(KPI_PANEL), "runs").querySelectorAll(".kp-bar")].map(
      (b) => (b as HTMLElement).style.height,
    );
    expect(heights).toEqual(["13%", "25%", "50%", "100%", "25%", "0%", "38%", "13%"]);
  });

  test("labels sit on the buckets that carry one", () => {
    const labels = [...spark(draw(KPI_PANEL), "runs").querySelectorAll(".kp-col")].map(
      (col) => col.querySelector(".kp-lbl")?.textContent ?? null,
    );
    expect(labels).toEqual(["00h", null, "06h", null, "12h", null, "18h", null]);
  });

  test("hues: green bars ok, spend bars model, runs neutral", () => {
    const c = draw(KPI_PANEL);
    expect(spark(c, "runs").querySelector(".kp-bar")?.className).toBe("kp-bar");
    expect(spark(c, "green").querySelector(".kp-bar")?.className).toBe("kp-bar ok");
    expect(spark(c, "spend").querySelector(".kp-bar")?.className).toBe("kp-bar model");
  });

  test("a delta shows its text with the tooltip; no delta shows nothing", () => {
    const c = draw(KPI_PANEL);
    const runs = spark(c, "runs").querySelector(".kp-delta") as Element;
    expect(runs.textContent).toBe("▲ 56%");
    expect(runs.getAttribute("title")).toBe("vs the 24 h before");
    const spend = spark(c, "spend").querySelector(".kp-delta") as Element;
    expect(spend.textContent).toBe("");
    expect(spend.hasAttribute("title")).toBe(false);
  });

  test("an all-zero series draws flat bars, not NaN heights", () => {
    const c = draw(KPI_PANEL_EMPTY);
    for (const bar of spark(c, "runs").querySelectorAll(".kp-bar")) {
      expect((bar as HTMLElement).style.height).toBe("0%");
    }
    expect(c.innerHTML).not.toContain("NaN");
  });
});

describe("<KpiPanel/> — the time and outcome stacks", () => {
  test("the time bar has one segment per part, flex proportional, with the legend", () => {
    const time = stack(draw(KPI_PANEL), "time");
    const segs = [...time.querySelectorAll(".kp-seg")] as HTMLElement[];
    expect(segs.map((s) => s.className)).toEqual(["kp-seg model", "kp-seg tool", "kp-seg hatch"]);
    expect(segs.map((s) => s.style.flex)).toEqual(["500 1 0%", "380 1 0%", "120 1 0%"]);
    expect(text(time, ".kp-legend")).toBe("agent 50% · factory 38% · wait 12%");
  });

  test("the outcome bar maps its segments to ok / bad / warn / live in order", () => {
    const outcome = stack(draw(KPI_PANEL), "outcome");
    expect([...outcome.querySelectorAll(".kp-seg")].map((s) => s.className)).toEqual([
      "kp-seg ok",
      "kp-seg bad",
      "kp-seg warn",
      "kp-seg live",
    ]);
    expect(text(outcome, ".kp-legend")).toBe("74 green · 20 blocked · 5 deferred · 3 live");
  });

  test("empty totals draw no segments and a dash legend", () => {
    const c = draw(KPI_PANEL_EMPTY);
    for (const name of ["time", "outcome"]) {
      expect(stack(c, name).querySelectorAll(".kp-seg")).toHaveLength(0);
      expect(text(stack(c, name), ".kp-legend")).toBe("—");
    }
  });

  test("a single segment is the only one drawn", () => {
    const only: KpiPanelView = {
      ...KPI_PANEL,
      stacks: [
        {
          name: "outcome",
          title: "outcomes",
          segments: [{ key: "live", cls: "live", value: 3 }],
          legend: "0 green · 0 blocked · 0 deferred · 3 live",
        },
      ],
    };
    const outcome = stack(draw(only), "outcome");
    expect(outcome.querySelectorAll(".kp-seg")).toHaveLength(1);
    expect(text(outcome, ".kp-legend")).toBe("0 green · 0 blocked · 0 deferred · 3 live");
  });
});
