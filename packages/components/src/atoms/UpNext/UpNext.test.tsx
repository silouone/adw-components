// `<UpNext/>` tests: the "up next" strip.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { UpNext } from "./UpNext";

afterEach(cleanup);

describe("<UpNext/>", () => {
  test("an empty array renders nothing", () => {
    const { container } = render(<UpNext label="up next" entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  test("the lead-in word is the label prop", () => {
    const { container } = render(
      <UpNext label="coming next" entries={[{ node: "gates", status: "pending" }]} />,
    );
    expect(container.querySelector(".un-label")?.textContent).toBe("coming next");
  });

  test("a single entry renders with zero separators", () => {
    const { container } = render(
      <UpNext label="up next" entries={[{ node: "gates", status: "pending" }]} />,
    );
    expect(container.querySelectorAll(".un-item")).toHaveLength(1);
    expect(container.querySelectorAll(".un-sep")).toHaveLength(0);
  });

  test("multiple entries render in order with separators", () => {
    const { container } = render(
      <UpNext
        label="up next"
        entries={[
          { node: "gates", status: "pending" },
          { node: "commit", status: "pending" },
        ]}
      />,
    );
    expect([...container.querySelectorAll(".un-item")].map((n) => n.textContent)).toEqual([
      "gates",
      "commit",
    ]);
    expect(container.querySelectorAll(".un-sep")).toHaveLength(1);
  });

  test("a not-run entry carries un-gone; a pending one does not", () => {
    const { container } = render(
      <UpNext
        label="up next"
        entries={[
          { node: "gates", status: "pending" },
          { node: "commit", status: "not-run" },
        ]}
      />,
    );
    const items = container.querySelectorAll(".un-item");
    expect(items[0]?.className).not.toContain("un-gone");
    expect(items[1]?.className).toContain("un-gone");
  });
});
