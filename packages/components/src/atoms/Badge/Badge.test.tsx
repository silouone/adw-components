// `<RoundBadge/>` / `<WatchdogBadge/>` tests: the round and watchdog badge pair.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import { ROUND_LABELS, WATCHDOG_LABEL } from "../../../fixtures/Badge";
import { RoundBadge, WatchdogBadge } from "./Badge";

afterEach(cleanup);

describe("<RoundBadge/>", () => {
  test("undefined renders nothing", () => {
    const { container } = render(<RoundBadge round={undefined} labels={ROUND_LABELS} />);
    expect(container.innerHTML).toBe("");
  });

  test("a round renders 'attempt N of M'", () => {
    const { container } = render(<RoundBadge round={{ round: 2, of: 3 }} labels={ROUND_LABELS} />);
    expect(container.textContent).toBe("attempt 2 of 3");
    expect(container.querySelector(".badge.round")).not.toBeNull();
    expect(container.querySelector(".badge.badge-round")).not.toBeNull();
  });
});

describe("<WatchdogBadge/>", () => {
  test("undefined renders nothing", () => {
    const { container } = render(<WatchdogBadge watchdog={undefined} label={WATCHDOG_LABEL} />);
    expect(container.innerHTML).toBe("");
  });

  test("a watchdog trip renders its reason", () => {
    const { container } = render(
      <WatchdogBadge watchdog={{ reason: "no output for 15s" }} label={WATCHDOG_LABEL} />,
    );
    expect(container.textContent).toBe("lane stalled: no output for 15s");
    expect(container.querySelector(".badge.watchdog")).not.toBeNull();
  });
});
