// `<FiltersPanel/>` and `<FiltersChip/>`: the board's filter surface. Every gesture is one
// `onChange(name, value)`; the counts and labels come from the view.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  FILTERS_LABELS,
  FILTERS_OFF,
  FILTERS_VIEW,
  FILTERS_VIEW_EMPTY,
  FILTERS_VIEW_ONE_HOST,
} from "../../../fixtures/FiltersPanel";
import type { DropdownChange } from "../../molecules/Dropdown/Dropdown";
import { type FilterName, FiltersChip, FiltersPanel, type FiltersPanelProps } from "./FiltersPanel";

afterEach(cleanup);

const draw = (over: Partial<FiltersPanelProps> = {}) => {
  const changes: [FilterName, unknown][] = [];
  const windows: [string, boolean][] = [];
  const props: FiltersPanelProps = {
    view: FILTERS_VIEW,
    labels: FILTERS_LABELS,
    filters: FILTERS_OFF,
    onChange: (name, value) => {
      changes.push([name, value]);
    },
    onWindow: (days, pinned) => {
      windows.push([days, pinned]);
    },
    ...over,
  };
  const { container } = render(<FiltersPanel {...props} />);
  const one = (sel: string) => container.querySelector(sel) as HTMLElement;
  return { container, changes, windows, one };
};

const texts = (c: Element, sel: string) => [...c.querySelectorAll(sel)].map((n) => n.textContent);

describe("<FiltersPanel/> — every section renders with counts", () => {
  test("project: 'all' plus one chip per project with its card count", () => {
    const { container } = draw();
    expect(texts(container, "[data-proj]")).toEqual([
      "all7",
      "sabado4",
      "adw-factory2",
      "old-app1",
    ]);
  });

  test("health ×4 with the visible tally", () => {
    const { container } = draw();
    expect(texts(container, "[data-health], [data-live]")).toEqual([
      "green3",
      "blocked2",
      "no run-end1",
      "live1",
    ]);
  });

  test("lane ×3, built by ×2, isolation ×3, each with its count", () => {
    const { container } = draw();
    expect(texts(container, "[data-lane]")).toEqual(["feat4", "bug2", "chore1"]);
    expect(texts(container, "[data-provider]")).toEqual(["claude5", "codex2"]);
    expect(texts(container, "[data-isolation]")).toEqual(["worktree5", "container1", "remote1"]);
  });

  test("the row labels are the labels prop", () => {
    const { container } = draw();
    expect(texts(container, ".fp-l")).toEqual([
      "project",
      "health",
      "lane",
      "built by",
      "isolation",
      "gate host",
      "window",
      "search",
    ]);
  });

  test("window chips and a search input are there; the gate host row needs a host", () => {
    const { container, one } = draw();
    expect(texts(container, "[data-days]")).toEqual(["2H", "1D", "7D", "ALL"]);
    expect(one("[data-q]").getAttribute("placeholder")).toBe("ticket id");
    expect(one("[data-q]").getAttribute("aria-label")).toBe("Search ticket ids");
    expect(container.querySelectorAll("[data-host]")).toHaveLength(2);
    const bare = draw({ view: FILTERS_VIEW_ONE_HOST });
    expect(bare.container.querySelectorAll("[data-host]")).toHaveLength(0);
    expect(texts(bare.container, ".fp-l")).not.toContain("gate host");
  });

  test("every chip is a plain button", () => {
    const { container } = draw();
    const chips = [...container.querySelectorAll(".fp-chip")];
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip.tagName).toBe("BUTTON");
      expect(chip.getAttribute("type")).toBe("button");
    }
  });
});

describe("<FiltersPanel/> — toggling narrows, and reports it", () => {
  test("a lane and a provider click report the list they would produce", () => {
    const { changes, one } = draw();
    fireEvent.click(one('[data-lane="bug"]'));
    fireEvent.click(one('[data-provider="codex"]'));
    expect(changes).toEqual([
      ["lanes", ["bug"]],
      ["providers", ["codex"]],
    ]);
  });

  test("lane is multi-select: a second lane is added, a repeated one removed", () => {
    const filters = { ...FILTERS_OFF, lanes: ["bug" as const] };
    const { changes, one } = draw({ filters });
    fireEvent.click(one('[data-lane="feat"]'));
    fireEvent.click(one('[data-lane="bug"]'));
    expect(changes).toEqual([
      ["lanes", ["bug", "feat"]],
      ["lanes", []],
    ]);
  });

  test("the active chips are marked .on, the others are not", () => {
    const filters = { ...FILTERS_OFF, lanes: ["bug" as const], isolations: ["remote" as const] };
    const { one } = draw({ filters });
    expect(one('[data-lane="bug"]').classList.contains("on")).toBe(true);
    expect(one('[data-lane="feat"]').classList.contains("on")).toBe(false);
    expect(one('[data-isolation="remote"]').classList.contains("on")).toBe(true);
  });

  test("isolation toggles", () => {
    const { changes, one } = draw();
    fireEvent.click(one('[data-isolation="container"]'));
    expect(changes).toEqual([["isolations", ["container"]]]);
  });

  test("typing in the search box reports q", () => {
    const { changes, one } = draw();
    fireEvent.input(one("[data-q]"), { target: { value: "sabado-2" } });
    expect(changes).toEqual([["q", "sabado-2"]]);
  });

  test("the search box shows the q it is given", () => {
    const { one } = draw({ filters: { ...FILTERS_OFF, q: "strip" } });
    expect((one("[data-q]") as HTMLInputElement).value).toBe("strip");
  });
});

describe("<FiltersPanel/> — the existing filters keep their semantics", () => {
  test("project is single-select; 'all' resets", () => {
    const { changes, one } = draw({ filters: { ...FILTERS_OFF, proj: "sabado" } });
    expect(one('[data-proj="sabado"]').classList.contains("on")).toBe(true);
    expect(one('[data-proj="*"]').classList.contains("on")).toBe(false);
    fireEvent.click(one('[data-proj="adw-factory"]'));
    fireEvent.click(one('[data-proj="*"]'));
    expect(changes).toEqual([
      ["proj", "adw-factory"],
      ["proj", "*"],
    ]);
  });

  test("a health chip flips only its own key", () => {
    const { changes, one } = draw();
    fireEvent.click(one('[data-health="blocked"]'));
    expect(changes).toEqual([["health", { green: true, blocked: false, unfinished: true }]]);
  });

  test("live is a separate flag on top", () => {
    const { changes, one } = draw();
    fireEvent.click(one("[data-live]"));
    expect(changes).toEqual([["liveOnly", true]]);
    cleanup();
    const on = draw({ filters: { ...FILTERS_OFF, liveOnly: true } });
    fireEvent.click(on.one("[data-live]"));
    expect(on.changes).toEqual([["liveOnly", false]]);
  });

  test("a gate host click filters, a second click on the active one clears", () => {
    const { changes, one } = draw();
    fireEvent.click(one('[data-host="local"]'));
    expect(changes).toEqual([["host", "local"]]);
    cleanup();
    const active = draw({ filters: { ...FILTERS_OFF, host: "local" } });
    fireEvent.click(active.one('[data-host="local"]'));
    expect(active.changes).toEqual([["host", "*"]]);
  });

  test("a project that left the board is dimmed by .opt-legacy", () => {
    const { one } = draw();
    expect(one('[data-proj="old-app"]').classList.contains("opt-legacy")).toBe(true);
    expect(one('[data-proj="sabado"]').classList.contains("opt-legacy")).toBe(false);
  });

  test("a window chip click reports the window as a pinned pick", () => {
    const { windows, one } = draw();
    expect(one('[data-days="all"]').classList.contains("on")).toBe(true);
    fireEvent.click(one('[data-days="1d"]'));
    expect(windows).toEqual([["1d", true]]);
  });
});

describe("<FiltersPanel/> — degenerate and edge inputs", () => {
  test("no board data yet: every section renders with zero counts and nothing throws", () => {
    const { container } = draw({ view: FILTERS_VIEW_EMPTY });
    expect(texts(container, "[data-proj]")).toEqual(["all0"]);
    expect(texts(container, "[data-health], [data-live]")).toEqual([
      "green0",
      "blocked0",
      "no run-end0",
      "live0",
    ]);
    expect(texts(container, "[data-lane]")).toEqual(["feat0", "bug0", "chore0"]);
    expect(container.querySelectorAll("[data-host]")).toHaveLength(0);
  });
});

describe("<FiltersChip/> — the top bar's chip", () => {
  const drawChip = (open: boolean) => {
    const seen: DropdownChange[] = [];
    const { container } = render(
      <FiltersChip
        view={FILTERS_VIEW}
        labels={FILTERS_LABELS}
        filters={FILTERS_OFF}
        onChange={() => {}}
        onWindow={() => {}}
        open={open}
        pinned={false}
        onOpenChange={(change) => seen.push(change)}
      />,
    );
    return { container, seen };
  };

  test("the chip face is the view's label, whole in its title", () => {
    const { container } = drawChip(false);
    const face = container.querySelector(".dd-chip b");
    expect(face?.textContent).toBe("filters all");
    expect(face?.getAttribute("title")).toBe("filters all");
  });

  test("the panel is hidden while closed and shown while open", () => {
    expect((drawChip(false).container.querySelector(".dd-panel") as HTMLElement).hidden).toBe(true);
    cleanup();
    const open = drawChip(true).container;
    expect((open.querySelector(".dd-panel") as HTMLElement).hidden).toBe(false);
    expect(open.querySelector(".dd-panel .fp")).not.toBeNull();
  });

  test("a chip click asks the page to toggle the filters dropdown", () => {
    const { container, seen } = drawChip(false);
    expect(container.querySelector("[data-dd]")?.getAttribute("data-dd")).toBe("filters");
    fireEvent.click(container.querySelector(".dd-chip") as Element);
    expect(seen).toEqual(["toggle"]);
  });
});
