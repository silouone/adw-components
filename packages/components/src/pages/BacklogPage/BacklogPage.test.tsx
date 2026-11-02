// `<BacklogPage/>` renders from one view and reports through its actions: no signal seeded, no
// store read. Literal view models from the fixtures. The factory's own test also compared the page
// with the container's markup; that case tests the projection, not the view, and is not copied.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  BACKLOG_PAGE_EMPTY,
  BACKLOG_PAGE_HERO,
  BACKLOG_PAGE_LOADING,
  BACKLOG_PAGE_VIEW,
  noopPageActions,
} from "../../../fixtures/BacklogPage";
import { BacklogPage, type BacklogPageActions } from "./BacklogPage";

afterEach(cleanup);

const actions = (over: Partial<BacklogPageActions> = {}): BacklogPageActions => ({
  ...noopPageActions(),
  onSelect: mock(() => {}),
  onQuery: mock(() => {}),
  ...over,
});

const rowIds = (root: ParentNode): string[] =>
  [...root.querySelectorAll("[data-row]")].map((el) => el.getAttribute("data-row") ?? "");

/** The rows of a collapsed section stay in the markup, inside a closed `<details>`. */
const openSections = (root: ParentNode): ParentNode => {
  const holder = document.createElement("div");
  for (const el of root.querySelectorAll("details.bl-section[open]")) {
    holder.appendChild(el.cloneNode(true));
  }
  return holder;
};

describe("BacklogPage", () => {
  test("renders the list, the drawer and the one hit from the view", () => {
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_VIEW} actions={actions()} />);
    expect((container.querySelector(".bl-gd-search") as HTMLInputElement).value).toBe("cqc-be-04");
    expect(container.querySelector('[data-act="hits"]')?.textContent).toBe("1 hit");
    expect(rowIds(openSections(container))).toEqual(
      BACKLOG_PAGE_VIEW.sections
        .filter((s) => !s.collapsed)
        .flatMap((s) => s.rows.map((r) => r.id)),
    );
    expect((container.querySelector(".bl-search") as HTMLInputElement).value).toBe("cqc-be-04");
  });

  test("renders the next-up hero when a ready row is shown", () => {
    const { container } = render(
      <BacklogPage view={{ ...BACKLOG_PAGE_VIEW, hero: BACKLOG_PAGE_HERO }} actions={actions()} />,
    );
    expect(container.querySelector(".bl-hero-title")?.textContent).toBe(
      BACKLOG_PAGE_HERO.row.title,
    );
  });

  test("a row click goes through the actions", () => {
    const a = actions();
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_VIEW} actions={a} />);
    const row = container.querySelector("[data-row]") as HTMLElement;
    fireEvent.click(row);
    expect(a.onSelect).toHaveBeenCalledWith(row.getAttribute("data-row"));
  });

  test("the toast renders from the view", () => {
    const { container } = render(
      <BacklogPage view={{ ...BACKLOG_PAGE_VIEW, toast: "copied" }} actions={actions()} />,
    );
    expect(container.querySelector(".bl-toast")?.textContent).toBe("copied");
  });

  test("the stale notice renders above the list", () => {
    const { container } = render(
      <BacklogPage
        view={{
          ...BACKLOG_PAGE_VIEW,
          frame: { ...BACKLOG_PAGE_VIEW.frame, stale: true, staleNotice: "x" },
        }}
        actions={actions()}
      />,
    );
    expect(container.querySelector(".backlog-frame-notice")?.textContent).toBe("x");
    expect(container.querySelector(".backlog-frame.backlog-frame-stale")).not.toBeNull();
  });

  test("no toast element without toast text", () => {
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_VIEW} actions={actions()} />);
    expect(container.querySelector(".bl-toast")).toBeNull();
    expect(container.querySelector(".backlog-frame-notice")).toBeNull();
  });

  test("the loading view shows the loading line and no column header", () => {
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_LOADING} actions={actions()} />);
    expect(container.querySelector(".bl-empty")?.textContent).toContain("loading");
    expect(container.querySelector(".bl-thead")).toBeNull();
    expect(container.querySelector("[data-row]")).toBeNull();
  });

  test("a query matching nothing shows the empty line", () => {
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_EMPTY} actions={actions()} />);
    expect(container.querySelector(".bl-empty")?.textContent).toContain("nothing matches");
    expect(container.querySelector("[data-row]")).toBeNull();
  });

  test("a row without a row view fails fast naming the row", () => {
    const id = BACKLOG_PAGE_VIEW.sections[0]?.rows[0]?.id ?? "";
    const { [id]: _dropped, ...rest } = BACKLOG_PAGE_VIEW.rows;
    expect(() =>
      render(<BacklogPage view={{ ...BACKLOG_PAGE_VIEW, rows: rest }} actions={actions()} />),
    ).toThrow(`BacklogPage: no row view for ${id}`);
  });

  test("a shut drawer renders no drawer", () => {
    const { drawer: _drawer, ...noDrawer } = BACKLOG_PAGE_VIEW;
    const { container } = render(<BacklogPage view={noDrawer} actions={actions()} />);
    expect(container.querySelector(".bl-gd-search")).toBeNull();
  });

  test("typing in the search box goes through onQuery", () => {
    const a = actions();
    const { container } = render(<BacklogPage view={BACKLOG_PAGE_VIEW} actions={a} />);
    const input = container.querySelector(".bl-search") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "abc" } });
    expect(a.onQuery).toHaveBeenCalledWith("abc");
  });
});
