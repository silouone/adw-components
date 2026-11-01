// `<Lanes/>`: the gridded time axis and one row per lane. It draws the `TimelineLayout` it is
// given, reports a click through `onScope` and the pointer through `onHover`, and holds only its
// zoom level.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BUILD_1,
  face,
  facesOf,
  GATES_RED,
  PLAN,
  REVIEW,
  RIG_CLAUDE,
  RIG_CODEX,
  RUN_FACES,
} from "../../../fixtures/HoverCard";
import { boxOf, LABELS, LANES, LAYOUT, SETUP_BOX } from "../../../fixtures/Lanes";
import type { HoverAt, RunStepView, StepFace } from "../HoverCard/HoverCard";
import { type DrawnBox, type LaneRowView, Lanes, type LanesProps } from "./Lanes";

afterEach(cleanup);

const noop = () => {};

/** The committed run, drawn; override what a case is about. */
const mount = (over: Partial<LanesProps> = {}) =>
  render(
    <Lanes
      layout={LAYOUT}
      lanes={LANES}
      faces={RUN_FACES}
      scope={undefined}
      onScope={noop}
      onHover={noop}
      labels={LABELS}
      {...over}
    />,
  );

const stepOf = (
  role: string,
  node: string,
  start: number,
  end?: number,
  over: Partial<RunStepView["block"]> = {},
): RunStepView => ({
  role,
  railKey: `${role}::${node}::${start}`,
  block: {
    node,
    start,
    ...(end !== undefined ? { end } : {}),
    inProgress: end === undefined,
    ...over,
  },
});

const rowOf = (
  role: string,
  steps: readonly RunStepView[],
  over: Partial<LaneRowView> = {},
): LaneRowView => ({
  lane: { role, blocks: steps.map((s) => s.block) },
  hue: 210,
  isWorkspace: role === "workspace",
  label: role === "workspace" ? "code" : role,
  share: 10,
  busy: "1s",
  rigs: [undefined],
  ...over,
});

interface Entry {
  readonly step: RunStepView;
  readonly face?: StepFace;
  readonly render?: DrawnBox["render"];
}

/** A hand-written scene: one box per entry, its face and its rail key. */
const sceneOf = (entries: readonly Entry[], rows: readonly LaneRowView[]): Partial<LanesProps> => {
  const withFace = entries.map((e) => ({
    ...e,
    face: e.face ?? face({ kind: "det", agent: false }),
  }));
  const boxes = withFace.map((e) => boxOf([e.step], e.face.outcome, e.render ?? "box"));
  return {
    layout: { boxes, ticks: [] },
    lanes: {
      lanes: rows,
      railKeys: new Map(boxes.map((b, i) => [b, (withFace[i] as Entry).step.railKey])),
    },
    faces: facesOf(withFace.map((e) => [e.step, e.face])),
  };
};

const hoverMock = () => mock((_at: HoverAt | null) => {});

describe("<Lanes/> — axis", () => {
  test("renders one .ax tick per layout.ticks entry, at its own position/label", () => {
    const { container } = mount();
    const ticks = container.querySelectorAll(".ax");
    expect(ticks).toHaveLength(LAYOUT.ticks.length);
    const tick = LAYOUT.ticks[1];
    expect(tick).toBeDefined();
    expect((ticks[1] as HTMLElement).style.left).toBe(`${tick?.pct.toFixed(3)}%`);
    expect(ticks[1]?.textContent).toBe(tick?.label);
  });
});

describe("<Lanes/> — one row per lane", () => {
  test("the workspace lane gets the ⌘/code label + title", () => {
    const { container } = mount();
    const name = container.querySelector(".ln-name");
    expect(name?.textContent).toContain("⌘");
    expect(name?.textContent).toContain("code");
    expect(container.querySelector(".ln-sub")?.textContent).toBe(LABELS.deterministic);
  });

  test("a named agent lane gets the ◆ glyph and its step's rig as the sub-label", () => {
    const { container } = mount();
    const build = container.querySelectorAll(".ln-id")[2] as HTMLElement;
    expect(build.querySelector(".ln-name")?.textContent).toContain("◆");
    const sub = build.querySelector(".ln-sub")?.textContent ?? "";
    expect(sub).toContain("codex");
    expect(sub).toContain("gpt-6-sol");
    expect(sub).toContain("high");
    expect(sub).toContain("G1");
  });

  test("a lane that ran two rigs shows one compact chip per rig", () => {
    const step = stepOf("review-spec", "review-spec", 0, 500);
    const { container } = mount(
      sceneOf(
        [{ step }],
        [rowOf("review-spec", [step], { rigs: [RIG_CODEX, { ...RIG_CLAUDE, gear: "G2" }] })],
      ),
    );
    const chips = container.querySelectorAll(".ln-sub .rig.compact");
    expect(chips).toHaveLength(2);
    expect(chips[0]?.textContent).toContain("G1");
    expect(chips[1]?.textContent).toContain("G2");
  });

  test("an agent lane whose step journaled no rig says so, never a model guess", () => {
    const step = stepOf("build", "build", 0, 1_000);
    const { container } = mount(sceneOf([{ step }], [rowOf("build", [step])]));
    expect(container.querySelector(".ln-sub")?.textContent).toContain(LABELS.rigNotJournaled);
  });
});

describe("<Lanes/> — the gear chip", () => {
  test("a lane whose step ran on a gear shows it as a chip in the rig line", () => {
    const step = stepOf("plan", "plan", 0, 1_000);
    const { container } = mount(
      sceneOf([{ step }], [rowOf("plan", [step], { rigs: [{ ...RIG_CLAUDE, gear: "G3" }] })]),
    );
    expect(container.querySelector(".ln-sub .gear")?.textContent).toBe("G3");
  });

  test("a lane with no gear renders no chip", () => {
    const { gear: _gear, ...noGear } = RIG_CLAUDE;
    const a = stepOf("workspace", "provision", 0, 500);
    const b = stepOf("build", "build", 500, 1_000);
    const { container } = mount(
      sceneOf(
        [{ step: a }, { step: b }],
        [rowOf("workspace", [a]), rowOf("build", [b], { rigs: [noGear] })],
      ),
    );
    expect(container.querySelector(".gear")).toBeNull();
  });
});

describe("<Lanes/> — the three block kinds are visually distinct", () => {
  test("agent block carries the k-agent class", () => {
    const { container } = mount();
    expect(container.querySelector(".nd.k-agent")).not.toBeNull();
  });

  test("gate block carries the k-gate class, split into one segment per gate", () => {
    const { container } = mount();
    const gate = container.querySelector(".nd.k-gate");
    expect(gate).not.toBeNull();
    const segs = gate?.querySelectorAll(".gseg");
    expect(segs).toHaveLength(3);
    expect(segs?.[0]?.className).toContain("pass");
    expect(segs?.[1]?.className).toContain("fail");
  });

  test("a box carries no inline purpose line or gate strip — the hover card owns detail", () => {
    const step = stepOf("workspace", "provision", 0, 1_000);
    const { container } = mount(sceneOf([{ step }], [rowOf("workspace", [step])]));
    expect(container.querySelector(".nd.k-det")).not.toBeNull();
    expect(container.querySelector(".nd-why")).toBeNull();
    expect(container.querySelector(".gstrip")).toBeNull();
    expect(container.querySelector(".ticks")).toBeNull();
    expect(container.querySelector(".cap-none")).toBeNull();
  });

  test("a skipped gate's segment carries the skipped class", () => {
    const { container } = mount();
    const segs = container.querySelectorAll(".gseg");
    expect(segs[2]?.className).toContain("skipped");
    expect(segs[0]?.className).not.toContain("skipped");
  });
});

describe("<Lanes/> — markers vs boxes", () => {
  const longName = "a-very-long-deterministic-node-name";

  test("a sub-threshold node renders as a marker, name absent from text but present on hover", () => {
    const tiny = stepOf("workspace", longName, 0, 400);
    const anchor = stepOf("workspace", "anchor", 400, 400_000);
    const onHover = hoverMock();
    const { container } = mount({
      ...sceneOf(
        [{ step: tiny, render: "marker" }, { step: anchor }],
        [rowOf("workspace", [tiny, anchor])],
      ),
      onHover,
    });
    const marker = container.querySelector(".nd-marker") as HTMLElement;
    expect(marker).not.toBeNull();
    expect(marker.textContent).not.toContain(longName);
    fireEvent.mouseEnter(marker);
    expect(onHover.mock.calls[0]?.[0]?.members.map((m) => m.block.node)).toContain(longName);
  });

  test("a block spanning the whole view renders the full box, never a marker", () => {
    const step = stepOf("workspace", "provision", 0, 1_000);
    const { container } = mount(sceneOf([{ step }], [rowOf("workspace", [step])]));
    expect(container.querySelector(".nd-marker")).toBeNull();
    expect(container.querySelector(".nd")?.textContent).toContain("provision");
  });
});

describe("<Lanes/> — click-to-select", () => {
  test("clicking a drawn box reports its rail key through onScope", () => {
    const onScope = mock((_scope: string) => {});
    const { container } = mount({ onScope });
    const box = container.querySelector(".nd") as HTMLElement;
    fireEvent.click(box);
    expect(onScope).toHaveBeenCalledTimes(1);
    expect(onScope.mock.calls[0]?.[0]).toBe(box.getAttribute("data-rail") as string);
  });

  test("the box matching the scope carries .sel; others don't", () => {
    const { container } = mount({ scope: PLAN.railKey });
    const boxes = [...container.querySelectorAll(".nd")];
    expect(boxes.length).toBeGreaterThan(1);
    const selected = boxes.filter((b) => b.className.includes("sel"));
    expect(selected).toHaveLength(1);
    expect(selected[0]?.getAttribute("data-rail")).toBe(PLAN.railKey);
  });
});

describe("<Lanes/> — degenerate/empty input", () => {
  test("an empty view (no lanes at all) renders no .ln rows and does not crash", () => {
    const { container } = mount({
      layout: { boxes: [], ticks: [] },
      lanes: { lanes: [], railKeys: new Map() },
    });
    expect(container.querySelectorAll(".ln")).toHaveLength(0);
  });
});

describe("<Lanes/> — clustered markers", () => {
  test("a clustered marker's hover names both members, and leaving reports null", () => {
    expect(SETUP_BOX.render).toBe("marker");
    expect(SETUP_BOX.members).toHaveLength(2);
    const onHover = hoverMock();
    const { container } = mount({ onHover });
    const marker = container.querySelector(".nd-marker") as HTMLElement;
    expect(marker).not.toBeNull();
    fireEvent.mouseEnter(marker);
    expect(onHover.mock.calls[0]?.[0]?.members.map((m) => m.block.node)).toEqual([
      "provision",
      "dispatch",
    ]);
    fireEvent.mouseLeave(marker);
    expect(onHover.mock.calls[1]?.[0]).toBeNull();
  });

  test("clicking a clustered marker reports the rail key of its box", () => {
    const onScope = mock((_scope: string) => {});
    const { container } = mount({ onScope });
    fireEvent.click(container.querySelector(".nd-marker") as HTMLElement);
    expect(onScope.mock.calls[0]?.[0]).toBe("workspace::provision");
  });
});

describe("<Lanes/> — outcome-driven classes on a box", () => {
  test("a failed block carries the .bad outcome class", () => {
    const { container } = mount();
    expect(container.querySelector(".nd.bad")?.getAttribute("data-rail")).toBe(GATES_RED.railKey);
  });

  test("a live (in-progress) block carries the .live outcome class", () => {
    const { container } = mount();
    expect(container.querySelector(".nd.live")?.getAttribute("data-rail")).toBe(REVIEW.railKey);
  });
});

describe("<Lanes/> — the workspace lane's caveat title attribute", () => {
  test("the caveat text is the REAL title attribute, not just visible text", () => {
    const { container } = mount();
    const title = container.querySelector(".ln-name")?.getAttribute("title");
    expect(title).toBe(LANES.lanes[0]?.caveat as string);
  });

  test("a named agent lane with no caveat carries no title attribute at all", () => {
    const { container } = mount();
    const build = container.querySelectorAll(".ln-id")[2] as HTMLElement;
    expect(build.querySelector(".ln-name")?.hasAttribute("title")).toBe(false);
  });
});

describe("<Lanes/> — chart container", () => {
  const scale = (container: Element) =>
    (container.querySelector(".chart-inner") as HTMLElement).style.getPropertyValue(
      "--adw-lanes-scale",
    );

  test("exactly one .chart-scroll, holding the axis, the grid overlay and every .ln-track; .ln-id lives outside it", () => {
    const { container } = mount();
    expect(container.querySelectorAll(".chart-scroll")).toHaveLength(1);
    expect(container.querySelector(".chart-scroll .axis")).not.toBeNull();
    expect(container.querySelector(".chart-scroll .grid-overlay")).not.toBeNull();

    const allTracks = container.querySelectorAll(".ln-track");
    expect(allTracks.length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".chart-scroll .ln-track").length).toBe(allTracks.length);

    expect(container.querySelectorAll(".chart-scroll .ln-id")).toHaveLength(0);
    expect(container.querySelectorAll(".ln-id").length).toBeGreaterThan(0);
  });

  test("--adw-lanes-scale defaults to 1 on first render", () => {
    const { container } = mount();
    expect(scale(container)).toBe("1");
    expect(
      (container.querySelector(".chart-inner") as HTMLElement).style.getPropertyValue("--zoom"),
    ).toBe("");
  });

  test("the zoom control offers fit/2x/4x, fit active by default", () => {
    const { container } = mount();
    expect(container.querySelectorAll(".zoom-ctl .chip")).toHaveLength(3);
    expect(container.querySelector('[data-zoom="fit"]')?.className).toContain(" on");
    expect(container.querySelector('[data-zoom="2"]')?.className).not.toContain(" on");
    expect(container.querySelector('[data-zoom="4"]')?.className).not.toContain(" on");
  });

  test("clicking 2x sets the scale to 2 and moves the active chip", () => {
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-zoom="2"]') as HTMLElement);
    expect(scale(container)).toBe("2");
    expect(container.querySelector('[data-zoom="2"]')?.className).toContain(" on");
    expect(container.querySelector('[data-zoom="fit"]')?.className).not.toContain(" on");
  });

  test("clicking 4x sets the scale to 4", () => {
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-zoom="4"]') as HTMLElement);
    expect(scale(container)).toBe("4");
  });

  test("a full zoom cycle (fit→2→4→fit) always leaves exactly one chip active, never two or zero", () => {
    const { container } = mount();
    const chipOn = (z: string) =>
      container.querySelector(`[data-zoom="${z}"]`)?.className.includes(" on");
    for (const z of ["2", "4", "fit"]) {
      fireEvent.click(container.querySelector(`[data-zoom="${z}"]`) as HTMLElement);
      expect(["fit", "2", "4"].filter(chipOn)).toHaveLength(1);
      expect(chipOn(z)).toBe(true);
    }
  });

  test("a lane's .ln-id --hue matches its own .ln --hue, for every lane", () => {
    const { container } = mount();
    const ids = container.querySelectorAll(".chart-ids .ln-id");
    const tracks = container.querySelectorAll(".chart-scroll .ln");
    expect(ids).toHaveLength(LANES.lanes.length);
    expect(tracks).toHaveLength(LANES.lanes.length);
    LANES.lanes.forEach((row, i) => {
      const idHue = (ids[i] as HTMLElement).style.getPropertyValue("--hue");
      expect(idHue).toBe((tracks[i] as HTMLElement).style.getPropertyValue("--hue"));
      expect(idHue).toBe(String(row.hue));
    });
  });

  test("zoom state survives a re-render with new props (a live tick never unmounts <Lanes/>)", () => {
    const { container, rerender } = mount();
    fireEvent.click(container.querySelector('[data-zoom="2"]') as HTMLElement);
    expect(scale(container)).toBe("2");

    rerender(
      <Lanes
        layout={LAYOUT}
        lanes={LANES}
        faces={RUN_FACES}
        scope={BUILD_1.railKey}
        onScope={noop}
        onHover={noop}
        labels={LABELS}
      />,
    );

    expect(scale(container)).toBe("2");
    expect(container.querySelector('[data-zoom="2"]')?.className).toContain(" on");
  });

  test("scrollLeft survives a re-render with new props (native DOM state, element never recreated)", () => {
    const { container, rerender } = mount();
    (container.querySelector(".chart-scroll") as HTMLElement).scrollLeft = 137;

    rerender(
      <Lanes
        layout={LAYOUT}
        lanes={LANES}
        faces={RUN_FACES}
        scope={BUILD_1.railKey}
        onScope={noop}
        onHover={noop}
        labels={LABELS}
      />,
    );

    expect((container.querySelector(".chart-scroll") as HTMLElement).scrollLeft).toBe(137);
  });

  test("click-to-select still routes through data-rail after zooming to 2x", () => {
    const onScope = mock((_scope: string) => {});
    const { container } = mount({ onScope });
    fireEvent.click(container.querySelector('[data-zoom="2"]') as HTMLElement);

    const second = container.querySelectorAll(".nd")[1] as HTMLElement;
    fireEvent.click(second);
    expect(onScope.mock.calls[0]?.[0]).toBe(second.getAttribute("data-rail") as string);
  });

  test("empty view (no lanes) still renders the chart shell — scroller, inner, and the zoom control in the fixed head", () => {
    const { container } = mount({
      layout: { boxes: [], ticks: [] },
      lanes: { lanes: [], railKeys: new Map() },
    });
    expect(container.querySelectorAll(".chart-scroll")).toHaveLength(1);
    expect(container.querySelector(".chart-inner")).not.toBeNull();
    expect(container.querySelector(".chart-ids-head .zoom-ctl")).not.toBeNull();
    expect(container.querySelectorAll(".zoom-ctl .chip")).toHaveLength(3);
    expect(container.querySelectorAll(".ln-id")).toHaveLength(0);
  });
});

describe("<Lanes/> — a hand-built box with no members", () => {
  test("a DrawnBox with an empty members array is silently excluded (no role to key it by), not a crash", () => {
    const { container } = mount({
      layout: {
        boxes: [{ label: "", outcomeClass: "ok", render: "box", left: 0, width: 10, members: [] }],
        ticks: [],
      },
      lanes: { lanes: [rowOf("workspace", [])], railKeys: new Map() },
    });
    expect(container.querySelector(".ln-track")?.children).toHaveLength(0);
  });
});

// A running `gates` node declares no results yet, so it paints as k-det AND live.

describe("<Lanes/> — a running deterministic block keeps a visible body", () => {
  test("a running gates block renders as .nd.k-det.live", () => {
    const step = stepOf("workspace", "gates", 0);
    const { container } = mount(
      sceneOf(
        [{ step, face: face({ kind: "det", agent: false, outcome: "live", glyph: "◌" }) }],
        [rowOf("workspace", [step])],
      ),
    );
    expect(container.querySelector(".nd.k-det.live")).not.toBeNull();
  });
});

describe("<Lanes/> — a remote slot wait", () => {
  const gates = (over: Partial<RunStepView["block"]> = {}) =>
    stepOf("workspace", "gates", 0, 1_000, over);
  const draw = (steps: readonly RunStepView[]) =>
    mount(
      sceneOf(
        steps.map((step) => ({ step })),
        [rowOf("workspace", steps)],
      ),
    );

  test("a gates block with queuedOn renders .nd-queued 'queued: m1max'", () => {
    const { container } = draw([gates({ queuedOn: "m1max" })]);
    expect(container.querySelector(".nd-queued")?.textContent).toBe("queued: m1max");
  });

  test("a block without queuedOn renders no .nd-queued", () => {
    const { container } = draw([gates()]);
    expect(container.querySelector(".nd-queued")).toBeNull();
  });

  test("only the block that queued renders .nd-queued", () => {
    const { container } = draw([
      gates({ queuedOn: "m1max" }),
      stepOf("workspace", "baseline", 1_000, 1_500),
    ]);
    expect(container.querySelectorAll(".nd-queued")).toHaveLength(1);
  });

  test("a queuedOn host with markup is rendered as text", () => {
    const { container } = draw([gates({ queuedOn: "<i>x</i>" })]);
    expect(container.querySelector(".nd-queued i")).toBeNull();
    expect(container.querySelector(".nd-queued")?.textContent).toBe("queued: <i>x</i>");
  });
});

describe("<Lanes/> — page state as modifier classes", () => {
  test.each([
    ["stale", "chart-stale"],
    ["docked", "chart-docked"],
    ["grow", "chart-grow"],
  ] as const)("%s renders %s and omits it when off", (prop, cls) => {
    const chart = (over: Partial<LanesProps>) =>
      mount(over).container.querySelector(".chart") as HTMLElement;
    expect(chart({ [prop]: true }).classList.contains(cls)).toBe(true);
    expect(chart({ [prop]: false }).classList.contains(cls)).toBe(false);
    expect(chart({}).classList.contains(cls)).toBe(false);
  });

  test("the live marker carries nd-mk beside mk", () => {
    const tiny = stepOf("workspace", "tiny-live", 399_900);
    const anchor = stepOf("workspace", "anchor", 0, 399_900);
    const { container } = mount(
      sceneOf(
        [
          {
            step: tiny,
            render: "marker",
            face: face({ kind: "det", agent: false, outcome: "live" }),
          },
          { step: anchor },
        ],
        [rowOf("workspace", [tiny, anchor])],
      ),
    );
    expect(container.querySelector(".nd-marker .mk.live")?.classList.contains("nd-mk")).toBe(true);
  });
});

describe("<Lanes/> — the owner marker", () => {
  test("the zoom chips carry zoom-chip", () => {
    const { container } = mount();
    const chips = [...container.querySelectorAll(".zoom-ctl .chip")];
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((c) => c.classList.contains("zoom-chip"))).toBe(true);
  });
});

// A journaled open-pr has no usage: it reads as deterministic, never as an unjournaled rig.

describe("<Lanes/> — a deterministic open-pr lane", () => {
  test("never reads as an agent step whose rig was not journaled", () => {
    const step = stepOf("workspace", "open-pr", 0, 1_000);
    const { container } = mount(sceneOf([{ step }], [rowOf("workspace", [step])]));
    expect(container.querySelector(".ln-sub")?.textContent).toBe(LABELS.deterministic);
    expect(container.textContent).not.toContain(LABELS.rigNotJournaled);
  });
});
