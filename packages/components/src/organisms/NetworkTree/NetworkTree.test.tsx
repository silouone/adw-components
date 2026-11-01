// `<NetworkTree/>`: rail 1 open — runners, projects and live runs as a tree.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { NETWORK, NETWORK_LABELS, NETWORK_TALLY } from "../../../fixtures/NetworkTree";
import { NetworkTree, type NetworkTreeProps } from "./NetworkTree";

afterEach(cleanup);

const draw = (over: Partial<NetworkTreeProps> = {}) => {
  const filters: [string, unknown][] = [];
  const rail: boolean[] = [];
  const runners: string[] = [];
  const projects: string[] = [];
  const opened: string[] = [];
  const props: NetworkTreeProps = {
    net: NETWORK,
    tally: NETWORK_TALLY,
    labels: NETWORK_LABELS,
    hostFilter: "*",
    projFilter: "*",
    selected: null,
    expandedRunners: new Set(["local"]),
    collapsedProjects: new Set<string>(),
    onFilter: (name, value) => {
      filters.push([name, value]);
    },
    onToggleRail: (open) => rail.push(open),
    onToggleRunner: (key) => runners.push(key),
    onToggleProject: (key) => projects.push(key),
    onOpenRun: (id) => opened.push(id),
    ...over,
  };
  const { container } = render(<NetworkTree {...props} />);
  const one = (sel: string) => container.querySelector(sel) as HTMLElement;
  return { container, one, filters, rail, runners, projects, opened };
};

describe("<NetworkTree/> — the frame", () => {
  test("a rail1 aside carrying data-rail=host and the network label", () => {
    const { one } = draw();
    const aside = one("aside.rail.rail1.net");
    expect(aside.getAttribute("data-rail")).toBe("host");
    expect(aside.getAttribute("aria-label")).toBe("network");
  });

  test("the header counts the online runners, the footer the tally", () => {
    const { one } = draw();
    expect(one(".net-hd span").textContent).toBe("⌬ NETWORK · 2 of 3 online");
    expect(one(".net-ft").textContent).toBe("1 live · 1 waiting for a slot · 1 at the agents");
  });

  test("the ◧ toggle asks the page to close the rail", () => {
    const { one, rail } = draw();
    expect(one(".net-hd .toggle").getAttribute("title")).toBe("close");
    fireEvent.click(one(".net-hd .toggle"));
    expect(rail).toEqual([false]);
  });
});

describe("<NetworkTree/> — a runner row", () => {
  test("glyph, label, kind, runs and held/total with its title", () => {
    const { one } = draw();
    const row = one('[data-runner="local"]');
    expect(row.querySelector(".g")?.textContent).toBe("⌂");
    expect(row.querySelector(".nm")?.textContent).toBe("local");
    expect(row.querySelector(".ktag")?.textContent).toBe("local");
    expect(row.querySelector(".nruns")?.textContent).toBe("3 runs");
    expect(row.querySelector(".nheld")?.textContent).toBe("2/4");
    expect(row.querySelector(".nheld")?.getAttribute("title")).toBe("2 of 4 slots held");
    expect(row.querySelector(".rdot")?.className).toBe("rdot live");
  });

  test("the filtered runner is marked on, the planned one planned", () => {
    const { one } = draw({ hostFilter: "local" });
    expect(one('[data-runner="local"]').classList.contains("on")).toBe(true);
    expect(one('[data-runner="ssh:build-1"]').classList.contains("on")).toBe(false);
    expect(one('[data-runner="e2b"]').classList.contains("planned")).toBe(true);
  });

  test("the caret folds and unfolds, and is disabled on a planned runner", () => {
    const { one, runners } = draw();
    const caret = one('[data-runner="local"] .net-caret');
    expect(caret.textContent).toBe("▾");
    expect(caret.getAttribute("title")).toBe("fold");
    fireEvent.click(caret);
    expect(runners).toEqual(["local"]);
    expect(one('[data-runner="ssh:build-1"] .net-caret').textContent).toBe("▸");
    expect(one('[data-runner="ssh:build-1"] .net-caret').getAttribute("title")).toBe("unfold");
    expect((one('[data-runner="e2b"] .net-caret') as HTMLButtonElement).disabled).toBe(true);
  });

  test("the name toggles the runner filter; a planned runner's name is inert", () => {
    const { one, filters } = draw();
    expect(one('[data-runner="local"] .nm').getAttribute("title")).toBe("focus the board on local");
    fireEvent.click(one('[data-runner="local"] .nm'));
    fireEvent.click(one('[data-runner="e2b"] .nm'));
    expect(filters).toEqual([["host", "local"]]);
    cleanup();
    const active = draw({ hostFilter: "local" });
    fireEvent.click(active.one('[data-runner="local"] .nm'));
    expect(active.filters).toEqual([["host", "*"]]);
  });

  test("a planned runner says not configured; an open idle one says nothing runs", () => {
    const { container } = draw({ expandedRunners: new Set(["local", "ssh:build-1", "e2b"]) });
    const notes = [...container.querySelectorAll(".nnone")].map((n) => n.textContent);
    expect(notes).toEqual(["nothing running here", "not configured"]);
  });

  test("a runner that is not expanded shows none of its projects", () => {
    const { container } = draw({ expandedRunners: new Set<string>() });
    expect(container.querySelector(".np")).toBeNull();
  });
});

describe("<NetworkTree/> — projects and leaves", () => {
  test("a project row carries its name and live count", () => {
    const { one } = draw();
    expect(one(".nproj .nm").textContent).toBe("▢ sabado");
    expect(one(".nproj .cnt").textContent).toBe("3 live");
  });

  test("the project name toggles the project filter; a second click clears", () => {
    const { one, filters } = draw();
    fireEvent.click(one(".nproj .nm"));
    expect(filters).toEqual([["proj", "sabado"]]);
    cleanup();
    const active = draw({ projFilter: "sabado" });
    expect(active.one(".nproj").classList.contains("on")).toBe(true);
    fireEvent.click(active.one(".nproj .nm"));
    expect(active.filters).toEqual([["proj", "*"]]);
  });

  test("the project caret reports <runner>/<project> and a folded project hides its leaves", () => {
    const { one, projects, container } = draw();
    fireEvent.click(one(".nproj .net-caret"));
    expect(projects).toEqual(["local/sabado"]);
    expect(container.querySelectorAll(".leaf")).toHaveLength(3);
    cleanup();
    const folded = draw({ collapsedProjects: new Set(["local/sabado"]) });
    expect(folded.container.querySelectorAll(".leaf")).toHaveLength(0);
    expect(folded.one(".nproj .net-caret").textContent).toBe("▸");
  });

  test("a leaf carries glyph, short id and now, its title and its hue", () => {
    const { container } = draw();
    const leaf = container.querySelector(".leaf") as HTMLElement;
    expect(leaf.querySelector(".lgl")?.textContent).toBe("●");
    expect(leaf.querySelector(".lid")?.textContent).toBe("sabado-276");
    expect(leaf.querySelector(".lnow")?.textContent).toBe("build");
    expect(leaf.getAttribute("title")).toBe("sabado-276 · build");
    expect(leaf.style.getPropertyValue("--hue")).toBe("140");
  });

  test("a leaf click opens its run; the selected leaf is marked sel", () => {
    const { container, opened } = draw({ selected: "sabado-277-lint-fix" });
    const leaves = [...container.querySelectorAll(".leaf")];
    expect(leaves.map((l) => l.classList.contains("sel"))).toEqual([false, true, false]);
    fireEvent.click(leaves[2] as Element);
    expect(opened).toEqual(["sabado-278-docs"]);
  });

  test("an empty net draws the frame and no runner", () => {
    const { container } = draw({ net: [] });
    expect(container.querySelector(".nr")).toBeNull();
    expect(container.querySelector(".net-hd span")?.textContent).toBe("⌬ NETWORK · 0 of 0 online");
  });
});
