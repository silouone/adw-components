// `<BacklogSection/>`: one section over its rows. Literal inputs; the collapse flag is a prop and
// the toggle a callback, so the owner's keyed set (and its survival across updates) is the page's.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { BACKLOG_TOKEN, backlogRow } from "../../../fixtures/BacklogRow";
import {
  BACKLOG_SECTION_NOTES,
  BACKLOG_SECTION_ROWS,
  backlogSectionRowProps,
} from "../../../fixtures/BacklogSection";
import { BacklogSection, type BacklogSectionProps } from "./BacklogSection";

afterEach(cleanup);

const mount = (over: Partial<BacklogSectionProps> = {}) => {
  const onCollapse = mock(() => {});
  const out = render(
    <BacklogSection
      sectionKey="ready"
      notes={BACKLOG_SECTION_NOTES}
      rows={BACKLOG_SECTION_ROWS}
      token={BACKLOG_TOKEN}
      collapsed={false}
      onCollapse={onCollapse}
      rowProps={backlogSectionRowProps}
      {...over}
    />,
  );
  return { ...out, onCollapse };
};
const detailsOf = (container: Element) => container.querySelector("details") as HTMLDetailsElement;

describe("<BacklogSection/> — one row per input row", () => {
  test("renders a <BacklogRow> for each row passed, in order", () => {
    const { container } = mount();
    const rows = [...container.querySelectorAll(".bl-row")];
    expect(rows.map((r) => r.getAttribute("data-row"))).toEqual([
      "proj-101",
      "proj-102",
      "proj-103",
    ]);
    expect(container.querySelector(".bl-section-count")?.textContent).toBe("3");
  });

  test("a row's id is the key: rerendering with another row set keeps the rest", () => {
    const { container, rerender, onCollapse } = mount({ rows: [backlogRow({ id: "a" })] });
    rerender(
      <BacklogSection
        sectionKey="ready"
        notes={BACKLOG_SECTION_NOTES}
        rows={[backlogRow({ id: "a" }), backlogRow({ id: "b" })]}
        token={BACKLOG_TOKEN}
        collapsed={false}
        onCollapse={onCollapse}
        rowProps={backlogSectionRowProps}
      />,
    );
    expect(container.querySelectorAll(".bl-row")).toHaveLength(2);
  });
});

describe("<BacklogSection/> — always renders, even with 0 rows", () => {
  test("empty rows still renders the header with a 0 count", () => {
    const { container } = mount({ sectionKey: "blocked", rows: [] });
    expect(detailsOf(container)).not.toBeNull();
    expect(container.querySelector(".bl-section-count")?.textContent).toBe("0");
    expect(container.querySelectorAll(".bl-row")).toHaveLength(0);
  });
});

describe("<BacklogSection/> — the head", () => {
  test("the key names the section and its note sits beside the count", () => {
    const { container } = mount();
    expect(container.querySelector(".bl-section-head b")?.textContent).toBe("ready");
    expect(container.querySelector(".bl-section-head b")?.className).toBe("s-ready");
    expect(container.querySelector(".bl-section-note")?.textContent).toBe(
      "dispatchable now, priority order",
    );
  });

  test("a heading replaces the key; a key without a note shows none", () => {
    const { container } = mount({ sectionKey: "wave-2", heading: "wave 2 · the cache" });
    expect(container.querySelector(".bl-section-head b")?.textContent).toBe("wave 2 · the cache");
    expect(container.querySelector(".bl-section-note")).toBeNull();
  });
});

describe("<BacklogSection/> from props", () => {
  test("collapsed={true} renders <details> closed", () => {
    expect(detailsOf(mount({ collapsed: true }).container).open).toBe(false);
  });

  test("collapsed={false} renders open", () => {
    expect(detailsOf(mount({ collapsed: false }).container).open).toBe(true);
  });

  test("clicking the summary calls onCollapse and the open state follows the prop", () => {
    const { container, onCollapse } = mount();
    fireEvent.click(container.querySelector("summary") as HTMLElement);
    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(detailsOf(container).open).toBe(true);
  });
});

describe("<BacklogSection/> — the tight variant", () => {
  test("the root details carries grp-tight", () => {
    expect(detailsOf(mount().container).classList).toContain("grp-tight");
  });
});
