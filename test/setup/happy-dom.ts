import { GlobalRegistrator } from "@happy-dom/global-registrator";

// `GlobalRegistrator.register()` installs the DOM globals component tests need
// (`document`, `window`, `HTMLElement`, …) — but it also OVERWRITES 18 globals
// that have nothing to do with the DOM, including the whole network stack and
// two runtime primitives. Measured, not assumed, by diffing `globalThis`
// across `register()`:
//
//   fetch Request Response Headers AbortController AbortSignal WebSocket
//   FormData Blob File URL navigator setTimeout queueMicrotask
//   WritableStream TransformStream Event EventTarget
//
// Two suites in this repo run real I/O and break under happy-dom's versions:
//
//   - `test/web/server.test.ts` drives a real `Bun.serve` over real `fetch`.
//     Under happy-dom's `fetch`, 74 of its 76 tests fail with a "Duplicate
//     Content-Length" parse error.
//   - `test/workspace/e2b.contract.test.ts` drives the real `e2b` SDK against
//     a live sandbox. It only runs when `E2B_API_KEY` is set, so it SKIPS on
//     a developer machine without one and the breakage is invisible there —
//     which is exactly how it reached a gate run and blocked it (the gate
//     process inherits the key; the agent's child process does not, because
//     `sanitizeAgentEnv` strips `*_KEY`).
//
// So: restore every NETWORK and RUNTIME global to Bun's native version, and
// keep only what is genuinely DOM. `Event`/`EventTarget`/`navigator` stay
// happy-dom's — `@testing-library/preact` dispatches real DOM events through
// them, and swapping those back breaks component tests.
const NATIVE = [
  // network
  "fetch",
  "Request",
  "Response",
  "Headers",
  "AbortController",
  "AbortSignal",
  "WebSocket",
  "FormData",
  "Blob",
  "File",
  "URL",
  // runtime — `setTimeout` in particular: every SDK timeout depends on it
  "setTimeout",
  "queueMicrotask",
  "WritableStream",
  "TransformStream",
] as const;

const saved = new Map<string, unknown>();
for (const key of NATIVE) {
  saved.set(key, (globalThis as Record<string, unknown>)[key]);
}

GlobalRegistrator.register();

for (const [key, value] of saved) {
  if (value !== undefined) {
    (globalThis as Record<string, unknown>)[key] = value;
  }
}
