// The two-click control: a first click arms (and names what it will do), a second within
// the window fires, and the arming lapses by itself.

import { afterEach, describe, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import { ArmButton } from "./ArmButton";

afterEach(cleanup);

function setup(
  onFire: () => Promise<string | undefined>,
  armMs?: number,
): { btn: () => HTMLButtonElement; container: Element } {
  const { container } = render(
    <ArmButton
      label="Pause"
      armedLabel="Pause t-1?"
      onFire={onFire}
      {...(armMs !== undefined ? { armMs } : {})}
    />,
  );
  return {
    container,
    btn: () => container.querySelector("button") as HTMLButtonElement,
  };
}

describe("<ArmButton/>", () => {
  test("the first click arms and does not fire; the second fires once", async () => {
    let fired = 0;
    const { btn } = setup(async () => {
      fired += 1;
      return undefined;
    });
    expect(btn().textContent).toBe("Pause");
    fireEvent.click(btn());
    expect(btn().textContent).toBe("Pause t-1?");
    expect(fired).toBe(0);
    fireEvent.click(btn());
    await waitFor(() => expect(fired).toBe(1));
    await waitFor(() => expect(btn().textContent).toBe("Pause"));
  });

  test("the arming lapses after armMs, and a click then re-arms instead of firing", async () => {
    let fired = 0;
    const { btn } = setup(async () => {
      fired += 1;
      return undefined;
    }, 20);
    fireEvent.click(btn());
    expect(btn().textContent).toBe("Pause t-1?");
    await waitFor(() => expect(btn().textContent).toBe("Pause"));
    fireEvent.click(btn());
    expect(fired).toBe(0);
    expect(btn().textContent).toBe("Pause t-1?");
  });

  test("a failure text from onFire is shown", async () => {
    const { btn, container } = setup(async () => 'ticket "t-1" is not running');
    fireEvent.click(btn());
    await act(async () => {
      fireEvent.click(btn());
    });
    await waitFor(() =>
      expect(container.querySelector(".arm-err")?.textContent).toBe('ticket "t-1" is not running'),
    );
  });

  test("a click does not bubble to the enclosing element", () => {
    let bubbled = 0;
    const { container } = render(
      <div role="none" onClick={() => (bubbled += 1)} onKeyUp={() => {}}>
        <ArmButton label="Pause" armedLabel="x?" onFire={async () => undefined} />
      </div>,
    );
    fireEvent.click(container.querySelector("button") as HTMLButtonElement);
    expect(bubbled).toBe(0);
  });

  test("while a fire is in flight the button is disabled and a third click fires nothing", async () => {
    let fired = 0;
    let release: (text: string | undefined) => void = () => {};
    const { btn } = setup(() => {
      fired += 1;
      return new Promise<string | undefined>((resolve) => {
        release = resolve;
      });
    });
    fireEvent.click(btn());
    fireEvent.click(btn());
    expect(fired).toBe(1);
    expect(btn().disabled).toBe(true);
    fireEvent.click(btn());
    expect(fired).toBe(1);
    await act(async () => {
      release(undefined);
    });
    await waitFor(() => expect(btn().disabled).toBe(false));
    expect(btn().textContent).toBe("Pause");
  });

  test("a new arming clears the previous failure text", async () => {
    const { btn, container } = setup(async () => "boom");
    fireEvent.click(btn());
    await act(async () => {
      fireEvent.click(btn());
    });
    await waitFor(() => expect(container.querySelector(".arm-err")?.textContent).toBe("boom"));
    fireEvent.click(btn());
    expect(container.querySelector(".arm-err")).toBeNull();
    expect(btn().textContent).toBe("Pause t-1?");
  });

  test("a fire that succeeds leaves no failure text and disarms", async () => {
    const { btn, container } = setup(async () => undefined);
    fireEvent.click(btn());
    await act(async () => {
      fireEvent.click(btn());
    });
    await waitFor(() => expect(btn().textContent).toBe("Pause"));
    expect(container.querySelector(".arm-err")).toBeNull();
    expect(btn().classList.contains("armed")).toBe(false);
  });

  test("unmounting while armed cancels the timer, and a late fire result after unmount is dropped", async () => {
    let release: (text: string | undefined) => void = () => {};
    const armed = setup(async () => undefined, 10);
    fireEvent.click(armed.btn());
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 30));

    const inFlight = setup(
      () =>
        new Promise<string | undefined>((resolve) => {
          release = resolve;
        }),
    );
    fireEvent.click(inFlight.btn());
    fireEvent.click(inFlight.btn());
    cleanup();
    release("late failure");
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(document.body.textContent).not.toContain("late failure");
  });
});
