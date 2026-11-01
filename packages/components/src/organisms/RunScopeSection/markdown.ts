// A small, dependency-free, offline-safe markdown renderer: headings, fenced code,
// bold/italic, links, blockquotes, lists, hr, and pipe-table rows rendered as monospace
// lines. Pure and import-free: every input character that is markup is escaped first.

export function mdToHtml(src: string): string {
  const esc = (t: string): string =>
    t
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const inline = (t: string): string =>
    esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(
        /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      );

  const out: string[] = [];
  const lines = src.split("\n");
  let fence: string[] | null = null;
  let buf: string[] = [];
  // An open list item or quote whose hard-wrapped source continues on the
  // next line (adw-backlog-03 R8) — held until something else starts.
  let item: string[] | null = null;
  let quote: string[] | null = null;

  const flushItem = (): void => {
    if (item === null) return;
    const text = item.join(" ");
    const task = text.match(/^\[( |x|X)\]\s*(.*)$/);
    if (task?.[2] !== undefined) {
      out.push(
        task[1] === " "
          ? `<div class="rp-li rp-task"><span class="rp-cb"></span>${inline(task[2])}</div>`
          : `<div class="rp-li rp-task rp-task-done"><span class="rp-cb">✓</span>${inline(task[2])}</div>`,
      );
    } else {
      out.push(`<div class="rp-li">${inline(text)}</div>`);
    }
    item = null;
  };
  const flushQuote = (): void => {
    if (quote === null) return;
    out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
    quote = null;
  };
  const flush = (): void => {
    flushItem();
    flushQuote();
    if (buf.length) {
      out.push(`<p>${inline(buf.join(" "))}</p>`);
      buf = [];
    }
  };

  for (const line of lines) {
    const f = line.match(/^\s*```(.*)$/);
    if (f) {
      if (fence === null) {
        flush();
        fence = [];
      } else {
        out.push(`<pre class="rp-code">${esc(fence.join("\n"))}</pre>`);
        fence = null;
      }
      continue;
    }
    if (fence !== null) {
      fence.push(line);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h?.[1] !== undefined && h[2] !== undefined) {
      flush();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flush();
      out.push("<hr>");
      continue;
    }
    const q = line.match(/^\s*>\s?(.*)$/);
    if (q?.[1] !== undefined) {
      const text = q[1].trim();
      // Consecutive quote lines are one quote; an empty `>` line or a
      // table row ends it (table rows stay one per line).
      const joins =
        quote !== null &&
        text !== "" &&
        !text.startsWith("|") &&
        !(quote.at(-1) ?? "").startsWith("|");
      if (joins && quote !== null) {
        quote.push(text);
        continue;
      }
      flush();
      if (text !== "") quote = [text];
      continue;
    }
    const li = line.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (li?.[2] !== undefined) {
      flush();
      item = [li[2]];
      continue;
    }
    // An indented plain line under an open list item is its hard-wrapped
    // continuation (a nested marker, quote, table row or heading is not).
    if (item !== null && /^\s{2,}\S/.test(line) && !/^\s*[|#]/.test(line)) {
      item.push(line.trim());
      continue;
    }
    if (/^\s*\|/.test(line)) {
      flush();
      out.push(`<div class="rp-tr">${inline(line)}</div>`);
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line.trim());
  }

  flush();
  if (fence !== null) {
    out.push(`<pre class="rp-code">${esc(fence.join("\n"))}</pre>`);
  }
  return out.join("");
}
