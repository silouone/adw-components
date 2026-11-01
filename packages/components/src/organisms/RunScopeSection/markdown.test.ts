import { describe, expect, test } from "bun:test";
import { mdToHtml } from "./markdown";

describe("mdToHtml — headings", () => {
  test.each([1, 2, 3, 4, 5, 6])("%s #'s -> h%s", (n) => {
    const html = mdToHtml(`${"#".repeat(n)} Title`);
    expect(html).toBe(`<h${n}>Title</h${n}>`);
  });
});

describe("mdToHtml — fenced code", () => {
  test("a fenced block renders as one <pre>, fence markers excluded, content escaped", () => {
    const html = mdToHtml("```\nconst x = 1 < 2;\n```");
    expect(html).toBe('<pre class="rp-code">const x = 1 &lt; 2;</pre>');
  });

  test("an unterminated fence at EOF still emits its <pre>", () => {
    const html = mdToHtml("```\nunclosed");
    expect(html).toBe('<pre class="rp-code">unclosed</pre>');
  });
});

describe("mdToHtml — inline bold/italic", () => {
  test("bold", () => {
    expect(mdToHtml("this is **bold** text")).toBe("<p>this is <strong>bold</strong> text</p>");
  });

  test("italic", () => {
    expect(mdToHtml("this is *italic* text")).toBe("<p>this is <em>italic</em> text</p>");
  });
});

describe("mdToHtml — links", () => {
  test("a markdown link renders as a target-blank anchor", () => {
    expect(mdToHtml("see [the docs](https://example.com/docs)")).toBe(
      '<p>see <a href="https://example.com/docs" target="_blank" rel="noreferrer">the docs</a></p>',
    );
  });
});

describe("mdToHtml — structural elements", () => {
  test.each(["---", "***", "___"])("a lone %s renders <hr>", (rule) => {
    expect(mdToHtml(rule)).toBe("<hr>");
  });

  test("a blockquote line", () => {
    expect(mdToHtml("> quoted text")).toBe("<blockquote>quoted text</blockquote>");
  });

  test.each(["- item", "* item", "1. item"])("a list item (%s) renders as rp-li", (line) => {
    expect(mdToHtml(line)).toBe('<div class="rp-li">item</div>');
  });

  test("a pipe-table row renders as a monospace rp-tr line, not a real table", () => {
    expect(mdToHtml("| a | b |")).toBe('<div class="rp-tr">| a | b |</div>');
  });
});

describe("mdToHtml — plain paragraphs", () => {
  test("a single line of plain text", () => {
    expect(mdToHtml("hello world")).toBe("<p>hello world</p>");
  });

  test("consecutive non-blank lines soft-wrap into one paragraph", () => {
    expect(mdToHtml("line one\nline two")).toBe("<p>line one line two</p>");
  });

  test("a blank line separates two paragraphs", () => {
    expect(mdToHtml("first\n\nsecond")).toBe("<p>first</p><p>second</p>");
  });
});

describe("mdToHtml — escaping", () => {
  test("HTML-special characters in plain text are escaped", () => {
    expect(mdToHtml("<script>&fake</script>")).toBe(
      "<p>&lt;script&gt;&amp;fake&lt;/script&gt;</p>",
    );
  });

  test("HTML-special characters inside an unterminated fence are still escaped", () => {
    expect(mdToHtml("```\n<script>alert(1)</script>")).toBe(
      '<pre class="rp-code">&lt;script&gt;alert(1)&lt;/script&gt;</pre>',
    );
  });
});

describe("mdToHtml — boundary/degenerate input", () => {
  test("an empty string renders nothing", () => {
    expect(mdToHtml("")).toBe("");
  });

  test("a string of only whitespace/blank lines renders nothing", () => {
    expect(mdToHtml("\n\n  \n")).toBe("");
  });
});

describe("mdToHtml — inline code", () => {
  test("backtick-wrapped text renders as <code>", () => {
    expect(mdToHtml("run `bun test` to check")).toBe("<p>run <code>bun test</code> to check</p>");
  });
});

describe("mdToHtml — blockquote without a trailing space", () => {
  test("'>text' (no space after the marker) still renders as a blockquote", () => {
    expect(mdToHtml(">text")).toBe("<blockquote>text</blockquote>");
  });
});

describe("mdToHtml — links with plain http", () => {
  test("a non-https http:// link still matches (the regex is 'https?:')", () => {
    expect(mdToHtml("[legacy](http://example.com)")).toBe(
      '<p><a href="http://example.com" target="_blank" rel="noreferrer">legacy</a></p>',
    );
  });
});

// --- adw-backlog-03 R8: ticket bodies are hard-wrapped at ~78 cols ---------

describe("mdToHtml — hard-wrapped source reflows (adw-backlog-03 R8)", () => {
  test("an indented continuation line joins its list item", () => {
    expect(mdToHtml("- **R1** the first\n  wrapped half\n- R2")).toBe(
      '<div class="rp-li"><strong>R1</strong> the first wrapped half</div>' +
        '<div class="rp-li">R2</div>',
    );
  });

  test("a continuation that is itself a list item, quote, table row or heading does not join", () => {
    expect(mdToHtml("- a\n  - b")).toBe('<div class="rp-li">a</div><div class="rp-li">b</div>');
    expect(mdToHtml("- a\n  | x |")).toBe(
      '<div class="rp-li">a</div><div class="rp-tr">  | x |</div>',
    );
  });

  test("consecutive quote lines are one blockquote", () => {
    expect(mdToHtml("> one\n> two\n> three")).toBe("<blockquote>one two three</blockquote>");
  });

  test("an empty `>` line splits the quote into two", () => {
    expect(mdToHtml("> one\n>\n> two")).toBe(
      "<blockquote>one</blockquote><blockquote>two</blockquote>",
    );
  });

  test("table rows inside a quote stay one per line", () => {
    expect(mdToHtml("> | a |\n> | b |")).toBe(
      "<blockquote>| a |</blockquote><blockquote>| b |</blockquote>",
    );
  });
});

describe("mdToHtml — task list items (adw-backlog-03 R8)", () => {
  test("`- [ ]` renders an empty checkbox, not the literal brackets", () => {
    expect(mdToHtml("- [ ] **R1** do it")).toBe(
      '<div class="rp-li rp-task"><span class="rp-cb"></span><strong>R1</strong> do it</div>',
    );
  });
  test("`- [x]` / `- [X]` render a checked box", () => {
    const checked =
      '<div class="rp-li rp-task rp-task-done"><span class="rp-cb">✓</span>done</div>';
    expect(mdToHtml("- [x] done")).toBe(checked);
    expect(mdToHtml("- [X] done")).toBe(checked);
  });
  test("a wrapped task item still joins its continuation", () => {
    expect(mdToHtml("- [ ] first\n      second")).toBe(
      '<div class="rp-li rp-task"><span class="rp-cb"></span>first second</div>',
    );
  });
});

describe("mdToHtml — quotes never escape an attribute", () => {
  test("a quoted link URL is encoded inside href and plain quotes become &quot;", () => {
    const html = mdToHtml('[x](https://a/"onmouseover="alert(1))');
    expect(html).not.toContain('"onmouseover=');
    expect(html.match(/href=/g)?.length).toBe(1);
    expect(/href="([^"]*)"/.exec(html)?.[1]).toBe("https://a/&quot;onmouseover=&quot;alert(1");
    expect(html).toBe(
      '<p><a href="https://a/&quot;onmouseover=&quot;alert(1" target="_blank" rel="noreferrer">x</a>)</p>',
    );
    expect(mdToHtml('say "hi"')).toBe("<p>say &quot;hi&quot;</p>");
  });
});
