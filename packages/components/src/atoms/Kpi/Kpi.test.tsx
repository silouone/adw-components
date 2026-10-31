import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/preact";
import { Kpi, type KpiTone, KpiToneContext } from "./Kpi";

afterEach(cleanup);

const css = readFileSync(new URL("./Kpi.css", import.meta.url), "utf8");
const chip = (tone?: KpiTone) =>
  render(
    <Kpi cls="kpi-time" glyph="◷" value="1m" title="t" {...(tone === undefined ? {} : { tone })} />,
  ).container.querySelector(".kpi") as HTMLElement;

describe("Kpi tone", () => {
  test("no tone renders no modifier", () => {
    expect(chip().className).toBe("kpi kpi-time");
  });
  for (const [tone, cls, rule] of [
    ["card", "kpi-card", /\.kpi-card\.kpi\s*\{/],
    ["card-end", "kpi-card-end", /\.kpi-card\.kpi-card-end\.kpi\s*\{/],
    ["row", "kpi-row", /\.kpi-row\.kpi\s*\{/],
  ] as const)
    test(`tone="${tone}" renders ${cls} and Kpi.css styles it`, () => {
      expect(chip(tone).classList.contains(cls)).toBe(true);
      expect(css).toMatch(rule);
    });
  test("a KpiToneContext sets the tone of a Kpi that has no prop", () => {
    const { container } = render(
      <KpiToneContext.Provider value="row">
        <Kpi cls="kpi-time" glyph="◷" value="1m" title="t" />
      </KpiToneContext.Provider>,
    );
    expect(container.querySelector(".kpi-row")).not.toBeNull();
  });
  test("an explicit tone beats the context", () => {
    const { container } = render(
      <KpiToneContext.Provider value="row">
        <Kpi cls="kpi-time" glyph="◷" value="1m" title="t" tone="card" />
      </KpiToneContext.Provider>,
    );
    expect(container.querySelector(".kpi-card")).not.toBeNull();
    expect(container.querySelector(".kpi-row")).toBeNull();
  });
  test("href renders an anchor with rel noopener noreferrer and target _blank", () => {
    const { container } = render(
      <Kpi cls="kpi-pr" glyph="#" value="42" title="t" href="https://example.test/pr/42" />,
    );
    const a = container.querySelector("a.kpi.kpi-link") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toBe("https://example.test/pr/42");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a.getAttribute("target")).toBe("_blank");
  });
  test("switching tone between renders of one instance does not break the hook order", () => {
    const view = (tone?: KpiTone) => (
      <Kpi
        cls="kpi-time"
        glyph="◷"
        value="1m"
        title="t"
        {...(tone === undefined ? {} : { tone })}
      />
    );
    const { container, rerender } = render(
      <KpiToneContext.Provider value="row">{view("card")}</KpiToneContext.Provider>,
    );
    expect(container.querySelector(".kpi-card")).not.toBeNull();
    rerender(<KpiToneContext.Provider value="row">{view()}</KpiToneContext.Provider>);
    expect(container.querySelector(".kpi-row")).not.toBeNull();
    rerender(<KpiToneContext.Provider value="row">{view("card")}</KpiToneContext.Provider>);
    expect(container.querySelector(".kpi-card")).not.toBeNull();
  });
});
