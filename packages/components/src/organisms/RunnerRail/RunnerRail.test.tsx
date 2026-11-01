// `<RunnerRail/>`: rail 1 closed — the strip of runner tiles and the hover popover.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  RUNNER_RAIL,
  RUNNER_RAIL_EMPTY,
  RUNNER_RAIL_HOVERED,
  RUNNER_RAIL_HOVERED_PLANNED,
  RUNNER_RAIL_LABELS,
} from "../../../fixtures/RunnerRail";
import { RunnerRail, type RunnerRailProps } from "./RunnerRail";

afterEach(cleanup);

const draw = (over: Partial<RunnerRailProps> = {}) => {
  const log: string[] = [];
  const filters: [string, unknown][] = [];
  const props: RunnerRailProps = {
    view: RUNNER_RAIL,
    labels: RUNNER_RAIL_LABELS,
    hostFilter: "*",
    expandedRunners: new Set<string>(),
    onHoverRunner: (key) => log.push(`hover:${key}`),
    onFilter: (name, value) => {
      filters.push([name, value]);
    },
    onToggleRail: (open) => log.push(`rail:${open}`),
    onToggleRunner: (key) => log.push(`runner:${key}`),
    ...over,
  };
  const { container } = render(<RunnerRail {...props} />);
  const tile = (key: string) => container.querySelector(`[data-runner="${key}"]`) as HTMLElement;
  return { container, log, filters, tile };
};

describe("<RunnerRail/> — the strip", () => {
  test("a rail1 nav carrying data-rail=host, a ◧ toggle first, then all, then one tile per runner", () => {
    const { container } = draw();
    const nav = container.querySelector("nav.rail.rail1.strip") as HTMLElement;
    expect(nav.getAttribute("data-rail")).toBe("host");
    expect(nav.getAttribute("aria-label")).toBe("runners");
    const kids = [...nav.children].map((c) => c.getAttribute("data-runner") ?? c.className);
    expect(kids).toEqual(["toggle", "*", "local", "ssh:build-1", "e2b"]);
    expect(nav.querySelector(".toggle")?.textContent).toBe("◧");
    expect(nav.querySelector(".toggle")?.getAttribute("title")).toBe("open the network");
  });

  test("the dot is live for a holder, ok when idle, planned when planned", () => {
    const { tile } = draw();
    expect(tile("local").querySelector(".rdot")?.className).toBe("rdot live");
    expect(tile("ssh:build-1").querySelector(".rdot")?.className).toBe("rdot ok");
    expect(tile("e2b").querySelector(".rdot")?.className).toBe("rdot planned");
  });

  test("the planned tile is marked planned and aria-disabled", () => {
    const { tile } = draw();
    expect(tile("e2b").classList.contains("planned")).toBe(true);
    expect(tile("e2b").getAttribute("aria-disabled")).toBe("true");
    expect(tile("local").hasAttribute("aria-disabled")).toBe(false);
  });

  test("each tile shows its glyph", () => {
    const { tile } = draw();
    expect(tile("local").textContent).toBe("⌂");
    expect(tile("ssh:build-1").textContent).toBe("⇄");
    expect(tile("e2b").textContent).toBe("⬡");
  });

  test("the active filter tints its tile, others not; no filter tints the all tile", () => {
    const some = draw({ hostFilter: "local" });
    expect(some.tile("local").classList.contains("on")).toBe(true);
    expect(some.tile("ssh:build-1").classList.contains("on")).toBe(false);
    expect(some.tile("*").classList.contains("on")).toBe(false);
    cleanup();
    const none = draw();
    expect(none.tile("*").classList.contains("on")).toBe(true);
    expect(none.tile("*").textContent).toBe("all");
    expect(none.tile("*").getAttribute("title")).toBe("all runners");
  });

  test("the ◧ toggle opens the tree and clears a showing popover", () => {
    const { container, log } = draw({ view: RUNNER_RAIL_HOVERED });
    fireEvent.click(container.querySelector(".toggle") as Element);
    expect(log).toEqual(["hover:undefined", "rail:true"]);
  });
});

describe("<RunnerRail/> — the popover", () => {
  test("none unless the view carries one", () => {
    expect(draw().container.querySelector(".pop")).toBeNull();
  });

  test("hovering a tile reports it; leaving clears it", () => {
    const { tile, log } = draw();
    fireEvent.mouseEnter(tile("local"));
    fireEvent.mouseLeave(tile("local"));
    expect(log).toEqual(["hover:local", "hover:undefined"]);
  });

  test("local's popover shows the title, status, kind line, five rows and the hint", () => {
    const { container } = draw({ view: RUNNER_RAIL_HOVERED });
    const pop = container.querySelector(".pop") as HTMLElement;
    expect(pop.getAttribute("role")).toBe("tooltip");
    expect(pop.querySelector(".pop-g")?.textContent).toBe("⌂");
    expect(pop.querySelector(".pop-hd b")?.textContent).toBe("local");
    expect(pop.querySelector(".pop-st")?.textContent).toBe("busy");
    expect(pop.querySelector(".pop-kind")?.textContent).toBe("this machine");
    expect(pop.querySelectorAll(".pop-kv div")).toHaveLength(5);
    expect(pop.querySelector(".pop-kv dt")?.textContent).toBe("slots");
    expect(pop.querySelector(".pop-kv dd")?.textContent).toBe("2 of 4 held");
    expect(pop.querySelector(".pop-hint")?.textContent).toBe("click to focus the board on local");
  });

  test("a planned runner's popover says not configured and has no hint", () => {
    const { container } = draw({ view: RUNNER_RAIL_HOVERED_PLANNED });
    expect(container.querySelector(".pop-st")?.textContent).toBe("not configured");
    expect(container.querySelector(".pop-hint")).toBeNull();
  });

  test("the popover's status dot carries pop-rdot", () => {
    const { container } = draw({ view: RUNNER_RAIL_HOVERED });
    expect(container.querySelector(".pop .rdot")?.className).toBe("rdot pop-rdot live");
  });
});

describe("<RunnerRail/> — clicking a tile", () => {
  test("sets the runner filter, opens the panel, expands that runner, clears the popover", () => {
    const { tile, log, filters } = draw();
    fireEvent.click(tile("local"));
    expect(filters).toEqual([["host", "local"]]);
    expect(log).toEqual(["hover:undefined", "rail:true", "runner:local"]);
  });

  test("clicking the active runner clears the filter but still opens the panel", () => {
    const { tile, filters, log } = draw({ hostFilter: "local" });
    fireEvent.click(tile("local"));
    expect(filters).toEqual([["host", "*"]]);
    expect(log).toContain("rail:true");
  });

  test("a click on an already-expanded runner does not fold it", () => {
    const { tile, log } = draw({ expandedRunners: new Set(["local"]) });
    fireEvent.click(tile("local"));
    expect(log).toEqual(["hover:undefined", "rail:true"]);
  });

  test("the all tile resets the filter, clears the popover and leaves the panel closed", () => {
    const { tile, filters, log } = draw({ hostFilter: "local" });
    fireEvent.click(tile("*"));
    expect(filters).toEqual([["host", "*"]]);
    expect(log).toEqual(["hover:undefined"]);
  });

  test("a planned tile is inert: no filter, no open, popover cleared", () => {
    const { tile, filters, log } = draw();
    fireEvent.click(tile("e2b"));
    expect(filters).toEqual([]);
    expect(log).toEqual(["hover:undefined"]);
  });
});

describe("<RunnerRail/> — edges", () => {
  test("an empty rack: the toggle and the all tile only", () => {
    const { container } = draw({ view: RUNNER_RAIL_EMPTY });
    const kids = [...(container.querySelector("nav") as HTMLElement).children];
    expect(kids).toHaveLength(2);
    expect(kids[1]?.getAttribute("data-runner")).toBe("*");
  });
});
