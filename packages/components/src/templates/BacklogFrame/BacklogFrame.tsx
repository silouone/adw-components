import "./BacklogFrame.css";

import type { ComponentChildren, RefObject } from "preact";

// `<BacklogFrame/>`: the backlog's frame: the dropped-stream notice above the root, and inside it the
// sticky head (the project chips and filters) followed by the review desk, the next-up row, the
// sections, the ticket panel and the graph drawer. It places slots and knows no row, no chip and no
// filter. Pure over its props: the page measures its sticky head through `headRef` and hands the
// offsets down as custom properties in `style`.

export interface BacklogFrameProps {
  readonly stale: boolean;
  /** The words of the dropped-stream notice; shown when `stale`. */
  readonly staleNotice?: string | undefined;
  /** Custom properties for the root, e.g. `--bl-head-top`. */
  readonly style?: Readonly<Record<string, string | number>>;
  /** The page measures the sticky head through it. */
  readonly headRef?: RefObject<HTMLDivElement> | undefined;
  /** The sticky head: project chips and filters. */
  readonly chips: ComponentChildren;
  readonly desk?: ComponentChildren;
  readonly hero?: ComponentChildren;
  /** The column header, the empty and loading notes, and the sections. */
  readonly sections: ComponentChildren;
  readonly panel?: ComponentChildren;
  readonly drawer?: ComponentChildren;
}

export function BacklogFrame({
  stale,
  staleNotice,
  style,
  headRef,
  chips,
  desk,
  hero,
  sections,
  panel,
  drawer,
}: BacklogFrameProps) {
  return (
    <>
      {stale && staleNotice !== undefined && (
        <p class="backlog-frame-notice" role="status">
          {staleNotice}
        </p>
      )}
      <div class={stale ? "backlog-frame backlog-frame-stale" : "backlog-frame"} style={style}>
        <div class="backlog-frame-head" {...(headRef !== undefined && { ref: headRef })}>
          {chips}
        </div>
        {desk}
        {hero}
        {sections}
        {panel}
        {drawer}
      </div>
    </>
  );
}
