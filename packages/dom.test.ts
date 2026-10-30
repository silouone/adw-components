import { expect, test } from "bun:test";

test("the happy-dom preload registered a DOM", () => {
  const el = document.createElement("div");
  el.textContent = "ok";
  expect(el.outerHTML).toBe("<div>ok</div>");
});
