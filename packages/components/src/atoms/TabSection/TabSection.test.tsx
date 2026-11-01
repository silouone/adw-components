// `<TabSection/>` tests: the density variant of the shared section block.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { TabSection } from "./TabSection";

afterEach(cleanup);

describe('<TabSection/> — density="rail"', () => {
  test("renders tab-section-rail on the section", () => {
    const { container } = render(
      <TabSection title="t" density="rail">
        x
      </TabSection>,
    );
    expect(container.querySelector("section")?.className).toBe("tab-section tab-section-rail");
  });

  test("no density, no modifier", () => {
    const { container } = render(<TabSection title="t">x</TabSection>);
    expect(container.querySelector("section")?.className).toBe("tab-section");
  });
});
