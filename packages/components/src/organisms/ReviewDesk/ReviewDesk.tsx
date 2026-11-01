import "./ReviewDesk.css";

// `<ReviewDesk/>`: the open PRs of the current selection as a strip of next-action columns
// (review, merge, changes, fix CI, kick CI, rebase, pending) under the sticky head. Collapsed by
// default: its summary already carries the counts, so the closed desk is a one-line review budget.
// A column header toggles that bucket in the pr filter; a card opens the ticket's panel. Pure over
// its props: the open flag and the pr filter arrive as values, and each write (`onDesk`,
// `onPrFilter`, `onSelect`) is a callback the owner supplies. Every word arrives as `labels`.

/** Cards shown per column before the `+n more` link. */
const DESK_MAX = 6;

export interface DeskCardView {
  readonly id: string;
  readonly project: string;
  readonly title: string;
  readonly number: number;
  readonly age: string;
}

export interface DeskColumnView {
  /** The next-action bucket, e.g. `review`; also the column's `rb-<bucket>` class. */
  readonly bucket: string;
  readonly glyph: string;
  readonly label: string;
  /** Who acts next; the column's tooltip. */
  readonly who: string;
  readonly cards: readonly DeskCardView[];
}

export interface DeskView {
  readonly columns: readonly DeskColumnView[];
  readonly open: number;
  readonly ready: number;
  readonly oldest: string | undefined;
}

/** The words of the desk. */
export interface ReviewDeskLabels {
  /** The summary's lead, e.g. `review desk`. */
  readonly title: string;
  /** Follows the open count, e.g. `open PR`. */
  readonly open: string;
  /** Follows the ready count, e.g. `merge-ready`. */
  readonly ready: string;
  /** Precedes the oldest age, e.g. `oldest`. */
  readonly oldest: string;
  /** The hint at the end of the summary. */
  readonly note: string;
  /** Shown when the selection has no column. */
  readonly empty: string;
  /** The link under a full column, e.g. `+2 more ↓`. */
  readonly more: (count: number) => string;
}

export interface ReviewDeskProps {
  readonly view: DeskView;
  readonly labels: ReviewDeskLabels;
  /** The hue class number of a project's chip. */
  readonly hueOf: (project: string) => number;
  readonly open: boolean;
  /** The buckets currently filtered on. */
  readonly prFilter: readonly string[];
  /** Toggles the desk open or closed. */
  readonly onDesk: () => void;
  /** Toggles one bucket in the pr filter. */
  readonly onPrFilter: (bucket: string) => void;
  /** Opens the panel on a card's ticket. */
  readonly onSelect: (id: string) => void;
}

export function ReviewDesk({
  view,
  labels,
  hueOf,
  open,
  prFilter: f,
  onDesk,
  onPrFilter,
  onSelect,
}: ReviewDeskProps) {
  const { columns: cols, open: openCount, ready, oldest } = view;
  return (
    <details class="grp grp-tight bl-desk" open={open}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is a native, keyboard-operable disclosure control, fully controlled here. */}
      <summary
        class="grp-hd bl-desk-sum"
        onClick={(e) => {
          e.preventDefault();
          onDesk();
        }}
      >
        <i class="caret">▸</i>
        <b>{labels.title}</b>
        <span class="bl-desk-n">
          {openCount} {labels.open}
        </span>
        <span class="bl-desk-n ok">
          {ready} {labels.ready}
        </span>
        {oldest !== undefined && (
          <span class="bl-desk-n">
            {labels.oldest} {oldest}
          </span>
        )}
        <span class="bl-desk-mini">
          {cols.map((c) => (
            <em key={c.bucket} class={`rb-${c.bucket}`} title={c.who}>
              {c.glyph} {c.cards.length}
            </em>
          ))}
        </span>
        <span class="bl-section-note">{labels.note}</span>
      </summary>
      {open && (
        <div class="bl-desk-cols">
          {cols.length === 0 && <p class="bl-empty bl-desk-empty">{labels.empty}</p>}
          {cols.map((c) => {
            const on = f.includes(c.bucket);
            return (
              <div
                key={c.bucket}
                class={`bl-desk-col rb-${c.bucket}${on ? " on" : ""}`}
                data-bucket={c.bucket}
              >
                <button
                  type="button"
                  class="bl-desk-hd"
                  title={c.who}
                  onClick={() => onPrFilter(c.bucket)}
                >
                  <i>{c.glyph}</i>
                  <b>{c.label}</b>
                  <span class="grp-n bl-desk-count">{c.cards.length}</span>
                </button>
                {c.cards.slice(0, DESK_MAX).map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    class="bl-desk-card"
                    data-row={r.id}
                    title={r.title}
                    onClick={() => onSelect(r.id)}
                  >
                    <span class={`bl-proj bl-desk-proj hue-${hueOf(r.project)}`}>{r.project}</span>
                    <b>#{r.number}</b>
                    <em>{r.age}</em>
                    <span class="bl-desk-title">{r.title}</span>
                  </button>
                ))}
                {c.cards.length > DESK_MAX && (
                  <button type="button" class="bl-desk-more" onClick={() => onPrFilter(c.bucket)}>
                    {labels.more(c.cards.length - DESK_MAX)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </details>
  );
}
