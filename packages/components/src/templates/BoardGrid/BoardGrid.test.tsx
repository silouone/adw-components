// `<BoardGrid/>` renders from props: notices, the empty paragraph, the legend, the ledger columns, the
// keyed sections and the no-match message arrive as values or slots. Stub elements stand in for the
// organisms; literal view models from the fixtures.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  BOARD_GRID_COLUMNS,
  BOARD_GRID_EMPTY,
  BOARD_GRID_NO_MATCH,
  BOARD_GRID_NOTICES,
} from "../../../fixtures/BoardGrid";
import { BoardGrid } from "./BoardGrid";

afterEach(cleanup);

describe("<BoardGrid/>", () => {
  test("notices render as a warning list, one `⚠ text` item each; none → no list", () => {
    const { container } = render(<BoardGrid notices={BOARD_GRID_NOTICES} />);
    const items = Array.from(container.querySelectorAll("ul.board-grid-notices > li"));
    expect(items.map((li) => li.textContent)).toEqual(BOARD_GRID_NOTICES.map((n) => `⚠ ${n}`));
    cleanup();
    const none = render(<BoardGrid notices={[]} />);
    expect(none.container.querySelector(".board-grid-notices")).toBeNull();
  });

  test("empty slot renders the paragraph with the given content; absent → no paragraph", () => {
    const { container } = render(
      <BoardGrid
        notices={[]}
        empty={
          <>
            {BOARD_GRID_EMPTY} <code>adw run</code>
          </>
        }
      />,
    );
    const p = container.querySelector("p.board-grid-empty") as HTMLElement;
    expect(p.textContent).toBe(`${BOARD_GRID_EMPTY} adw run`);
    expect(p.querySelector("code")?.textContent).toBe("adw run");
    cleanup();
    expect(
      render(<BoardGrid notices={[]} />).container.querySelector(".board-grid-empty"),
    ).toBeNull();
  });

  test("legend renders above the columns, columns above the grid", () => {
    const { container } = render(
      <BoardGrid notices={[]} legend={<i data-slot="legend" />} columns={BOARD_GRID_COLUMNS}>
        <i data-slot="section" />
      </BoardGrid>,
    );
    const order = Array.from(container.children).map(
      (el) => el.getAttribute("data-slot") ?? el.className,
    );
    expect(order).toEqual(["legend", "board-grid-cols", "board-grid"]);
  });

  test("columns render one span per name, in order, including the empty first cell; absent → none", () => {
    const { container } = render(<BoardGrid notices={[]} columns={BOARD_GRID_COLUMNS} />);
    const spans = Array.from(container.querySelectorAll(".board-grid-cols > span"));
    expect(spans.map((s) => s.textContent)).toEqual([...BOARD_GRID_COLUMNS]);
    expect(spans[0]?.textContent).toBe("");
    cleanup();
    expect(
      render(<BoardGrid notices={[]} />).container.querySelector(".board-grid-cols"),
    ).toBeNull();
  });

  test("children render inside the grid wrapper in the order given; no children → no grid wrapper", () => {
    const { container } = render(
      <BoardGrid notices={[]}>
        <i data-slot="a" />
        <i data-slot="b" />
      </BoardGrid>,
    );
    const grid = container.querySelector("div.board-grid") as HTMLElement;
    expect(Array.from(grid.children).map((c) => c.getAttribute("data-slot"))).toEqual(["a", "b"]);
    cleanup();
    expect(render(<BoardGrid notices={[]} />).container.querySelector(".board-grid")).toBeNull();
  });

  test("with nothing to place, nothing renders", () => {
    const { container } = render(<BoardGrid notices={[]} />);
    expect(container.childElementCount).toBe(0);
  });

  test("every part present: notices, empty, legend, columns, grid, noMatch in that order", () => {
    const { container } = render(
      <BoardGrid
        notices={BOARD_GRID_NOTICES}
        empty="none yet"
        legend={<i data-slot="legend" />}
        columns={BOARD_GRID_COLUMNS}
        noMatch={BOARD_GRID_NO_MATCH}
      >
        <i data-slot="section" />
      </BoardGrid>,
    );
    expect(
      Array.from(container.children).map((el) => el.getAttribute("data-slot") ?? el.className),
    ).toEqual([
      "board-grid-notices",
      "board-grid-empty",
      "legend",
      "board-grid-cols",
      "board-grid",
      "board-grid-no-match",
    ]);
  });

  test("equal notices each keep their own item; notice text is text, never markup", () => {
    const { container } = render(<BoardGrid notices={["same", "same", "<b>x</b>"]} />);
    const items = Array.from(container.querySelectorAll(".board-grid-notices > li"));
    expect(items.map((li) => li.textContent)).toEqual(["⚠ same", "⚠ same", "⚠ <b>x</b>"]);
    expect(container.querySelector("b")).toBeNull();
  });

  test("an empty column list renders the header row with no cells", () => {
    const { container } = render(<BoardGrid notices={[]} columns={[]} />);
    const row = container.querySelector(".board-grid-cols") as HTMLElement;
    expect(row.childElementCount).toBe(0);
  });

  test("noMatch alone renders under no grid", () => {
    const { container } = render(<BoardGrid notices={[]} noMatch={BOARD_GRID_NO_MATCH} />);
    expect(container.querySelector(".board-grid")).toBeNull();
    expect(container.querySelector(".board-grid-no-match")?.textContent).toBe(BOARD_GRID_NO_MATCH);
  });

  test("noMatch renders its text under the grid; absent → none", () => {
    const { container } = render(
      <BoardGrid notices={[]} noMatch={BOARD_GRID_NO_MATCH}>
        <i data-slot="a" />
      </BoardGrid>,
    );
    const last = container.lastElementChild as HTMLElement;
    expect(last.className).toBe("board-grid-no-match");
    expect(last.textContent).toBe(BOARD_GRID_NO_MATCH);
    cleanup();
    expect(
      render(<BoardGrid notices={[]} />).container.querySelector(".board-grid-no-match"),
    ).toBeNull();
  });
});
