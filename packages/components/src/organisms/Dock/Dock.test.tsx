import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { BLOCKED, FAILURE_BANNER, GREEN, LABELS, SUMMARY } from "../../../fixtures/Dock";
import { Dock, type DockProps } from "./Dock";

// the dock's state (seeding the scope from the failure, the signals that held it) and about
// building the view are projection-only and are not copied; this file proves what the dock draws
// from its props and what it reports through its callbacks.

afterEach(cleanup);

const handlers = () => ({
  onScope: mock((_scope: string) => {}),
  onClose: mock(() => {}),
  onShutDock: mock(() => {}),
  onFullScreen: mock(() => {}),
  onMarkdownToggle: mock(() => {}),
});

const view = (props: Partial<DockProps> = {}) => {
  const h = handlers();
  const utils = render(
    <Dock
      failure={FAILURE_BANNER}
      view={BLOCKED}
      summary={SUMMARY}
      scope="run"
      shut={false}
      full={false}
      md={false}
      labels={LABELS}
      {...h}
      {...props}
    />,
  );
  return { ...utils, ...h };
};

const rail = (c: Element) => [...c.querySelectorAll(".rp-step")];

describe("<Dock/> — the rail", () => {
  test("the overview button carries .on when the scope is 'run'", () => {
    const { container } = view();
    expect(container.querySelector('[data-rail="run"]')?.className).toContain("on");
  });

  test("renders 1 + rail.length buttons, in the rail's own order, classed by outcome", () => {
    const steps = rail(view().container);
    expect(steps.map((s) => s.getAttribute("data-rail"))).toEqual(["run", "build::1", "gates::1"]);
    expect(steps.map((s) => s.querySelector("b")?.textContent)).toEqual([
      "overview",
      "build",
      "gates",
    ]);
    expect(steps[2]?.className).toContain("bad");
    expect(steps[1]?.querySelector("span")?.textContent).toBe("1m 05s");
  });

  test("clicking a rail button reports its key; the scope prop highlights it", () => {
    const { container, onScope } = view();
    fireEvent.click(container.querySelector('[data-rail="build::1"]') as Element);
    expect(onScope).toHaveBeenCalledWith("build::1");
    cleanup();
    const stepped = view({ scope: "build::1" }).container;
    expect(stepped.querySelector('[data-rail="build::1"]')?.className).toContain("on");
    expect(stepped.querySelector('[data-rail="run"]')?.className).not.toContain("on");
  });
});

describe("<Dock/> — closing the dock", () => {
  test("a scope of undefined empties the pane but keeps the rail fully rendered", () => {
    const { container } = view({ scope: undefined });
    expect(container.querySelector("#rp-pane")?.children).toHaveLength(0);
    expect(rail(container)).toHaveLength(3);
  });

  test("the close button reports onClose", () => {
    const { container, onClose } = view();
    fireEvent.click(container.querySelector(".rp-x") as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("a scope matching no rail entry draws no section, no crash, the rail still renders", () => {
    const { container } = view({ scope: "gone::9" });
    expect(container.querySelector("#rp-pane")?.children).toHaveLength(0);
    expect(rail(container)).toHaveLength(3);
  });
});

describe("<Dock/> — breadcrumb navigation", () => {
  test("viewing a step shows 'run ▸ <label>', and clicking 'run' reports the run scope", () => {
    const { container, onScope } = view({ scope: "build::1" });
    const crumb = container.querySelector("#rp-crumb");
    expect(crumb?.textContent).toBe("run ▸ build");
    fireEvent.click(crumb?.querySelector("a") as Element);
    expect(onScope).toHaveBeenCalledWith("run");
  });

  test("the overview crumb is the bare word, with no link", () => {
    const crumb = view().container.querySelector("#rp-crumb");
    expect(crumb?.textContent).toBe("run");
    expect(crumb?.querySelector("a")).toBeNull();
  });
});

describe("<Dock/> — a box's step section", () => {
  test("a box renders one <Drawer/> per member, in order", () => {
    const { container } = view({ scope: "build::1" });
    expect(container.querySelectorAll(".card-hd")).toHaveLength(1);
    expect(container.querySelector(".card-hd b")?.textContent).toBe("build");
    expect(container.querySelector(".drawer-prompt")?.textContent).toContain("Write the change.");
  });

  test("a box with several members draws them in the entry's order", () => {
    const [first, second] = BLOCKED.rail;
    const two = {
      ...BLOCKED,
      rail: first && second ? [{ ...first, drawers: [...first.drawers, ...second.drawers] }] : [],
    };
    const { container } = view({ view: two, scope: "build::1" });
    expect([...container.querySelectorAll(".card-hd b")].map((b) => b.textContent)).toEqual([
      "build",
      "gates",
    ]);
  });

  test("only the failing node's drawer draws the triage view", () => {
    expect(view({ scope: "gates::1" }).container.querySelector(".fv")).not.toBeNull();
    expect(view({ scope: "build::1" }).container.querySelector(".fv")).toBeNull();
  });
});

describe("<Dock/> — the run-scope section", () => {
  test("the overview draws both raw panes; md draws rendered markdown", () => {
    expect(view().container.querySelectorAll(".rp-pre")).toHaveLength(2);
    const md = view({ md: true }).container;
    expect(md.querySelectorAll(".rp-md")).toHaveLength(2);
    expect(md.querySelector(".rp-pre")).toBeNull();
  });

  test("the md toggle reports, and its label and class follow the prop", () => {
    const { container, onMarkdownToggle } = view();
    const toggle = container.querySelectorAll(".rp-t")[1] as Element;
    expect(toggle.textContent).toBe("md");
    fireEvent.click(toggle);
    expect(onMarkdownToggle).toHaveBeenCalledTimes(1);
    cleanup();
    const on = view({ md: true }).container.querySelectorAll(".rp-t")[1];
    expect(on?.textContent).toBe("raw");
    expect(on?.className).toContain("on");
  });
});

describe("<Dock/> — the full-screen toggle", () => {
  test("reports, and its glyph, class and title follow the prop", () => {
    const { container, onFullScreen } = view();
    const button = container.querySelectorAll(".rp-t")[0] as Element;
    expect(button.textContent).toBe("⤢");
    expect(button.getAttribute("title")).toBe(LABELS.fullScreen);
    fireEvent.click(button);
    expect(onFullScreen).toHaveBeenCalledTimes(1);
    cleanup();
    const full = view({ full: true }).container.querySelectorAll(".rp-t")[0];
    expect(full?.textContent).toBe("⤡");
    expect(full?.className).toContain("on");
    expect(full?.getAttribute("title")).toBe(LABELS.restoreGantt);
  });
});

describe("<Dock/> — the overview banner of a blocked run", () => {
  test("leads with a banner that opens the failing node", () => {
    const { container, onScope } = view();
    const banner = container.querySelector(".dock-banner");
    expect(banner?.textContent).toBe(
      "✕ blocked at gates — 2 tests failed · gate test-frontend" + "open ▸",
    );
    fireEvent.click(banner as Element);
    expect(onScope).toHaveBeenCalledWith("gates::1");
  });

  test("a failing node with no box draws the banner as plain text, with nothing to open", () => {
    const { failureScope: _omitted, ...noBox } = BLOCKED;
    const banner = view({ view: noBox }).container.querySelector(".dock-banner");
    expect(banner?.tagName).toBe("DIV");
  });

  test("the banner omits the gate clause when no gate is known", () => {
    const text = view({ failure: { headline: "2 tests failed" } }).container.querySelector(
      ".dock-banner",
    )?.textContent;
    expect(text).not.toContain("· gate");
  });

  test("a green run, or one with no failure given, draws no banner", () => {
    expect(view({ view: GREEN }).container.querySelector(".dock-banner")).toBeNull();
    expect(view({ failure: undefined }).container.querySelector(".dock-banner")).toBeNull();
  });

  test("the banner is only on the overview, not in a step's pane", () => {
    expect(view({ scope: "gates::1" }).container.querySelector(".dock-banner")).toBeNull();
  });
});

describe("<Dock/> — the header bar toggles the strip", () => {
  test("a click on the bar outside any control reports onShutDock", () => {
    const { container, onShutDock } = view();
    fireEvent.click(container.querySelector(".rp-kpis") as Element);
    expect(onShutDock).toHaveBeenCalledTimes(1);
  });

  test("the crumb link, the tools and a rail button never toggle", () => {
    const { container, onShutDock } = view({ scope: "build::1" });
    fireEvent.click(container.querySelector("#rp-crumb a") as Element);
    for (const tool of container.querySelectorAll(".rp-t")) fireEvent.click(tool);
    fireEvent.click(container.querySelector(".rp-step") as Element);
    expect(onShutDock).not.toHaveBeenCalled();
  });

  test("the chevron follows the state, and a shut dock draws the strip line and no rail", () => {
    expect(view().container.querySelector(".chev")?.textContent).toBe("▾");
    const shut = view({ shut: true }).container;
    expect(shut.querySelector(".chev")?.textContent).toBe("▸");
    expect(shut.querySelector(".rp-fail")?.textContent).toBe(BLOCKED.stripLine);
    expect(shut.querySelector(".rp")?.className).toContain("shut");
    expect(shut.querySelector("#rp-sections")).toBeNull();
  });
});

describe("<Dock/> — the pane survives an update", () => {
  test("a re-render with the same scope keeps the same pane node, and a switch mounts a new one", () => {
    const { container, rerender } = view({ scope: "build::1" });
    const pane = container.querySelector("#rp-pane");
    const h = handlers();
    const props = {
      failure: FAILURE_BANNER,
      view: BLOCKED,
      summary: SUMMARY,
      shut: false,
      full: false,
      md: false,
      labels: LABELS,
      ...h,
    };
    rerender(<Dock {...props} scope="build::1" />);
    expect(container.querySelector("#rp-pane")).toBe(pane);
    rerender(<Dock {...props} scope="gates::1" />);
    expect(container.querySelector("#rp-pane")).not.toBe(pane);
  });
});
