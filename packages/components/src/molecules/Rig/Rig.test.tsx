// `<RigTag/>` tests: provider glyph and name, model, the thinking meter and the gear.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  NONE_LABEL,
  RIG_BUDGET,
  RIG_CLAUDE,
  RIG_CODEX,
  RIG_MODEL_ONLY,
} from "../../../fixtures/Rig";
import { RigTag } from "./Rig";

afterEach(cleanup);

describe("<RigTag/>", () => {
  test("a full rig shows glyph, provider, model, meter and gear, with the tooltip", () => {
    const { container } = render(<RigTag rig={RIG_CLAUDE} none={NONE_LABEL} />);
    const rig = container.querySelector(".rig") as HTMLElement;
    expect(rig.title).toBe(RIG_CLAUDE.title);
    expect(rig.querySelector(".prov.claude")?.textContent).toBe("✳");
    expect(rig.querySelector(".prov-n")?.textContent).toBe("claude");
    expect(rig.querySelector(".rig-m")?.textContent).toBe("opus-5-5");
    expect(rig.querySelector(".gear")?.textContent).toBe("G2");
  });

  test("the meter lights as many steps as the effort's level", () => {
    const high = render(<RigTag rig={RIG_CLAUDE} none={NONE_LABEL} />).container;
    expect(high.querySelectorAll(".think i.on")).toHaveLength(3);
    expect(high.querySelectorAll(".think i")).toHaveLength(5);
    expect(high.querySelector(".think em")?.textContent).toBe("high");
    cleanup();
    const max = render(<RigTag rig={RIG_CODEX} none={NONE_LABEL} />).container;
    expect(max.querySelectorAll(".think i.on")).toHaveLength(5);
    expect(max.querySelector(".prov.codex")?.textContent).toBe("◎");
  });

  test("compact drops the provider name but keeps the effort word in the DOM", () => {
    const { container } = render(<RigTag rig={RIG_CLAUDE} none={NONE_LABEL} compact />);
    expect(container.querySelector(".rig.compact")).not.toBeNull();
    expect(container.querySelector(".prov-n")).toBeNull();
    expect(container.querySelector(".think em")?.textContent).toBe("high");
  });

  test("a budget without an effort reads as text, with no meter", () => {
    const { container } = render(<RigTag rig={RIG_BUDGET} none={NONE_LABEL} />);
    expect(container.querySelector(".think.txt")?.textContent).toBe("8k budget");
    expect(container.querySelector(".think i")).toBeNull();
  });

  test("no provider shows a ? glyph and no provider name", () => {
    const { container } = render(<RigTag rig={RIG_MODEL_ONLY} none={NONE_LABEL} />);
    expect(container.querySelector(".prov.unknown")?.textContent).toBe("?");
    expect(container.querySelector(".prov-n")).toBeNull();
    expect(container.querySelector(".think")).toBeNull();
    expect(container.querySelector(".gear")).toBeNull();
  });

  test("no rig renders the none text", () => {
    const { container } = render(<RigTag rig={undefined} none={NONE_LABEL} />);
    expect(container.querySelector(".rig.none")?.textContent).toBe("rig not journaled");
  });
});
