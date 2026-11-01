import "./GanttStrip.css";

// The gantt strip: the run header + gantt collapsed to one line that still informs — state
// pill, ticket id, a mini timeline with a span per lane, the failure chip, the duration.
//
// Pure: a `GanttStripView` in, markup out; the click reports `onFullScreen` like the header it
// replaces. The clock arrives formatted.

import {
  FailureChip,
  isToggleClick,
  type RunIdentity,
  type RunStatusView,
} from "../RunHeader/RunHeader";

/** One lane's span on the strip, in percent of the run window. */
export interface LaneSpan {
  readonly role: string;
  readonly left: number;
  readonly width: number;
  readonly failed: boolean;
}

export interface GanttStripView extends RunStatusView {
  /** The run's duration, or its elapsed time while it runs, formatted. */
  readonly clock: string;
  readonly spans: readonly LaneSpan[];
}

export interface GanttStripProps {
  readonly header: Pick<RunIdentity, "ticketId" | "gate">;
  readonly strip: GanttStripView;
  readonly failureScope?: string;
  /** The tooltip of the failure chip when it opens the failing node. */
  readonly failureTitle: string;
  readonly onFullScreen: () => void;
  readonly onScope: (scope: string) => void;
}

export function GanttStrip({
  header,
  strip,
  failureScope,
  failureTitle,
  onFullScreen,
  onScope,
}: GanttStripProps) {
  const failedNode = strip.failedNode;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: same reason
    <header
      class="gantt-strip"
      onClick={(e) => {
        if (isToggleClick(e.target)) onFullScreen();
      }}
    >
      <span class="chev gs-chev" aria-hidden="true">
        ▸
      </span>
      <span class={`st gs-st ${strip.cls}`}>{strip.text}</span>
      <span class="gs-id" title={header.ticketId}>
        {header.ticketId}
      </span>
      <span class="gs-track">
        {strip.spans.map((s) => (
          <i
            key={s.role}
            class={`gs-span${s.failed ? " bad" : ""}`}
            title={s.role}
            style={`left:${s.left}%;width:${s.width}%`}
          />
        ))}
      </span>
      {failedNode !== undefined && (
        <FailureChip
          node={failedNode}
          {...(header.gate !== undefined ? { gate: header.gate } : {})}
          {...(failureScope !== undefined ? { failureScope } : {})}
          title={failureTitle}
          onScope={onScope}
        />
      )}
      <b class="gs-dur">{strip.clock}</b>
    </header>
  );
}
