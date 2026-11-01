import type { FailurePaneView } from "../src/organisms/FailureView/FailureView";

// Hand-written view models for `<FailureView/>`: its test and its stories read these. The
// failure is a blocked gate whose frontend test threw at one line of a wizard flow.

/** A gate that failed with a code frame, a stack and a coloured output tail. */
export const FAILURE: FailurePaneView = {
  headline: "Unable to find an accessible element with the role 'button'",
  last: "error: script test-frontend exited with code 1",
  summary: [
    { key: "node", value: "gates-rebased" },
    { key: "gate", value: "test-frontend" },
    { key: "exit", value: "1" },
    { key: "at", value: "CreationWizard.flow.test.tsx:77" },
  ],
  tabs: ["code", "stack", "output"],
  code: [
    { kind: "ctx", num: 75, text: "  render(<CreationWizard />);" },
    { kind: "ctx", num: 76, text: "  await user.click(next);" },
    {
      kind: "hit",
      num: 77,
      text: "  await user.click(screen.getByRole('button', { name: cta }));",
    },
    { kind: "caret", text: "                          ^" },
    { kind: "ctx", num: 78, text: "  expect(onDone).toHaveBeenCalled();" },
  ],
  frames: [
    {
      fn: "Object.getElementError",
      path: "/r/node_modules/@testing-library/dom/dist/config.js",
      line: 37,
      col: 19,
      lib: true,
    },
    {
      fn: "cta",
      path: "/r/src/pages/CreationWizard.tsx",
      line: 41,
      col: 9,
      lib: false,
    },
    {
      path: "/r/src/pages/CreationWizard.flow.test.tsx",
      line: 77,
      col: 26,
      lib: false,
    },
    {
      fn: "processTicksAndRejections",
      path: "/r/node_modules/bun/internal/async.js",
      line: 12,
      col: 3,
      lib: true,
    },
  ],
  output: [
    [{ text: "bun test v1.3" }],
    [{ text: "FAIL", color: "red" }, { text: " CreationWizard.flow.test.tsx" }],
    [{ text: "  1 fail, 12 pass", color: "dim" }],
  ],
};

/** A failure that has no tail to read: only its headline and detail, in the output tab. */
export const NO_TAIL: FailurePaneView = {
  headline: "lease refused",
  summary: [{ key: "node", value: "dispatch" }],
  tabs: ["output"],
  code: [],
  frames: [],
  output: [[{ text: "lease refused" }], [{ text: "another run holds the slot" }]],
};

/** The smallest view: a headline, no rows, no tabs. */
export const BARE: FailurePaneView = {
  headline: "h",
  summary: [],
  tabs: [],
  code: [],
  frames: [],
  output: [],
};
