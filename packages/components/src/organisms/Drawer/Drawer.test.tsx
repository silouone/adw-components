import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  BLOCK,
  DRAWER,
  FAILED_BLOCK,
  FAILURE,
  FIGURES,
  FINDING,
  GATES_FIGURES,
  LABELS,
  LIVE_FIGURES,
  NOT_APPLICABLE_FIGURES,
  REVIEW_DRAWER,
} from "../../../fixtures/Drawer";
import { Drawer, type DrawerProps } from "./Drawer";

// test the figure projection (the metric tri-state, the gate-host chip and fallback derivation,
// the tok/s arithmetic) are not copied; this file proves the markup of the figures it is given.

afterEach(cleanup);

const view = (props: Partial<DrawerProps> = {}) =>
  render(<Drawer block={BLOCK} laneRole="build" figures={FIGURES} labels={LABELS} {...props} />)
    .container;

const stat = (container: Element, label: string): string | null | undefined =>
  [...container.querySelectorAll(".card-stats div")]
    .find((d) => d.querySelector("span")?.textContent === label)
    ?.querySelector("b")?.textContent;

describe("<Drawer/> — stats", () => {
  test("every figure the card prints is shown as given, n/a included", () => {
    expect(stat(view(), "turns")).toBe("3");
    expect(stat(view({ figures: NOT_APPLICABLE_FIGURES }), "turns")).toBe("n/a");
    expect(stat(view(), "tok/s (model)")).toBe("9.1");
  });

  test("the header carries the node, the lane role and the purpose", () => {
    const hd = view().querySelector(".card-hd");
    expect(hd?.textContent).toContain("build");
    expect(hd?.querySelector(".card-role")?.textContent).toBe("build");
    expect(hd?.querySelector(".card-why")?.textContent).toBe("writes the change");
    expect(hd?.querySelector(".mk")?.className).toContain("ok");
  });
});

describe("<Drawer/> — prompt states", () => {
  const withPrompt = (prompt: NonNullable<(typeof DRAWER)["prompt"]>) =>
    view({ drawer: { node: "build", kind: "agent", prompt } }).textContent;

  test("'ok' shows the prompt text", () => {
    expect(withPrompt({ status: "ok", text: "hello prompt body" })).toContain("hello prompt body");
  });

  test("'not-persisted' shows its reason, or a generic line with no 'undefined'", () => {
    expect(withPrompt({ status: "not-persisted", reason: "ENOSPC" })).toContain("ENOSPC");
    const bare = withPrompt({ status: "not-persisted" });
    expect(bare).toContain("prompt not persisted");
    expect(bare).not.toContain("undefined");
  });

  test("'mismatch' shows both byte/hash pairs", () => {
    const text = withPrompt({
      status: "mismatch",
      expectedBytes: 100,
      expectedHash: "aaa",
      actualBytes: 90,
      actualHash: "bbb",
    });
    for (const part of ["100", "aaa", "90", "bbb"]) expect(text).toContain(part);
  });
});

describe("<Drawer/> — system prompt and config states", () => {
  const text = (drawer: Partial<NonNullable<DrawerProps["drawer"]>>) =>
    view({ drawer: { node: "build", kind: "agent", ...drawer } });

  test("'preset', 'empty' and 'not-recorded' each render distinct text", () => {
    const shown = (status: "preset" | "empty" | "not-recorded") =>
      text({ systemPrompt: { status } }).querySelector(".drawer-system-prompt")?.textContent;
    expect(new Set([shown("preset"), shown("empty"), shown("not-recorded")]).size).toBe(3);
    expect(shown("preset")).toContain("system prompt: preset");
  });

  test("'captured' pretty-prints the config across lines, never one JSON line", () => {
    const pre = text({ config: { status: "captured", config: { a: 1, b: [2] } } }).querySelector(
      ".config-captured",
    );
    expect(pre?.textContent).toBe(JSON.stringify({ a: 1, b: [2] }, null, 2));
    expect(pre?.textContent?.split("\n").length).toBeGreaterThan(1);
  });

  test("'not-captured-on-provider' and 'absent' each carry the config label", () => {
    for (const status of ["not-captured-on-provider", "absent"] as const) {
      expect(text({ config: { status } }).querySelector(".drawer-config")?.textContent).toMatch(
        /^config: \S/,
      );
    }
  });

  test("the prompt, system prompt and config all render together for one drawer", () => {
    const c = view({ drawer: DRAWER });
    for (const cls of [".drawer-prompt", ".drawer-system-prompt", ".drawer-config"]) {
      expect(c.querySelector(cls)).not.toBeNull();
    }
  });
});

describe("<Drawer/> — the model/tool split bar", () => {
  test("a split renders both figures and the bar widths", () => {
    const c = view();
    expect(c.querySelector(".sl")?.textContent).toContain("model 45s");
    expect(c.querySelector(".sl")?.textContent).toContain("tool 20s");
    expect(c.querySelector(".s-model")?.getAttribute("style")).toContain("70.0%");
  });

  test("a blocked-on-subagent time is named as a figure; none renders no such text", () => {
    const split = { modelPct: "70.0", toolPct: "30.0", model: "45s", tool: "20s", subagent: "5s" };
    expect(view({ figures: { ...FIGURES, split } }).textContent).toContain(
      "blocked on subagent 5s",
    );
    expect(view().textContent).not.toContain("blocked on subagent");
  });

  test("no split renders no bar at all", () => {
    expect(view({ figures: NOT_APPLICABLE_FIGURES }).querySelector(".card-split")).toBeNull();
  });
});

describe("<Drawer/> — optional slots", () => {
  test("no round, watchdog or drawer renders none of those elements", () => {
    const c = view();
    expect(c.querySelector(".badge")).toBeNull();
    expect(c.querySelector(".drawer-node")).toBeNull();
  });

  test("a round and a watchdog render in the header", () => {
    const c = view({
      block: { node: "build", round: { round: 2, of: 3 }, watchdog: { reason: "no output" } },
    });
    expect(c.querySelector(".card-hd")?.textContent).toContain("attempt 2 of 3");
    expect(c.querySelector(".card-hd")?.textContent).toContain("lane stalled: no output");
  });

  test("block gates render one chip per gate, pass/fail classed; none render no row", () => {
    const chips = [
      ...view({
        figures: {
          ...FIGURES,
          blockGates: [
            { name: "lint", pass: true },
            { name: "test", pass: false },
          ],
        },
      }).querySelectorAll(".gg"),
    ];
    expect(chips.map((c) => c.className)).toEqual(["gg gp", "gg gf"]);
    expect(chips.map((c) => c.textContent)).toEqual(["✓ lint", "✕ test"]);
    expect(
      view({ figures: { ...FIGURES, blockGates: [] } }).querySelector(".card-gates"),
    ).toBeNull();
  });

  test("the drawer body's attempt renders 'attempt N of M'", () => {
    expect(view({ drawer: DRAWER }).querySelector(".drawer-attempt")?.textContent).toBe(
      "attempt 2 of 3",
    );
  });
});

describe("<Drawer/> — gate rows", () => {
  const gates = () => [
    ...view({ drawer: DRAWER, figures: GATES_FIGURES }).querySelectorAll(".drawer-gates span"),
  ];

  test("one gate-pass / gate-fail span per gate, distinct from the card's own chips", () => {
    expect(gates().map((g) => g.className)).toEqual(["gate-pass", "gate-fail"]);
  });

  test("a remote chip renders .gate-host, a fallback note .gate-fallback, a local gate neither", () => {
    const [remote, fallback] = gates();
    expect(remote?.querySelector(".gate-host")?.textContent).toBe("⇢ m1max");
    expect(remote?.querySelector(".gate-fallback")).toBeNull();
    expect(fallback?.querySelector(".gate-fallback")?.textContent).toBe("fell back to local");
    expect(fallback?.querySelector(".gate-host")).toBeNull();
  });

  test("a host name with markup is rendered as text", () => {
    const figures = {
      ...FIGURES,
      gates: [{ name: "lint", cls: "gate-pass" as const, chip: "<b>x</b>" }],
    };
    const host = view({ drawer: DRAWER, figures }).querySelector(".gate-host");
    expect(host?.textContent).toBe("<b>x</b>");
    expect(host?.querySelector("b")).toBeNull();
  });

  test("no gates renders no gate rows", () => {
    expect(view({ drawer: DRAWER }).querySelector(".drawer-gates")).toBeNull();
  });
});

describe("<Drawer/> — the review verdict", () => {
  const review = () => view({ drawer: REVIEW_DRAWER });

  test("one .review-finding per finding, carrying severity, file:line, citation and summary", () => {
    const first = review().querySelectorAll(".review-finding")[0];
    expect(first?.querySelector(".rf-sev")?.textContent).toBe("hard");
    expect(first?.querySelector(".rf-loc")?.textContent).toBe("src/a.ts:12");
    expect(first?.querySelector(".rf-summary")?.textContent).toBe(FINDING.summary);
    expect(first?.querySelector(".rf-cite")?.textContent).toBe("spec §4");
  });

  test("a finding's kind is shown; a file-only finding renders no trailing colon", () => {
    const [first, second] = [...review().querySelectorAll(".review-finding")];
    expect(first?.querySelector(".rf-kind")?.textContent).toBe("missing");
    expect(second?.querySelector(".rf-loc")?.textContent).toBe("src/a.ts");
    expect(second?.querySelector(".rf-kind")).toBeNull();
  });

  test("a clean verdict says so explicitly", () => {
    const clean = view({
      drawer: { node: "r", kind: "review", review: { axis: "spec", findings: [] } },
    });
    expect(clean.querySelector(".review-clean")?.textContent).toBe("no findings");
    expect(clean.querySelector(".review-findings")).toBeNull();
  });

  test("dispositions render the verdict and its reason per finding", () => {
    const d = review().querySelector(".review-disposition");
    expect(d?.querySelector(".rd-sev")?.className).toContain("rd-fixed");
    expect(d?.querySelector(".rf-summary")?.textContent).toBe("added the guard");
  });

  test("no review slot renders no .drawer-review section", () => {
    expect(view({ drawer: DRAWER }).querySelector(".drawer-review")).toBeNull();
  });
});

describe("<Drawer/> — live usage", () => {
  test("a live block renders context now, calls and the token breakdown", () => {
    const live = view({ drawer: DRAWER, figures: LIVE_FIGURES });
    expect(live.querySelector(".live-context-now")?.textContent).toBe("context now: 42,000");
    expect(live.querySelector(".live-calls")?.textContent).toBe("calls: 7");
    expect(live.querySelector(".live-tokens")?.textContent).toBe(
      "tokens: 9,100 (in 6,000, out 1,100, cache read 1,500, cache write 500)",
    );
  });

  test("no live slot renders no live section", () => {
    expect(view({ drawer: DRAWER }).querySelector(".drawer-live")).toBeNull();
  });
});

describe("<Drawer/> — a failed node's reason and triage view", () => {
  test("a failed block shows its reason", () => {
    expect(view({ block: FAILED_BLOCK }).querySelector(".card-reason")?.textContent).toBe(
      "exit 1 in test-frontend",
    );
  });

  test("a block with no reason has no reason line", () => {
    expect(view().querySelector(".card-reason")).toBeNull();
  });

  test("given the failure, the pane draws the triage view and no raw reason, the stats after it", () => {
    const c = view({ block: FAILED_BLOCK, failure: FAILURE });
    expect(c.querySelector(".fv")).not.toBeNull();
    expect(c.querySelector(".card-reason")).toBeNull();
    const kids = [...c.children].map((el) => el.className.split(" ")[0]);
    expect(kids.indexOf("fv")).toBeLessThan(kids.indexOf("card-stats"));
    expect(kids[0]).toBe("card-hd");
  });
});
