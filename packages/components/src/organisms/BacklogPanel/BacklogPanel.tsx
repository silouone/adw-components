import "./BacklogPanel.css";

// `<BacklogPanel/>`: the drawer opened by a row. Top to bottom: title, state badge and actions;
// why it is stuck (the full reason, or the drift) as an alert; the frontmatter as a compact grid;
// the dep chips; the body (rendered HTML, arriving whole in the view); the attempts ledger. The
// scroll position is a prop read once on mount and written back through `onScroll`, so it
// survives a view-model push. The open/closed flag of the run menu is the panel's own interface
// state. The words arrive as `labels`; the glyphs are the component's.

import { useEffect, useRef, useState } from "preact/hooks";
import { SECTION_GLYPH, type SectionKey } from "../../glyphs";
import { BucketHint } from "../../molecules/BucketHint/BucketHint";
import {
  CopyRunMenu,
  type CopyRunMenuLabels,
  type CopyRunMenuView,
} from "../../molecules/CopyRunMenu/CopyRunMenu";
import { type BacklogDepData, type BacklogRowData, runHrefOf } from "../BacklogRow/BacklogRow";

export interface BacklogPanelView {
  readonly section: SectionKey;
  /** The run-copy menu's view: the dispatch lines, one per gate host. */
  readonly copy: CopyRunMenuView;
  /** Which buckets a run draws on; `undefined` = nothing shown. */
  readonly bucketHint: string | undefined;
  /** The whole tidied reason of a blocked row. */
  readonly reasonText: string;
  /** One short id per dep of the row. */
  readonly depIds: readonly string[];
  /** The body, already rendered to HTML. */
  readonly bodyHtml: string;
  /** One outcome tone per entry of the row's attempts list. */
  readonly attemptTones: readonly string[];
}

/** The names of the frontmatter cells. */
export interface BacklogPanelFieldLabels {
  readonly id: string;
  readonly project: string;
  readonly kind: string;
  readonly status: string;
  readonly lane: string;
  readonly priority: string;
  readonly state: string;
  readonly created: string;
  readonly model: string;
  readonly review: string;
  readonly parseError: string;
}

/** The words of the panel that its view does not carry. */
export interface BacklogPanelLabels {
  /** The close button's tooltip, e.g. `close (esc)`. */
  readonly close: string;
  /** The copy-id button's text after the `⧉`, e.g. `copy id`. */
  readonly copyId: string;
  /** What the owner calls the copied id, e.g. `id`. */
  readonly id: string;
  /** The last-run link's text after the `↗`, e.g. `last run`. */
  readonly lastRun: string;
  /** The PR link's word, e.g. `PR`. */
  readonly pr: string;
  /** The head of the drift alert, e.g. `ledger drift`. */
  readonly drift: string;
  /** The head of the blocked alert, e.g. `why blocked — last run`. */
  readonly blocked: string;
  /** The head of the attempts ledger, e.g. `attempts`. */
  readonly attempts: string;
  readonly fields: BacklogPanelFieldLabels;
  /** The run-copy menu's own words. */
  readonly copyMenu: CopyRunMenuLabels;
}

export interface BacklogPanelProps {
  readonly row: BacklogRowData;
  readonly token: string;
  readonly onClose: () => void;
  readonly view: BacklogPanelView;
  readonly labels: BacklogPanelLabels;
  /** Records the run-copy menu's host pick for the row's project. */
  readonly onPickHost: (host: string | undefined) => void;
  readonly hue?: number;
  /** Where the owner last saw this drawer scrolled; applied once on mount. */
  readonly scrollTop: number;
  readonly onScroll: (top: number) => void;
  /** Every copy (the id button, the run menu) goes through the owner. */
  readonly onCopy: (text: string, label: string) => void;
}

/** A dep chip's class: a met dep is neutral, never coloured as a blocker. */
function depClassOf(dep: BacklogDepData): string {
  if (dep.met) return "bl-dep dep-met";
  return dep.hard ? "bl-dep dep-hard" : "bl-dep dep-soft";
}

function Field({ k, v }: { readonly k: string; readonly v: string }) {
  return (
    <div class="bl-fm-cell">
      <dt>{k}</dt>
      <dd title={v}>{v}</dd>
    </div>
  );
}

export function BacklogPanel({
  row,
  token,
  onClose,
  view,
  labels,
  onPickHost,
  hue = 0,
  scrollTop,
  onScroll,
  onCopy,
}: BacklogPanelProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const section = view.section;
  const f = labels.fields;

  useEffect(() => {
    if (elRef.current !== null) elRef.current.scrollTop = scrollTop;
  }, []);

  return (
    <aside
      class="bl-panel"
      ref={elRef}
      onScroll={(e) => {
        onScroll(e.currentTarget.scrollTop);
      }}
    >
      <div class="bl-panel-head">
        <span class="bl-panel-title">{row.title}</span>
        <button type="button" class="bl-panel-x" title={labels.close} onClick={onClose}>
          ✕
        </button>
      </div>
      <div class="bl-panel-id">
        <span class={`bl-state s-${section}`}>
          {SECTION_GLYPH[section]} {section}
        </span>
        <span class={`bl-proj hue-${hue}`}>{row.project}</span>
        <span class="bl-panel-fullid">{row.id}</span>
      </div>
      <div class="bl-panel-acts">
        <button
          type="button"
          class="bl-btn bl-panel-btn bl-copy"
          onClick={() => onCopy(row.id, labels.id)}
        >
          ⧉ {labels.copyId}
        </button>
        {row.kind === "ticket" && !row.closed && (
          <CopyRunMenu
            view={view.copy}
            className="bl-btn bl-panel-btn bl-run"
            labels={labels.copyMenu}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onPickHost={onPickHost}
            onCopy={onCopy}
            rootRef={menuRef}
          />
        )}
        {row.kind === "ticket" && !row.closed && <BucketHint text={view.bucketHint} />}
        {row.lastRunId !== undefined && (
          <a class="bl-btn bl-panel-btn bl-open" href={runHrefOf(row.lastRunId, token)}>
            ↗ {labels.lastRun}
          </a>
        )}
        {row.lastPr !== undefined && (
          <a class="bl-btn bl-panel-btn bl-pr" href={row.lastPr} target="_blank" rel="noreferrer">
            {labels.pr}
          </a>
        )}
      </div>

      {row.drift !== undefined && (
        <div class="bl-alert warn">
          <b>{labels.drift}</b>
          {row.drift}
        </div>
      )}
      {row.drift === undefined && row.state === "blocked" && (
        <div class="bl-alert bad">
          <b>{labels.blocked}</b>
          {view.reasonText}
        </div>
      )}

      <dl class="bl-panel-fields">
        <Field k={f.id} v={row.id} />
        <Field k={f.project} v={row.project} />
        <Field k={f.kind} v={row.kind} />
        <Field k={f.status} v={row.status} />
        {row.lane !== undefined && <Field k={f.lane} v={row.lane} />}
        {row.priority !== undefined && <Field k={f.priority} v={String(row.priority)} />}
        {row.state !== undefined && <Field k={f.state} v={row.state} />}
        {row.created !== undefined && <Field k={f.created} v={row.created} />}
        {row.model !== undefined && <Field k={f.model} v={row.model} />}
        {row.review !== undefined && <Field k={f.review} v={String(row.review)} />}
        {row.parseError !== undefined && <Field k={f.parseError} v={row.parseError} />}
      </dl>

      {row.deps.length > 0 && (
        <div class="bl-deps">
          {row.deps.map((dep, i) => (
            <i
              key={dep.id}
              class={depClassOf(dep)}
              data-dep-id={dep.id}
              title={`${dep.id} — ${dep.status}`}
            >
              {view.depIds[i]}
            </i>
          ))}
        </div>
      )}

      <div class="bl-panel-body" dangerouslySetInnerHTML={{ __html: view.bodyHtml }} />

      {row.attemptsList.length > 0 && (
        <div class="bl-ledger">
          <div class="bl-ledger-head">{labels.attempts}</div>
          {row.attemptsList.map((a, i) => (
            <div key={a.runId} class="bl-ledger-row">
              <span class={`o-${view.attemptTones[i]}`}>{a.outcome}</span>
              <a href={runHrefOf(a.runId, token)} title={a.runId}>
                {a.runId}
              </a>
              {a.pr !== undefined && (
                <a class="bl-pr" href={a.pr} target="_blank" rel="noreferrer">
                  {labels.pr}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
