import "./ResultTab.css";

// `<ResultTab/>`: the focus panel's Result tab — the end of a run in one place: the PR, the
// factory review, why it stopped and what it taught. The words arrive as `labels`.

import { PrChips, type PrFoundView } from "../../molecules/PrChips/PrChips";
import { TabBlock } from "../RunTab/RunTab";

export type PullRequestLine =
  | { readonly kind: "chips"; readonly pr: PrFoundView; readonly state: string }
  | {
      readonly kind: "link";
      readonly number: number;
      readonly url: string;
      readonly state: string;
    }
  | { readonly kind: "text"; readonly text: string };

export type Stopped =
  | {
      readonly kind: "blocked";
      readonly cause: string;
      readonly node: string;
      readonly reason: string;
    }
  | {
      readonly kind: "deferred";
      readonly rule: string;
      readonly reason?: string;
    };

export interface ResultView {
  readonly pullRequest: PullRequestLine;
  readonly review: {
    readonly standards: string;
    readonly spec: string;
    readonly findings: string;
    readonly note: string;
  };
  readonly stopped?: Stopped;
  readonly taught: {
    readonly ledger: string;
    readonly artifacts: readonly {
      readonly node: string;
      readonly file: string;
    }[];
  };
}

/** The words of the tab that its view does not carry. */
export interface ResultTabLabels {
  readonly pullRequest: string;
  readonly factoryReview: string;
  readonly standards: string;
  readonly spec: string;
  readonly findings: string;
  readonly whyItStopped: string;
  /** The head of a deferred run's block. */
  readonly deferred: string;
  readonly whatItTaught: string;
}

export interface ResultTabProps {
  readonly view: ResultView;
  readonly labels: ResultTabLabels;
  /** The rail passes "rail": the root and rows render their rail variant. */
  readonly density?: "rail" | undefined;
}

export function ResultTab({ view: v, labels, density }: ResultTabProps) {
  const line = v.pullRequest;
  return (
    <div class={density === "rail" ? "resulttab rs-rail" : "resulttab"}>
      <TabBlock density={density} title={labels.pullRequest}>
        <div class="rs-pr">
          {line.kind === "chips" && (
            <>
              <PrChips pr={line.pr} />
              <span class="rs-pr-state faint">{line.state}</span>
            </>
          )}
          {line.kind === "link" && (
            <>
              <a class="chip rt-chip" href={line.url} target="_blank" rel="noopener noreferrer">
                #{line.number}
              </a>
              <span class="rs-pr-state faint">{line.state}</span>
            </>
          )}
          {line.kind === "text" && line.text}
        </div>
      </TabBlock>
      <TabBlock density={density} title={labels.factoryReview}>
        <dl class={density === "rail" ? "rt-kv rt-rail" : "rt-kv"}>
          <dt>{labels.standards}</dt>
          <dd class="rs-standards">{v.review.standards}</dd>
          <dt>{labels.spec}</dt>
          <dd class="rs-spec">{v.review.spec}</dd>
          <dt>{labels.findings}</dt>
          <dd class="rs-findings">{v.review.findings}</dd>
        </dl>
        <div class="rs-note faint">{v.review.note}</div>
      </TabBlock>
      {v.stopped?.kind === "blocked" && (
        <TabBlock density={density} title={labels.whyItStopped}>
          <div class="rs-cause bad">{v.stopped.cause}</div>
          <div class="rs-node faint">{v.stopped.node}</div>
          <pre class="rs-reason rs-scroll">{v.stopped.reason}</pre>
        </TabBlock>
      )}
      {v.stopped?.kind === "deferred" && (
        <TabBlock density={density} title={labels.whyItStopped}>
          <div class="rs-deferred">{labels.deferred}</div>
          <div class="rs-rule faint">{v.stopped.rule}</div>
          {v.stopped.reason !== undefined && (
            <pre class="rs-reason rs-scroll">{v.stopped.reason}</pre>
          )}
        </TabBlock>
      )}
      <TabBlock density={density} title={labels.whatItTaught}>
        <div class="rs-ledger">{v.taught.ledger}</div>
        {v.taught.artifacts.map((a) => (
          <div key={`${a.node}-${a.file}`} class="rs-artifact faint">
            {a.node} {a.file}
          </div>
        ))}
        {v.taught.artifacts.length === 0 && <div class="faint">—</div>}
      </TabBlock>
    </div>
  );
}
