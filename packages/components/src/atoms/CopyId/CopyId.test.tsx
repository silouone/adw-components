// `<CopyId/>`: the copy is a callback; the flash timer is a prop.

import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import { CopyId } from "./CopyId";

const writeText = mock(async (_t: string) => {});
Object.defineProperty(navigator, "clipboard", {
  value: { writeText },
  configurable: true,
});

afterEach(() => {
  cleanup();
  writeText.mockClear();
});

const button = (c: Element) => c.querySelector(".tc-copy") as HTMLElement;

describe("<CopyId/>", () => {
  test("a click calls onCopy with the ticket id and touches no clipboard", () => {
    const onCopy = mock((_t: string) => {});
    const { container } = render(
      <CopyId ticketId="t-1" label="copy t-1" copiedLabel="copied" onCopy={onCopy} />,
    );
    fireEvent.click(button(container));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith("t-1");
    expect(writeText).not.toHaveBeenCalled();
  });

  test("the copied flash lapses after flashMs", async () => {
    const { container } = render(
      <CopyId
        ticketId="t-1"
        label="copy t-1"
        copiedLabel="copied"
        onCopy={() => {}}
        flashMs={10}
      />,
    );
    fireEvent.click(button(container));
    expect(button(container).textContent).toBe("copied");
    await waitFor(() => expect(button(container).textContent).toBe("⧉"));
  });

  test("a click does not follow the card link", () => {
    const { container } = render(
      <CopyId ticketId="t-1" label="copy t-1" copiedLabel="copied" onCopy={() => {}} />,
    );
    expect(fireEvent.click(button(container))).toBe(false);
  });
});

describe("<CopyId/> — shown", () => {
  test("shown marks the button tc-copy-shown", () => {
    const { container } = render(
      <CopyId ticketId="t-1" label="copy t-1" copiedLabel="copied" onCopy={() => {}} shown />,
    );
    expect(button(container).classList.contains("tc-copy-shown")).toBe(true);
  });

  test("default has no shown marker", () => {
    const { container } = render(
      <CopyId ticketId="t-1" label="copy t-1" copiedLabel="copied" onCopy={() => {}} />,
    );
    expect(button(container).className).toBe("tc-copy");
  });
});
