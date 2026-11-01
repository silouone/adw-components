import "./Drawer.css";

// `<Drawer/>`: one node's full detail — stats, the model/tool split, gate chips, round and
// watchdog, and the drawer body (prompt, system prompt, config, review, live usage).
//
// Pure: a block, its figures and an optional `DrawerView` in, markup out. Every figure arrives
// formatted and every word arrives in `labels`. `drawer` is optional: a block with no drawer
// view renders no drawer section at all.

import {
  RoundBadge,
  type RoundLabels,
  type RoundView,
  WatchdogBadge,
  type WatchdogView,
} from "../../atoms/Badge/Badge";
import { FailureView, type FailurePaneView } from "../FailureView/FailureView";

/** The block a drawer opens on. */
export interface DrawerBlock {
  readonly node: string;
  readonly round?: RoundView;
  readonly watchdog?: WatchdogView;
  /** Why the node failed, in the producer's words. */
  readonly reason?: string;
}

/** A prompt as the journal kept it. */
export type PromptView =
  | { readonly status: "ok"; readonly text: string }
  | { readonly status: "not-persisted"; readonly reason?: string }
  | {
      readonly status: "mismatch";
      readonly expectedBytes: number;
      readonly expectedHash: string;
      readonly actualBytes: number;
      readonly actualHash: string;
    };

export interface ReviewFinding {
  readonly axis: string;
  readonly file: string;
  readonly line?: number;
  readonly severity: string;
  readonly kind?: string;
  readonly summary: string;
  readonly citation: string;
}

export interface ReviewDisposition {
  readonly finding: ReviewFinding;
  readonly disposition: string;
  readonly reason: string;
}

export interface ReviewVerdictView {
  readonly axis: string;
  readonly findings: readonly ReviewFinding[];
  readonly dispositions?: readonly ReviewDisposition[];
}

export interface DrawerView {
  readonly node: string;
  readonly kind: string;
  readonly attempt?: RoundView;
  readonly prompt?: PromptView;
  readonly systemPrompt?: { readonly status: "preset" | "empty" | "not-recorded" };
  readonly config?:
    | { readonly status: "captured"; readonly config: unknown }
    | { readonly status: "not-captured-on-provider" | "absent" };
  readonly review?: ReviewVerdictView;
}

export interface DrawerStat {
  readonly label: string;
  readonly value: string;
}

export interface DrawerSplit {
  readonly modelPct: string;
  readonly toolPct: string;
  readonly model: string;
  readonly tool: string;
  readonly subagent?: string;
}

export interface DrawerGateView {
  readonly name: string;
  readonly cls: "gate-pass" | "gate-fail";
  readonly chip?: string;
  readonly note?: string;
}

export interface DrawerLiveFigures {
  readonly contextNow: string;
  readonly calls: string;
  readonly tokens: string;
  readonly input: string;
  readonly output: string;
  readonly cacheRead: string;
  readonly cacheWrite: string;
}

/** Every figure the card prints, already formatted. */
export interface DrawerFigures {
  readonly outcome: string;
  readonly glyph: string;
  readonly purpose: string;
  readonly stats: readonly DrawerStat[];
  readonly split?: DrawerSplit;
  /** The block's own gate chips, distinct from the drawer view's. */
  readonly blockGates: readonly { readonly name: string; readonly pass: boolean }[];
  readonly gates?: readonly DrawerGateView[];
  readonly live?: DrawerLiveFigures;
}

/** The words of a prompt that is not there, or does not match. */
export interface PromptLabels {
  readonly notPersisted: string;
  readonly mismatch: string;
  readonly expected: string;
  readonly actual: string;
  readonly bytes: string;
  readonly hash: string;
}

export interface DrawerLabels extends PromptLabels {
  readonly round: RoundLabels;
  /** The lead-in before a watchdog's reason. */
  readonly watchdog: string;
  readonly model: string;
  readonly tool: string;
  readonly blockedOnSubagent: string;
  readonly kind: string;
  readonly attempt: string;
  readonly of: string;
  readonly systemPrompt: string;
  readonly systemPromptPreset: string;
  readonly systemPromptEmpty: string;
  readonly systemPromptNotRecorded: string;
  readonly config: string;
  readonly configNotCaptured: string;
  readonly configAbsent: string;
  readonly reviewAxis: string;
  readonly noFindings: string;
  readonly contextNow: string;
  readonly calls: string;
  readonly tokens: string;
  readonly tokensIn: string;
  readonly tokensOut: string;
  readonly cacheRead: string;
  readonly cacheWrite: string;
}

export interface DrawerProps {
  readonly block: DrawerBlock;
  /** The lane role this block was filed into — `laneRole`, not `role`, so no static check reads it as an ARIA role. */
  readonly laneRole: string;
  readonly drawer?: DrawerView;
  /** The run's parsed failure, given only to the failing node's drawer: it replaces the raw reason. */
  readonly failure?: FailurePaneView;
  readonly figures: DrawerFigures;
  readonly labels: DrawerLabels;
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function Drawer({ block, laneRole, drawer, failure, figures, labels }: DrawerProps) {
  const { split } = figures;
  return (
    <>
      <div class="card-hd">
        <span class={`mk ${figures.outcome}`}>{figures.glyph}</span>
        <b>{block.node}</b>
        <span class="card-role">{laneRole}</span>
        <span class="card-why">{figures.purpose}</span>
        <RoundBadge round={block.round} labels={labels.round} />
        <WatchdogBadge watchdog={block.watchdog} label={labels.watchdog} />
      </div>
      {failure !== undefined ? (
        <FailureView view={failure} />
      ) : (
        block.reason !== undefined && <div class="card-reason">{block.reason}</div>
      )}
      <div class="card-stats">
        {figures.stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
      {split !== undefined && (
        <div class="card-split">
          <div class="sb">
            <span class="s-model" style={`width:${split.modelPct}%`} />
            <span class="s-tool" style={`width:${split.toolPct}%`} />
          </div>
          <div class="sl">
            <span>
              <i class="s-model" />
              {labels.model} {split.model}
            </span>
            <span>
              <i class="s-tool" />
              {labels.tool} {split.tool}
            </span>
            {split.subagent !== undefined && (
              <span>
                {labels.blockedOnSubagent} {split.subagent}
              </span>
            )}
          </div>
        </div>
      )}
      {figures.blockGates.length > 0 && (
        <div class="card-gates">
          {figures.blockGates.map((g, i) => (
            <span key={`${g.name}:${i}`} class={`gg ${g.pass ? "gp" : "gf"}`}>
              {g.pass ? "✓" : "✕"} {g.name}
            </span>
          ))}
        </div>
      )}
      {drawer !== undefined && <DrawerBody view={drawer} figures={figures} labels={labels} />}
    </>
  );
}

/** One node's detail drawer; every optional slot renders only when the view carries it. */
function DrawerBody({
  view,
  figures,
  labels,
}: {
  readonly view: DrawerView;
  readonly figures: DrawerFigures;
  readonly labels: DrawerLabels;
}) {
  return (
    <>
      <div class="drawer-node">{view.node}</div>
      <div class="drawer-kind">
        {labels.kind}: {view.kind}
      </div>
      {view.attempt !== undefined && (
        <div class="drawer-attempt">
          {labels.attempt} {view.attempt.round} {labels.of} {view.attempt.of}
        </div>
      )}
      {figures.gates !== undefined && (
        <div class="drawer-gates">
          {figures.gates.map((g) => (
            <span key={g.name} class={g.cls}>
              {g.name}
              {g.chip !== undefined && <i class="gate-host">{g.chip}</i>}
              {g.note !== undefined && <i class="gate-fallback">{g.note}</i>}
            </span>
          ))}
        </div>
      )}
      {view.prompt !== undefined && (
        <div class="drawer-prompt">
          <PromptBody prompt={view.prompt} labels={labels} />
        </div>
      )}
      {view.systemPrompt !== undefined && (
        <div class="drawer-system-prompt">
          {labels.systemPrompt}:{" "}
          <SystemPromptBody status={view.systemPrompt.status} labels={labels} />
        </div>
      )}
      {view.config !== undefined && (
        <div class="drawer-config">
          <ConfigBody config={view.config} labels={labels} />
        </div>
      )}
      {view.review !== undefined && (
        <div class="drawer-review">
          <ReviewBody review={view.review} labels={labels} />
        </div>
      )}
      {figures.live !== undefined && (
        <div class="drawer-live">
          <LiveBody live={figures.live} labels={labels} />
        </div>
      )}
    </>
  );
}

/** A running node's usage so far: context now, calls and the token breakdown. */
function LiveBody({
  live,
  labels,
}: {
  readonly live: DrawerLiveFigures;
  readonly labels: DrawerLabels;
}) {
  return (
    <>
      <div class="live-context-now">
        {labels.contextNow}: {live.contextNow}
      </div>
      <div class="live-calls">
        {labels.calls}: {live.calls}
      </div>
      <div class="live-tokens">
        {labels.tokens}: {live.tokens} ({labels.tokensIn} {live.input}, {labels.tokensOut}{" "}
        {live.output}, {labels.cacheRead} {live.cacheRead}, {labels.cacheWrite} {live.cacheWrite})
      </div>
    </>
  );
}

/** A prompt in its three states; shared with the run scope's ticket and report panes. */
export function PromptBody({
  prompt,
  labels,
}: {
  readonly prompt: PromptView;
  readonly labels: PromptLabels;
}) {
  if (prompt.status === "ok") return <pre class="prompt-text">{prompt.text}</pre>;
  if (prompt.status === "not-persisted") {
    return (
      <div class="prompt-not-persisted">
        {labels.notPersisted}
        {prompt.reason !== undefined ? `: ${prompt.reason}` : ""}
      </div>
    );
  }
  return (
    <div class="prompt-mismatch">
      {labels.mismatch} — {labels.expected} {prompt.expectedBytes} {labels.bytes} ({labels.hash}{" "}
      {prompt.expectedHash}), {labels.actual} {prompt.actualBytes} {labels.bytes} ({labels.hash}{" "}
      {prompt.actualHash})
    </div>
  );
}

/** A finding's own stable identity: no id exists, so the key composes every distinguishing field. */
function findingKey(finding: ReviewFinding): string {
  return `${finding.axis}:${finding.file}:${finding.line ?? ""}:${finding.summary}`;
}

/** `file:line`, the line only when the reviewer gave one — never a bare trailing colon. */
function locationOf(finding: ReviewFinding): string {
  return finding.line !== undefined ? `${finding.file}:${finding.line}` : finding.file;
}

/** The review verdict. An empty findings list says so, rather than rendering a blank section. */
function ReviewBody({
  review,
  labels,
}: {
  readonly review: ReviewVerdictView;
  readonly labels: DrawerLabels;
}) {
  return (
    <>
      <div class="review-axis">
        {labels.reviewAxis}: {review.axis}
      </div>
      {review.findings.length === 0 ? (
        <div class="review-clean">{labels.noFindings}</div>
      ) : (
        <ul class="review-findings">
          {review.findings.map((f) => (
            <li class="review-finding" key={findingKey(f)}>
              <span class={`rf-sev rf-${f.severity}`}>{f.severity}</span>
              <span class="rf-loc">{locationOf(f)}</span>
              {f.kind !== undefined && <span class="rf-kind">{f.kind}</span>}
              <div class="rf-summary">{f.summary}</div>
              <div class="rf-cite">{f.citation}</div>
            </li>
          ))}
        </ul>
      )}
      {review.dispositions !== undefined && review.dispositions.length > 0 && (
        <ul class="review-dispositions">
          {review.dispositions.map((d) => (
            <li class="review-disposition" key={findingKey(d.finding)}>
              <span class={`rd-sev rd-${d.disposition}`}>{d.disposition}</span>
              <span class="rf-loc">{locationOf(d.finding)}</span>
              <div class="rf-summary">{d.reason}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SystemPromptBody({
  status,
  labels,
}: {
  readonly status: "preset" | "empty" | "not-recorded";
  readonly labels: DrawerLabels;
}) {
  if (status === "preset") return <>{labels.systemPromptPreset}</>;
  if (status === "empty") return <>{labels.systemPromptEmpty}</>;
  return <>{labels.systemPromptNotRecorded}</>;
}

/** Labelled like every sibling slot and pretty-printed: one `JSON.stringify` line of the roster is a scrollbar, not a fact. */
function ConfigBody({
  config,
  labels,
}: {
  readonly config: NonNullable<DrawerView["config"]>;
  readonly labels: DrawerLabels;
}) {
  if (config.status === "captured") {
    return (
      <>
        {labels.config}: <pre class="config-captured">{JSON.stringify(config.config, null, 2)}</pre>
      </>
    );
  }
  return (
    <>
      {labels.config}:{" "}
      {config.status === "not-captured-on-provider"
        ? labels.configNotCaptured
        : labels.configAbsent}
    </>
  );
}
