import "./RunScopeSection.css";

// `<RunScopeSection/>`: the run scope's own pane — the initial ticket beside the agent's final
// output, two panes each scrolling on its own.
//
// `mdOn` decides which of `<pre class="rp-pre">` / `<div class="rp-md">` renders, never both.
// `mdToHtml`'s output is real HTML (headings, `<pre>`, links), so this is the one deliberate
// `dangerouslySetInnerHTML` in the library: the helper escapes every markup character first.

import type { PromptLabels, PromptView } from "../Drawer/Drawer";
import { mdToHtml } from "./markdown";

/** The run's ticket and its final report, as the journal kept them. */
export interface RunSummaryView {
  readonly ticket: PromptView;
  readonly report: PromptView;
}

export interface RunScopeLabels extends PromptLabels {
  readonly ticketTitle: string;
  readonly reportTitle: string;
  /** The heading of a part that is not there. */
  readonly notAvailable: string;
  /** The line under it when no reason was recorded. */
  readonly noReason: string;
  /** The heading of a part whose content does not match its hash. */
  readonly contentMismatch: string;
}

export interface RunScopeSectionProps {
  readonly summary: RunSummaryView;
  readonly mdOn: boolean;
  readonly labels: RunScopeLabels;
}

function SummaryPart({
  part,
  mdOn,
  labels,
}: {
  readonly part: PromptView;
  readonly mdOn: boolean;
  readonly labels: RunScopeLabels;
}) {
  if (part.status === "not-persisted") {
    return (
      <div class="rp-gap">
        <b>{labels.notAvailable}</b>
        <span>{part.reason ?? labels.noReason}</span>
      </div>
    );
  }
  if (part.status === "mismatch") {
    return (
      <div class="rp-gap">
        <b>{labels.contentMismatch}</b>
        <span>
          {labels.expected} {part.expectedBytes} {labels.bytes} ({labels.hash} {part.expectedHash}),{" "}
          {labels.actual} {part.actualBytes} {labels.bytes} ({labels.hash} {part.actualHash})
        </span>
      </div>
    );
  }
  if (mdOn) {
    return <div class="rp-md" dangerouslySetInnerHTML={{ __html: mdToHtml(part.text) }} />;
  }
  return <pre class="rp-pre">{part.text}</pre>;
}

export function RunScopeSection({ summary, mdOn, labels }: RunScopeSectionProps) {
  return (
    <div class="rp-s">
      <div class="rp-split">
        <div class="rp-s2">
          <header class="rp-sh">
            <b>{labels.ticketTitle}</b>
          </header>
          <div class="rp-sb">
            <SummaryPart part={summary.ticket} mdOn={mdOn} labels={labels} />
          </div>
        </div>
        <div class="rp-s2">
          <header class="rp-sh">
            <b>{labels.reportTitle}</b>
          </header>
          <div class="rp-sb">
            <SummaryPart part={summary.report} mdOn={mdOn} labels={labels} />
          </div>
        </div>
      </div>
    </div>
  );
}
