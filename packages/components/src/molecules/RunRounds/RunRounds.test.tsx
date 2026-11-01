// `<RunRounds/>` tests: a round links back to its build run, a build run lists its rounds
// with outcome, duration and cost. Pure: a family in, markup out.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { hrefFor, LABELS, ON_A_BUILD, ON_A_ROUND } from "../../../fixtures/RunRounds";
import { RunRounds, type RunRoundsView } from "./RunRounds";

afterEach(cleanup);

const family = (view: RunRoundsView | undefined) =>
  render(<RunRounds family={view} labels={LABELS} hrefFor={hrefFor} />).container;

describe("<RunRounds/>", () => {
  test("no family renders nothing", () => {
    expect(family(undefined).innerHTML).toBe("");
  });

  test("a round's screen links back to the build run it maintains", () => {
    const c = family(ON_A_ROUND);
    const back = c.querySelector(".round-back") as HTMLAnchorElement;
    expect(back.textContent).toBe("← the build run this round maintains");
    expect(back.getAttribute("href")).toBe("/run?id=acme-7-build-1");
    expect(c.querySelector(".round-list")).toBeNull();
  });

  test("a build run lists its rounds: link, outcome, duration, cost; no back link", () => {
    const c = family(ON_A_BUILD);
    expect(c.querySelector(".round-back")).toBeNull();
    const rows = [...c.querySelectorAll(".round-row")];
    expect(rows.map((r) => [...r.children].map((e) => e.textContent))).toEqual([
      ["rebase round", "live", "1m 04s", "$0.12"],
      ["CI round", "fixed", "6m 30s", "$1.48"],
      ["CI round", "unknown", "—", "—"],
    ]);
  });

  test("each round links to its own run screen", () => {
    const hrefs = [...family(ON_A_BUILD).querySelectorAll(".round-row a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual([
      "/run?id=acme-7-rebase-2",
      "/run?id=acme-7-ci-1",
      "/run?id=acme-7-ci-0",
    ]);
  });
});
