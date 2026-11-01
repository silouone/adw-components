import "./BacklogRow.css";

// `<BacklogRow/>`: one backlog row, pure over its props. A fixed column grid — glyph · project ·
// id · title · lane · P · why here · last run · actions — every column a direct child, so the
// parent's `grid-template-columns` lines them up across rows and sections. What the row says is
// in its view (why line, waiting deps, dispatch line, last-run text, PR cell); the words that are
// not in the view arrive as `labels`. The owner copies and selects; the row only reports.

import { SECTION_GLYPH, type SectionKey } from "../../glyphs";

export interface BacklogDepData {
  readonly id: string;
  readonly status: string;
  /** The dep's PR number, shown in its tooltip. */
  readonly pr?: number | string | undefined;
  /** The dep is done; the panel draws it neutral, never as a blocker. */
  readonly met: boolean;
  /** A hard dep blocks; a soft one only warns. */
  readonly hard: boolean;
}

export interface BacklogAttemptData {
  readonly runId: string;
  readonly outcome: string;
  /** The PR url of this attempt. */
  readonly pr?: string | undefined;
}

/** The backlog row as the library reads it; the factory's wire row maps onto it. */
export interface BacklogRowData {
  readonly id: string;
  readonly project: string;
  readonly title: string;
  readonly kind: "ticket" | "epic" | "manual" | "malformed";
  readonly lane?: string | undefined;
  readonly priority?: number | undefined;
  readonly status: string;
  readonly state?: string | undefined;
  readonly closed: boolean;
  /** `false` = the ticket opts out of review. */
  readonly review?: boolean | undefined;
  readonly deps: readonly BacklogDepData[];
  readonly lastPr?: string | undefined;
  readonly lastRunId?: string | undefined;
  readonly drift?: string | undefined;
  readonly created?: string | undefined;
  readonly model?: string | undefined;
  readonly parseError?: string | undefined;
  readonly attemptsList: readonly BacklogAttemptData[];
}

export interface BacklogPrView {
  readonly number: number;
  readonly url: string | undefined;
  /** The review bucket; it decides the cell's tone (`rb-<bucket>`). */
  readonly bucket: string;
  readonly title: string;
  readonly glyph: string;
  readonly label: string;
  readonly age: string | undefined;
  /** The ticket's own status (blocked, queued) disagrees with the open PR. */
  readonly desync: boolean;
}

export interface BacklogWaitView {
  readonly wave: number;
  readonly deps: readonly {
    readonly id: string;
    /** The dep's short label. */
    readonly label: string;
    /** The dep's section key, for its chip colour. */
    readonly state: string;
  }[];
}

/** The last-run cell: `<outcome> · <age> · ×<attempts>`. */
export interface BacklogLastView {
  readonly outcome: string | undefined;
  readonly tone: string;
  /** Already formatted, e.g. `2h ago`; `undefined` = a run exists, its time does not. */
  readonly age: string | undefined;
  readonly attempts: number;
}

export interface BacklogRowView {
  readonly section: SectionKey;
  readonly idText: string;
  readonly why: { readonly text: string; readonly tone: string };
  readonly waits: BacklogWaitView | undefined;
  /** One joiner per waiting dep. */
  readonly joiners: readonly string[];
  readonly dispatchLine: string;
  /** `undefined` = the row has never run. */
  readonly last: BacklogLastView | undefined;
  readonly pr: BacklogPrView | undefined;
}

/** The words of the row that its view does not carry. */
export interface BacklogRowLabels {
  /** The last-run cell of a row that never ran, e.g. `no runs`. */
  readonly noRuns: string;
  /** After the attempt count in the last-run tooltip, e.g. `attempt(s)`. */
  readonly attempts: string;
  /** The marker of a ticket that opts out of review, e.g. `review: off`. */
  readonly reviewOff: string;
  /** The copy-id button's word, and what the owner calls the copied text, e.g. `id`. */
  readonly id: string;
  /** The copy-id button's tooltip, e.g. `copy id (y)`. */
  readonly copyIdTitle: string;
  /** The run button's text after the `▶`, e.g. `run`. */
  readonly run: string;
  /** The run button's tooltip suffix, e.g. `(c)`. */
  readonly runKey: string;
  /** What the owner calls the copied dispatch line, e.g. `dispatch line`. */
  readonly dispatchLine: string;
  /** The PR link's word, e.g. `PR`. */
  readonly pr: string;
  /** The last-run link's tooltip, e.g. `open the last run`. */
  readonly openLastRun: string;
  /** Between the wave and the waiting deps, e.g. `need`. */
  readonly need: string;
  /** A dep the row's data does not know, in the waiting tooltip, e.g. `unknown`. */
  readonly unknown: string;
}

export interface BacklogRowProps {
  readonly row: BacklogRowData;
  readonly token: string;
  /** Everything derived: section, why line, waiting deps, dispatch line, last run, PR cell. */
  readonly view: BacklogRowView;
  readonly labels: BacklogRowLabels;
  /** The project's colour slot. */
  readonly hue?: number;
  /** The keyboard cursor is on this row. */
  readonly cursor?: boolean;
  /** The panel is open on this row. */
  readonly selected?: boolean;
  /** Roving tabindex: exactly one row of the list is tabbable. */
  readonly tabbable?: boolean;
  /** The row (or Enter on it) opens the panel on this id. */
  readonly onSelect: (id: string) => void;
  /** Every copy button hands its text and label to the owner. */
  readonly onCopy: (text: string, label: string) => void;
}

function glyphOf(row: BacklogRowData, view: BacklogRowView): string {
  if (row.closed) return row.status === "rejected" ? "✕" : "✓";
  return SECTION_GLYPH[view.section];
}

export function runHrefOf(runId: string, token: string): string {
  return `/run?id=${encodeURIComponent(runId)}&token=${encodeURIComponent(token)}`;
}

/** The PR cell: one link, the bucket decides its tone; `⇄` when the ticket's own status
 * disagrees with an open PR. */
function PrCell({ pr }: { readonly pr: BacklogPrView }) {
  const body = (
    <>
      <i>{pr.glyph}</i>
      <b>#{pr.number}</b>
      <span>{pr.label}</span>
      {pr.age !== undefined && <em>{pr.age}</em>}
      {pr.desync && <u>⇄</u>}
    </>
  );
  const cls = `bl-pr-cell rb-${pr.bucket}`;
  return pr.url === undefined ? (
    <span class={cls} title={pr.title}>
      {body}
    </span>
  ) : (
    <a
      class={cls}
      title={pr.title}
      href={pr.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </a>
  );
}

/** Row-level Enter/Space activation: `e.target === e.currentTarget` excludes keydowns that
 * bubble up from an action button, so pressing Enter there does not ALSO open the panel. */
function onRowKeyDown(e: KeyboardEvent, select: () => void) {
  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
    e.preventDefault();
    e.stopPropagation();
    select();
  }
}

function Last({
  last,
  labels,
}: {
  readonly last: BacklogLastView | undefined;
  readonly labels: BacklogRowLabels;
}) {
  if (last === undefined) return <span class="bl-last">{labels.noRuns}</span>;
  return (
    <span class="bl-last" title={`${last.attempts} ${labels.attempts}`}>
      <span class={`o-${last.tone}`}>{last.outcome ?? "—"}</span>
      {` · ${last.age ?? "—"}`}
      {last.attempts > 1 ? ` · ×${last.attempts}` : ""}
    </span>
  );
}

export function BacklogRow({
  row,
  token,
  view,
  labels,
  hue = 0,
  cursor = false,
  selected = false,
  tabbable = true,
  onSelect,
  onCopy,
}: BacklogRowProps) {
  const { why, waits } = view;
  const isTicket = row.kind === "ticket";
  const stop = (e: Event) => e.stopPropagation();
  const cls = `bl-row bl-cols${cursor ? " cur" : ""}${selected ? " sel" : ""}${row.closed ? " closed" : ""}`;

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: this row nests its own <button>s and <a>s — interactive content can't nest inside a <button>, so role="button" + tabIndex + onKeyDown is the real accessible option here. */}
      <div
        class={cls}
        role="button"
        tabIndex={tabbable ? 0 : -1}
        data-row={row.id}
        onClick={() => onSelect(row.id)}
        onKeyDown={(e) => onRowKeyDown(e, () => onSelect(row.id))}
      >
        <i class={`bl-glyph s-${view.section}`}>{glyphOf(row, view)}</i>
        <span class={`bl-proj hue-${hue}`}>{row.project}</span>
        <span class="bl-id" title={row.id}>
          {view.idText}
        </span>
        <span class="bl-title" title={row.title}>
          {row.title}
        </span>
        <span class={`bl-lane lane-${row.lane ?? "none"}`}>{row.lane ?? row.kind}</span>
        <span class={`bl-prio prio-${row.priority ?? "none"}`}>
          {row.priority === undefined ? "" : `P${row.priority}`}
        </span>
        {waits === undefined ? (
          <span class={`bl-why ${why.tone}`} title={why.text}>
            {why.text}
          </span>
        ) : (
          <span
            class={`bl-why ${why.tone}`}
            title={waits.deps
              .map((d) => {
                const dep = row.deps.find((x) => x.id === d.id);
                return `${d.id} — ${dep?.status ?? labels.unknown}${dep?.pr === undefined ? "" : ` (${labels.pr} #${dep.pr})`}`;
              })
              .join("\n")}
          >
            <b class="bl-wave">W{waits.wave}</b>
            {` ${labels.need} `}
            {waits.deps.map((d, i) => (
              <>
                {view.joiners[i]}
                <button
                  type="button"
                  class={`bl-dep-chip s-${d.state}`}
                  data-dep-id={d.id}
                  onClick={stop}
                >
                  {d.label}
                </button>
              </>
            ))}
          </span>
        )}
        {view.pr === undefined ? (
          <Last last={view.last} labels={labels} />
        ) : (
          <PrCell pr={view.pr} />
        )}
        <span class="bl-acts">
          {row.review === false && <span class="bl-review-off">{labels.reviewOff}</span>}
          <button
            type="button"
            class="bl-btn bl-copy"
            title={labels.copyIdTitle}
            onClick={(e) => {
              stop(e);
              onCopy(row.id, labels.id);
            }}
          >
            {labels.id}
          </button>
          {isTicket && !row.closed && (
            <button
              type="button"
              class="bl-btn bl-run"
              title={`${view.dispatchLine}  ${labels.runKey}`}
              onClick={(e) => {
                stop(e);
                onCopy(view.dispatchLine, labels.dispatchLine);
              }}
            >
              ▶ {labels.run}
            </button>
          )}
          {isTicket && row.lastPr !== undefined && (
            <a
              class="bl-btn bl-pr"
              href={row.lastPr}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
            >
              {labels.pr}
            </a>
          )}
          {row.lastRunId !== undefined && (
            <a
              class="bl-btn bl-open"
              href={runHrefOf(row.lastRunId, token)}
              title={labels.openLastRun}
              onClick={stop}
            >
              ↗
            </a>
          )}
        </span>
      </div>
    </>
  );
}
