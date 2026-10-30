import { describe, expect, test } from "bun:test";
import {
  contrastRatio,
  diffRoots,
  extractSnapshotRoot,
  parseColor,
  parseDeclarations,
  resolveToken,
} from "./css";

describe("contrastRatio", () => {
  test("black on white is 21", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });

  test("a colour on itself is 1", () => {
    expect(contrastRatio("#fff", "#ffffff")).toBeCloseTo(1, 5);
  });

  test("#777777 on white is WCAG's 4.48 example, below AA", () => {
    const ratio = contrastRatio("#777777", "#fff");
    expect(ratio).toBeCloseTo(4.48, 2);
    expect(ratio).toBeLessThan(4.5);
  });

  test("#767676 on white clears AA", () => {
    expect(contrastRatio("#767676", "#fff")).toBeGreaterThanOrEqual(4.5);
  });

  test("argument order does not matter", () => {
    expect(contrastRatio("#0A0B0F", "#E4E8F1")).toBe(contrastRatio("#E4E8F1", "#0A0B0F"));
  });

  test("a 3-digit hex equals its 6-digit form", () => {
    expect(contrastRatio("#fff", "#123456")).toBe(contrastRatio("#ffffff", "#123456"));
  });
});

describe("parseColor", () => {
  test("reads 3- and 6-digit hex in any case", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#0A0B0f")).toEqual([10, 11, 15]);
  });

  test("rejects anything that is not hex, naming the value", () => {
    expect(() => parseColor("hsl(200 62% 58%)")).toThrow(
      "parseColor: unsupported colour 'hsl(200 62% 58%)'",
    );
  });
});

describe("parseDeclarations", () => {
  test("reads several pairs per line and trims values", () => {
    const decls = parseDeclarations("--a:#fff; --b: var(--a) ;\n--c:1px   2px;");
    expect([...decls]).toEqual([
      ["--a", "#fff"],
      ["--b", "var(--a)"],
      ["--c", "1px 2px"],
    ]);
  });

  test("ignores a ; inside a comment", () => {
    const decls = parseDeclarations("/* x = 1; --ghost:1; */ --a:1;");
    expect([...decls.keys()]).toEqual(["--a"]);
  });

  test("keeps colons, commas and parentheses inside a value", () => {
    const decls = parseDeclarations("--s:0 8px 24px color-mix(in srgb,var(--b) 35%,transparent);");
    expect(decls.get("--s")).toBe("0 8px 24px color-mix(in srgb,var(--b) 35%,transparent)");
  });

  test("throws on a duplicate, naming the token", () => {
    expect(() => parseDeclarations("--x:1; --x:2;")).toThrow(
      "parseDeclarations: --x declared twice",
    );
  });
});

// The factory's template-literal interpolation, joined so no test string looks like one.
const ZOOM_INTERPOLATION = ["$", "{PAGE_ZOOM}"].join("");

describe("extractSnapshotRoot", () => {
  test("takes the :root of the template literal and keeps the zoom interpolation verbatim", () => {
    const ts = `export function themeCss(){return \`\n:root{ --a:1; --zoom:${ZOOM_INTERPOLATION}; }\nhtml{zoom:1}\`}`;
    expect(extractSnapshotRoot(ts)).toContain(`--zoom:${ZOOM_INTERPOLATION};`);
    expect(extractSnapshotRoot(ts)).not.toContain("html");
  });

  test("throws when there is no :root", () => {
    expect(() => extractSnapshotRoot("export const x = 1;")).toThrow("extractSnapshotRoot");
  });
});

describe("resolveToken", () => {
  const decls = new Map([
    ["--a", "#fff"],
    ["--b", "var(--a)"],
    ["--c", "var(--b)"],
  ]);

  test("follows var() chains to the leaf", () => {
    expect(resolveToken(decls, "--c")).toBe("#fff");
  });

  test("throws naming the token on a missing target", () => {
    expect(() => resolveToken(new Map([["--x", "var(--nope)"]]), "--x")).toThrow("--nope");
  });

  test("throws naming the token on a cycle", () => {
    expect(() =>
      resolveToken(
        new Map([
          ["--x", "var(--y)"],
          ["--y", "var(--x)"],
        ]),
        "--x",
      ),
    ).toThrow("cycle");
  });
});

describe("diffRoots", () => {
  test("equal roots have no difference, whitespace aside", () => {
    expect(diffRoots("--a:1;  --b:var(--a);", "--a: 1;\n--b:var(--a);")).toEqual({
      changed: [],
      missing: [],
      extra: [],
    });
  });

  test("reports a changed value, a missing token and an extra token", () => {
    expect(diffRoots("--a:1; --b:2;", "--a:9; --c:3;")).toEqual({
      changed: ["--a"],
      missing: ["--b"],
      extra: ["--c"],
    });
  });

  test("ignores the listed names on both sides", () => {
    expect(diffRoots(`--a:1; --zoom:${ZOOM_INTERPOLATION};`, "--a:1;", ["--zoom"])).toEqual({
      changed: [],
      missing: [],
      extra: [],
    });
  });
});
