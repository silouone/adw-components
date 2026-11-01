import "./FocusPanel.css";

// `<FocusPanel/>`: rail 2 open on a selected ticket — a sticky tab row, the header in the board's
// voice (mono, a 2 px lane-hue rule down its left edge), the action bar, then the active tab. It
// reads and writes no signal: the tab and close gestures are callbacks; the view, the active tab's
// body (see `./focusTabs`) and `token` are props, never read from the clock or the page. The words
// arrive as `labels`.

import type { ComponentChildren } from "preact";
import { CopyId } from "../../atoms/CopyId/CopyId";
import type { FocusTab } from "../../glyphs";
import {
  ActionBar,
  type ActionBarLabels,
  type ActionBarView,
  type PauseAction,
} from "../ActionBar/ActionBar";

export interface FocusHeader {
  readonly project: string;
  readonly lane: string;
  readonly hue: number;
  readonly provider: string;
  readonly providerGlyph: string;
  readonly startedAgo: string;
  readonly startedClock: string;
  readonly short: string;
  readonly suffix: string;
  readonly fullId: string;
  readonly title: string;
}

export interface StatusLine {
  readonly glyph: string;
  readonly tone: string;
  readonly text: string;
  readonly title: string;
}

export interface FocusPanelView {
  readonly ticketId: string;
  readonly tab: FocusTab;
  readonly tabs: readonly {
    readonly key: FocusTab;
    readonly label: string;
    readonly glyph: string;
    readonly purpose: string;
  }[];
  readonly head: FocusHeader;
  readonly status: StatusLine;
  readonly actions: ActionBarView;
}

/** The words of the panel that its view does not carry. */
export interface FocusPanelLabels extends ActionBarLabels {
  /** The close control's tooltip. */
  readonly close: string;
  /** Before the full id in the copy control's tooltip: `copy <id>`. */
  readonly copyId: string;
}

export interface FocusPanelProps {
  readonly view: FocusPanelView;
  readonly labels: FocusPanelLabels;
  readonly token: string;
  readonly onFocusTab: (tab: FocusTab) => void;
  readonly onFocusOpen: (open: boolean) => void;
  readonly onAction: PauseAction;
  readonly onCopy: (text: string) => void;
  readonly onStage: (stage: "board" | "run") => void;
  /** The rail passes "rail": every restyled element renders `fp-rail`. */
  readonly density?: "rail" | undefined;
  /** The active tab's body, rendered by the page (see `focusBodyOf`). */
  readonly children?: ComponentChildren;
}

export function FocusPanel({
  view,
  labels,
  token,
  onFocusTab,
  onFocusOpen,
  onAction,
  onCopy,
  onStage,
  density,
  children,
}: FocusPanelProps) {
  const { head, status, tab } = view;
  const rail = density === "rail" ? " fp-rail" : "";
  const hue = `--hue:${head.hue}`;
  return (
    <>
      <div class={`fp-tabs${rail}`} role="tablist" style={hue}>
        {view.tabs.map((d) => (
          <button
            key={d.key}
            type="button"
            role="tab"
            class={`fp-tab${rail}${d.key === tab ? " on" : ""}`}
            data-tab={d.key}
            aria-selected={d.key === tab}
            style={hue}
            title={d.purpose}
            onClick={() => onFocusTab(d.key)}
          >
            <span class={`fp-glyph${rail}`}>{d.glyph}</span>
            <span class={`fp-label${rail}`}>{d.label}</span>
          </button>
        ))}
        <button
          type="button"
          class="fp-close"
          title={labels.close}
          onClick={() => onFocusOpen(false)}
        >
          ◨
        </button>
      </div>
      <header class={`fp-head${rail}`} style={hue}>
        <div class={`fp-eyebrow${rail}`}>
          <span>
            {head.project} · {head.lane} · {head.providerGlyph} {head.provider}
          </span>
          <span class="fp-ago" title={head.startedClock}>
            {head.startedAgo}
          </span>
        </div>
        <div class="fp-idline">
          <span class={`fp-short${rail}`}>{head.short}</span>
          {head.suffix !== "" && <span class="fp-suffix">{head.suffix}</span>}
          <CopyId
            ticketId={head.fullId}
            label={`${labels.copyId} ${head.fullId}`}
            copiedLabel={labels.copied}
            onCopy={onCopy}
            shown
          />
        </div>
        {head.title !== "" && (
          <div class={`fp-title${rail}`} title={head.title}>
            {head.title}
          </div>
        )}
        <div class={`fp-status${rail} ${status.tone}`} title={status.title}>
          <span class="fp-beacon">{status.glyph}</span>
          {status.text}
        </div>
        {/* keyed by ticket: an arming or a pending post must not follow the
            selection to another ticket */}
        <ActionBar
          key={view.ticketId}
          view={view.actions}
          labels={labels}
          token={token}
          onAction={onAction}
          onCopy={onCopy}
          onStage={onStage}
          density={density}
        />
      </header>
      {children}
    </>
  );
}
