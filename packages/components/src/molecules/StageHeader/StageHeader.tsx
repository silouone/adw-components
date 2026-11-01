import "./StageHeader.css";

// `<StageHeader/>`: the one-line breadcrumb above the board. A pure render of its
// crumbs; it never restates the brand or the tabs. With a run open on the stage it gains
// the run segment and its two controls. The copy is a callback, the `copied` flash is
// interface state, and the words (`labels`) arrive as props.

import { Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

const COPIED_MS = 1200;

/** One segment of the line: a small `eyebrow` over its `value`, an optional `glyph` before it. */
export interface Crumb {
  readonly eyebrow: string;
  readonly value: string;
  readonly glyph?: string;
}

/** The words of the run segment and its controls. */
export interface StageHeaderLabels {
  /** The eyebrow of the run segment. */
  readonly run: string;
  /** The name and tooltip of the back button. */
  readonly back: string;
  /** The text of the full screen chip, after its glyph. */
  readonly fullScreen: string;
  /** The tooltip of the full screen chip. */
  readonly fullScreenHint: string;
  /** Before the run id in the name and tooltip of the copy button. */
  readonly copy: string;
  /** The flash that replaces the copy glyph after a click. */
  readonly copied: string;
}

export interface StageHeaderProps {
  readonly crumbs: readonly Crumb[];
  /** The run open on the stage, if any: its full id and the label to show. */
  readonly run?: { readonly runId: string; readonly label: string };
  readonly labels: StageHeaderLabels;
  readonly onCloseRun: () => void;
  readonly onFullScreen: () => void;
  readonly onCopy: (text: string) => void;
  readonly flashMs?: number;
}

function CopyRunId({
  runId,
  labels,
  onCopy,
  flashMs,
}: {
  readonly runId: string;
  readonly labels: Pick<StageHeaderLabels, "copy" | "copied">;
  readonly onCopy: (text: string) => void;
  readonly flashMs: number;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const click = (): void => {
    onCopy(runId);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), flashMs);
  };

  return (
    <button
      type="button"
      class="cr-copy"
      aria-label={`${labels.copy} ${runId}`}
      title={`${labels.copy} ${runId}`}
      onClick={click}
    >
      {copied ? labels.copied : "⧉"}
    </button>
  );
}

export function StageHeader({
  crumbs,
  run,
  labels,
  onCloseRun,
  onFullScreen,
  onCopy,
  flashMs = COPIED_MS,
}: StageHeaderProps) {
  return (
    <div class="crumb cr-bar">
      {run !== undefined && (
        <button
          type="button"
          class="cr-back"
          aria-label={labels.back}
          title={labels.back}
          onClick={onCloseRun}
        >
          ◂
        </button>
      )}
      {crumbs.map((c, i) => (
        <Fragment key={c.eyebrow}>
          {i > 0 && <span class="sep">›</span>}
          <span class="cr">
            <i class="cr-eb">{c.eyebrow}</i>
            <b class="cr-v">
              {c.glyph === undefined ? "" : `${c.glyph} `}
              {c.value}
            </b>
          </span>
        </Fragment>
      ))}
      {run !== undefined && (
        <>
          <span class="sep">›</span>
          <span class="cr">
            <i class="cr-eb">{labels.run}</i>
            <b class="cr-v">{run.label}</b>
            <CopyRunId runId={run.runId} labels={labels} onCopy={onCopy} flashMs={flashMs} />
          </span>
          <button
            type="button"
            class="cr-full"
            title={labels.fullScreenHint}
            onClick={onFullScreen}
          >
            ⤢ {labels.fullScreen}
          </button>
        </>
      )}
    </div>
  );
}
