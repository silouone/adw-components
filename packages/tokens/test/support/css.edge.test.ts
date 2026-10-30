import { describe, expect, test } from "bun:test";
import {
  contrastRatio,
  diffRoots,
  extractSnapshotRoot,
  parseColor,
  parseDeclarations,
  resolveToken,
} from "./css";

// The factory's template-literal interpolation, joined so no test string looks like one.
const INTERPOLATION = ["$", "{PAGE_ZOOM}"].join("");

describe("parseColor edge cases", () => {
  test.each(["", "#", "#ff", "#ffff", "#fffff", "#fffffff", "#ffffffff", "fff", "#ggg", "#12345z"])(
    "rejects '%s', naming the value",
    (value) => {
      expect(() => parseColor(value)).toThrow(`parseColor: unsupported colour '${value}'`);
    },
  );

  test.each(["rgb(0 0 0)", "rgba(0,0,0,1)", "hsl(0 0% 0%)", "var(--bg)", "red", "transparent"])(
    "rejects the non-hex colour '%s'",
    (value) => {
      expect(() => parseColor(value)).toThrow("parseColor");
    },
  );

  test("tolerates surrounding whitespace", () => {
    expect(parseColor("  #0A0B0F\n")).toEqual([10, 11, 15]);
  });

  test("reads the channel extremes", () => {
    expect(parseColor("#000")).toEqual([0, 0, 0]);
    expect(parseColor("#FFFFFF")).toEqual([255, 255, 255]);
    expect(parseColor("#010203")).toEqual([1, 2, 3]);
  });
});

describe("contrastRatio edge cases", () => {
  test("is never below 1 nor above 21", () => {
    const colours = ["#000", "#fff", "#0A0B0F", "#E4E8F1", "#777", "#f00", "#0f0", "#00f"];
    for (const a of colours) {
      for (const b of colours) {
        const r = contrastRatio(a, b);
        expect({ a, b, ok: r >= 1 && r <= 21 + 1e-9 }).toEqual({ a, b, ok: true });
      }
    }
  });

  test("throws on a colour it cannot parse instead of returning NaN", () => {
    expect(() => contrastRatio("hsl(0 0% 0%)", "#fff")).toThrow("parseColor");
    expect(() => contrastRatio("#fff", "var(--bg)")).toThrow("parseColor");
  });

  test("the sRGB threshold branch is continuous at 0.03928", () => {
    // #0a0a0a sits below the linear-segment threshold, #0b0b0b above it.
    const below = contrastRatio("#0a0a0a", "#000");
    const above = contrastRatio("#0b0b0b", "#000");
    expect(below).toBeGreaterThan(1);
    expect(above).toBeGreaterThan(below);
    expect(above - below).toBeLessThan(0.05);
  });

  test("pure red on white is WCAG's 4.0 example", () => {
    expect(contrastRatio("#ff0000", "#ffffff")).toBeCloseTo(3.998, 2);
  });
});

describe("parseDeclarations edge cases", () => {
  test("an empty or comment-only sheet declares nothing", () => {
    expect(parseDeclarations("").size).toBe(0);
    expect(parseDeclarations("/* --a: 1; */").size).toBe(0);
  });

  test("ignores ordinary properties", () => {
    const decls = parseDeclarations("body { color: red; --a: 1; font: 13px/1.4 serif; }");
    expect([...decls]).toEqual([["--a", "1"]]);
  });

  test("reads a last declaration with no trailing semicolon", () => {
    expect([...parseDeclarations(":root { --a: 1; --b: 2 }")]).toEqual([
      ["--a", "1"],
      ["--b", "2"],
    ]);
  });

  test("collapses a multi-line value to single spaces", () => {
    const decls = parseDeclarations("--s:\n  0 8px\n  24px\n  red;");
    expect(decls.get("--s")).toBe("0 8px 24px red");
  });

  test("a duplicate across two rules is still a duplicate", () => {
    expect(() => parseDeclarations(":root { --x: 1; } .a { --x: 2; }")).toThrow(
      "parseDeclarations: --x declared twice",
    );
  });

  test("keeps a template-literal interpolation as one value", () => {
    const decls = parseDeclarations(`--zoom:${INTERPOLATION}; --a:1;`);
    expect(decls.get("--zoom")).toBe(INTERPOLATION);
    expect(decls.get("--a")).toBe("1");
  });

  test("keeps a name with digits and hyphens", () => {
    expect(parseDeclarations("--grey-951:#0A0B0F;").get("--grey-951")).toBe("#0A0B0F");
  });

  test("keeps !important in the value", () => {
    expect(parseDeclarations("--a: 1 !important;").get("--a")).toBe("1 !important");
  });

  test("a ; inside parentheses does not split the value", () => {
    expect(parseDeclarations("--u:url(data:image/png;base64,AA); --b:2;").get("--u")).toBe(
      "url(data:image/png;base64,AA)",
    );
  });
});

describe("extractSnapshotRoot edge cases", () => {
  test("ignores a :root that comes before themeCss()", () => {
    const ts = `const early = ":root{ --early:1; }";\nexport function themeCss(){return \`:root{ --late:2; }\`}`;
    const root = extractSnapshotRoot(ts);
    expect(root).toContain("--late:2");
    expect(root).not.toContain("--early");
  });

  test("stops at the first closing brace of the :root", () => {
    const ts = `export function themeCss(){return \`:root{ --a:1; } body{ --b:2; }\`}`;
    expect(extractSnapshotRoot(ts)).not.toContain("--b");
  });

  test("keeps an interpolation containing no brace-breaking text inside the body", () => {
    const ts = `export function themeCss(){return \`:root{ --a:${INTERPOLATION}; --b:2; }\`}`;
    expect(extractSnapshotRoot(ts)).toContain("--b:2");
  });

  test("accepts whitespace between :root and the brace", () => {
    expect(extractSnapshotRoot("function themeCss(){ `:root   {--a:1;}` }")).toContain("--a:1");
  });

  test("an empty :root yields an empty body", () => {
    expect(extractSnapshotRoot("function themeCss(){ `:root{}` }").trim()).toBe("");
  });
});

describe("resolveToken edge cases", () => {
  test("a token that references itself is a cycle", () => {
    expect(() => resolveToken(new Map([["--a", "var(--a)"]]), "--a")).toThrow("cycle");
  });

  test("names the referencing token when a target is missing", () => {
    expect(() =>
      resolveToken(
        new Map([
          ["--a", "var(--b)"],
          ["--b", "var(--gone)"],
        ]),
        "--a",
      ),
    ).toThrow("--gone is not declared (referenced by --b)");
  });

  test("names the starting token when it is itself undeclared", () => {
    expect(() => resolveToken(new Map(), "--nothing")).toThrow("--nothing is not declared");
  });

  test("a literal is its own leaf", () => {
    expect(resolveToken(new Map([["--a", "13px"]]), "--a")).toBe("13px");
  });

  test("a color-mix is a leaf, not followed into its var()", () => {
    const value = "color-mix(in srgb, var(--a) 10%, transparent)";
    expect(
      resolveToken(
        new Map([
          ["--a", "#fff"],
          ["--m", value],
        ]),
        "--m",
      ),
    ).toBe(value);
  });
});

describe("diffRoots edge cases", () => {
  test("a hex that differs only in case is a change", () => {
    expect(diffRoots("--a:#0A0B0F;", "--a:#0a0b0f;").changed).toEqual(["--a"]);
  });

  test("comma spacing is not a change, a changed number is", () => {
    const snapshot = "--s:color-mix(in srgb,var(--b) 35%,transparent);";
    expect(
      diffRoots(snapshot, "--s:color-mix(in srgb, var(--b) 35%, transparent);").changed,
    ).toEqual([]);
    expect(
      diffRoots(snapshot, "--s:color-mix(in srgb, var(--b) 36%, transparent);").changed,
    ).toEqual(["--s"]);
  });

  test("two empty roots do not differ", () => {
    expect(diffRoots("", "")).toEqual({ changed: [], missing: [], extra: [] });
  });

  test("an empty mine misses every snapshot token", () => {
    expect(diffRoots("--a:1; --b:2;", "").missing).toEqual(["--a", "--b"]);
  });

  test("an ignored name that is extra on the other side is not reported", () => {
    expect(diffRoots("--a:1;", "--a:1; --zoom:1;", ["--zoom"]).extra).toEqual([]);
  });

  test("a duplicate in either side throws rather than hiding a drift", () => {
    expect(() => diffRoots("--a:1;", "--a:1; --a:2;")).toThrow("--a declared twice");
    expect(() => diffRoots("--a:1; --a:2;", "--a:1;")).toThrow("--a declared twice");
  });
});
