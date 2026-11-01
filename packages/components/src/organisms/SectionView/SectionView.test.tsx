// `<SectionView/>` tests: the board's project section as a pure render of its `SectionView`
// — the cards or the ledger rows, the rail's tallies — with every control a callback.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/preact";
import {
  ITEMS,
  SECTION_CARDS,
  SECTION_COLLAPSED,
  SECTION_FILTERED_OUT,
  SECTION_LABELS,
  SECTION_LEDGER,
  SECTION_LEGACY,
  SECTION_PAUSED,
  TARGET,
} from "../../../fixtures/SectionView";
import { type PauseScope, type PauseVerb, SectionView, type SectionViewProps } from "./SectionView";

afterEach(cleanup);

interface Calls {
  readonly pauses: [PauseVerb, PauseScope][];
  readonly continues: [string, boolean][];
  readonly copies: string[];
  readonly picks: string[];
}

const draw = (
  view: SectionView,
  extra: Partial<SectionViewProps> = {},
): { readonly c: Element; readonly calls: Calls } => {
  const calls: Calls = { pauses: [], continues: [], copies: [], picks: [] };
  const { container } = render(
    <SectionView
      view={view}
      labels={SECTION_LABELS}
      onPause={(verb, scope) => {
        calls.pauses.push([verb, scope]);
        return Promise.resolve(undefined);
      }}
      onContinue={(target, on) => {
        calls.continues.push([target, on]);
        return Promise.resolve(undefined);
      }}
      onCopy={(t) => calls.copies.push(t)}
      onSelect={(id) => calls.picks.push(id)}
      {...extra}
    />,
  );
  return { c: container, calls };
};

const details = (c: Element): HTMLDetailsElement =>
  c.querySelector("details") as HTMLDetailsElement;
const button = (c: Element, label: string): HTMLButtonElement =>
  [...c.querySelectorAll("button.arm-btn")].find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement;

describe("<SectionView/> — cards and ledger", () => {
  test("cards mode draws one card per item and no ledger row", () => {
    const { c } = draw(SECTION_CARDS);
    expect(details(c).className).toBe("grp");
    expect(c.querySelectorAll(".grp-grid .tc")).toHaveLength(ITEMS.length);
    expect(c.querySelectorAll(".lr")).toHaveLength(0);
    expect([...c.querySelectorAll(".tc")].map((e) => e.getAttribute("data-ticket"))).toEqual(
      ITEMS.map((i) => i.ticketId),
    );
  });

  test("ledger mode draws one row per item and no card", () => {
    const { c } = draw(SECTION_LEDGER);
    expect(details(c).className).toBe("grp lg grp-ledger");
    expect(c.querySelectorAll(".lrs .lr")).toHaveLength(ITEMS.length);
    expect(c.querySelectorAll(".tc")).toHaveLength(0);
    expect([...c.querySelectorAll(".lr")].map((e) => e.getAttribute("data-ticket"))).toEqual(
      ITEMS.map((i) => i.ticketId),
    );
  });

  test("the selected ticket wears the outline in both layouts", () => {
    const cards = draw(SECTION_CARDS, { selected: "adw-blocked-02" }).c;
    expect(cards.querySelector(".tc.sel")?.getAttribute("data-ticket")).toBe("adw-blocked-02");
    cleanup();
    const rows = draw(SECTION_LEDGER, { selected: "adw-waiting-03" }).c;
    expect(rows.querySelector(".lr.sel")?.getAttribute("data-ticket")).toBe("adw-waiting-03");
  });

  test("a click on a card or a row reports its ticket id through onSelect", () => {
    const cards = draw(SECTION_CARDS);
    fireEvent.click(cards.c.querySelector(".tc-now") as Element);
    expect(cards.calls.picks).toEqual(["adw-live-01"]);
    cleanup();
    const rows = draw(SECTION_LEDGER);
    fireEvent.click(rows.c.querySelectorAll(".lr-where")[1] as Element);
    expect(rows.calls.picks).toEqual(["adw-blocked-02"]);
  });

  test("the copy control of a card reports its ticket id through onCopy", () => {
    const { c, calls } = draw(SECTION_CARDS);
    fireEvent.click(c.querySelectorAll(".tc-copy")[2] as Element);
    expect(calls.copies).toEqual(["adw-waiting-03"]);
  });
});

describe("<SectionView/> — the rail", () => {
  test("the heading, the live badge and the activity line read from the tallies", () => {
    const { c } = draw(SECTION_CARDS);
    expect(c.querySelector(".grp-hd b")?.textContent).toBe(TARGET);
    expect(c.querySelector(".grp-live")?.textContent).toBe("1 live");
    expect(c.querySelector(".grp-activity")?.textContent).toBe("1 running · 1 waiting for a slot");
    expect(c.querySelector(".grp-shown")?.textContent).toBe("3");
    expect(details(c).getAttribute("data-proj")).toBe(TARGET);
  });

  test("the meter widths and the green rate follow the visible tally", () => {
    const { c } = draw(SECTION_CARDS);
    expect(c.querySelector(".meter")?.getAttribute("title")).toBe(
      "0 green · 1 blocked · 2 without a run-end",
    );
    const widths = [...c.querySelectorAll(".meter u")].map((u) => (u as HTMLElement).style.width);
    expect(widths).toEqual(["0.00%", "33.33%", "66.67%"]);
    expect(c.querySelector(".grp-rate")?.textContent).toBe("0% green");
  });

  test("a filter that hides every ticket keeps the live badge, shows the dash and the empty line", () => {
    const { c } = draw(SECTION_FILTERED_OUT);
    expect(c.querySelector(".grp-live")).not.toBeNull();
    expect(c.querySelector(".grp-rate")?.textContent).toBe("—");
    expect(c.querySelector(".grp-shown")?.textContent).toBe("0");
    expect((c.querySelector(".grp-empty") as HTMLElement).hidden).toBe(false);
    expect(c.querySelector(".grp-empty")?.textContent).toBe(SECTION_LABELS.empty);
  });

  test("the empty line is hidden while a ticket shows", () => {
    expect((draw(SECTION_CARDS).c.querySelector(".grp-empty") as HTMLElement).hidden).toBe(true);
  });

  test("paused tickets and a paused project are said on the rail", () => {
    const { c } = draw(SECTION_PAUSED);
    expect(c.querySelector(".grp-paused")?.textContent).toBe("· 1 paused");
    expect(c.querySelector(".grp-project-paused")?.textContent).toBe("project paused");
  });

  test("a project with nothing live says no live badge and no activity", () => {
    const { c } = draw({ ...SECTION_CARDS, liveTally: { ...SECTION_CARDS.liveTally, live: 0 } });
    expect(c.querySelector(".grp-live")).toBeNull();
    expect(c.querySelector(".grp-activity")).toBeNull();
  });
});

describe("<SectionView/> — open, closed and hidden", () => {
  test("the section opens from initialOpen and a click on the rail toggles it", () => {
    const { c } = draw(SECTION_CARDS);
    expect(details(c).open).toBe(true);
    fireEvent.click(c.querySelector("summary") as Element);
    expect(details(c).open).toBe(false);
    fireEvent.click(c.querySelector("summary") as Element);
    expect(details(c).open).toBe(true);
  });

  test("a section that starts collapsed stays collapsed until clicked", () => {
    const { c } = draw(SECTION_COLLAPSED);
    expect(details(c).open).toBe(false);
    fireEvent.click(c.querySelector("summary") as Element);
    expect(details(c).open).toBe(true);
  });

  test("forcedOpen opens a collapsed section without touching its own flag", () => {
    const { c } = draw({ ...SECTION_COLLAPSED, forcedOpen: true });
    expect(details(c).open).toBe(true);
    const again = render(
      <SectionView
        view={SECTION_COLLAPSED}
        labels={SECTION_LABELS}
        onPause={() => Promise.resolve(undefined)}
        onContinue={() => Promise.resolve(undefined)}
        onCopy={() => {}}
      />,
      { container: c },
    );
    expect(details(again.container).open).toBe(false);
  });

  test("hiddenByProj hides the section", () => {
    expect(details(draw({ ...SECTION_CARDS, hiddenByProj: true }).c).hidden).toBe(true);
    expect(details(draw(SECTION_CARDS).c).hidden).toBe(false);
  });
});

describe("<SectionView/> — the controls are callbacks", () => {
  test("the pause button arms, then fires onPause with the pause verb and the project scope", () => {
    const { c, calls } = draw(SECTION_CARDS);
    fireEvent.click(button(c, "Pause project"));
    expect(calls.pauses).toEqual([]);
    expect(button(c, `Pause ${TARGET}?`)).toBeDefined();
    fireEvent.click(button(c, `Pause ${TARGET}?`));
    expect(calls.pauses).toEqual([["pause", { target: TARGET }]]);
  });

  test("on a paused project the same button resumes", () => {
    const { c, calls } = draw(SECTION_PAUSED);
    fireEvent.click(button(c, "Resume project"));
    fireEvent.click(button(c, `Resume ${TARGET}?`));
    expect(calls.pauses).toEqual([["resume", { target: TARGET }]]);
  });

  test("the auto-continue button flips the flag through onContinue", () => {
    const off = draw(SECTION_CARDS);
    fireEvent.click(button(off.c, "Auto-continue off"));
    fireEvent.click(button(off.c, `Turn auto-continue on for ${TARGET}?`));
    expect(off.calls.continues).toEqual([[TARGET, true]]);
    cleanup();
    const on = draw(SECTION_PAUSED);
    fireEvent.click(button(on.c, "Auto-continue on"));
    fireEvent.click(button(on.c, `Turn auto-continue off for ${TARGET}?`));
    expect(on.calls.continues).toEqual([[TARGET, false]]);
  });

  test("a click on a control does not toggle the section", () => {
    const { c } = draw(SECTION_CARDS);
    fireEvent.click(button(c, "Pause project"));
    expect(details(c).open).toBe(true);
  });

  test("a legacy section reads `unrecorded`, has no control and carries the note", () => {
    const { c } = draw(SECTION_LEGACY);
    expect(c.querySelector(".grp-hd b")?.textContent).toBe("unrecorded");
    expect(c.querySelectorAll("button.arm-btn")).toHaveLength(0);
    expect(c.querySelector(".legacy-note")?.textContent).toBe(
      "pre-dates the target field — backfillable",
    );
    expect(c.querySelector(".legacy-note code")?.textContent).toBe("target");
  });
});
