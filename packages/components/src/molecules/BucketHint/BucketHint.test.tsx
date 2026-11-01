// `<BucketHint/>` tests: the hint's sentence in a `.bl-buckets` span, or nothing.

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/preact";
import {
  HINT_ONE,
  HINT_TWO,
  HINT_TWO_FIGURES,
  HINT_UNKNOWN,
  HINT_ZERO,
} from "../../../fixtures/BucketHint";
import { BucketHint } from "./BucketHint";

afterEach(cleanup);

describe("<BucketHint/>", () => {
  test.each([
    ["a bucket with a figure", HINT_ONE],
    ["a bucket with no figure, read as unknown", HINT_UNKNOWN],
    ["a real 0%", HINT_ZERO],
    ["several buckets joined with ·", HINT_TWO],
    ["both figures, one of them 0%", HINT_TWO_FIGURES],
  ])("%s: the sentence is the span's text, verbatim", (_name, text) => {
    const { container } = render(<BucketHint text={text} />);
    expect(container.textContent).toBe(text);
  });

  test("a bucket with no figure never reads 0%", () => {
    const { container } = render(<BucketHint text={HINT_UNKNOWN} />);
    expect(container.textContent).not.toContain("0%");
  });

  test("undefined text renders nothing", () => {
    expect(render(<BucketHint text={undefined} />).container.innerHTML).toBe("");
  });

  test("renders inside a .bl-buckets span", () => {
    const { container } = render(<BucketHint text={HINT_ONE} />);
    expect(container.querySelector("span.bl-buckets")).not.toBeNull();
  });
});
