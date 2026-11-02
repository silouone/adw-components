import "./BoardGrid.css";

import type { ComponentChildren } from "preact";

// `<BoardGrid/>`: the board's frame, top to bottom: the notices, the empty paragraph, the phase legend,
// the ledger's column header, then the sections in a column and the message shown when a filter hides
// every ticket. It places slots and counts nothing: the caller decides which parts exist, and
// passes the sections as keyed children (a section keeps its open flag across an update by its key).
// Every word arrives as a prop.

export interface BoardGridProps {
  readonly notices: readonly string[];
  /** The body of the "no runs banked yet" paragraph; absent → no paragraph. */
  readonly empty?: ComponentChildren;
  /** The phase legend, above the columns. */
  readonly legend?: ComponentChildren;
  /** The ledger's column names, one cell each; absent → no header row. */
  readonly columns?: readonly string[];
  /** The message for a filter that hides every ticket; absent → none. */
  readonly noMatch?: string | undefined;
  /** The keyed sections; absent → no grid. */
  readonly children?: ComponentChildren;
}

export function BoardGrid({ notices, empty, legend, columns, noMatch, children }: BoardGridProps) {
  return (
    <>
      {notices.length > 0 && (
        <ul class="board-grid-notices">
          {notices.map((n, i) => (
            <li key={i}>⚠ {n}</li>
          ))}
        </ul>
      )}
      {empty !== undefined && <p class="board-grid-empty">{empty}</p>}
      {legend}
      {columns !== undefined && (
        <div class="board-grid-cols">
          {columns.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      )}
      {children !== undefined && <div class="board-grid">{children}</div>}
      {noMatch !== undefined && <p class="board-grid-no-match">{noMatch}</p>}
    </>
  );
}
