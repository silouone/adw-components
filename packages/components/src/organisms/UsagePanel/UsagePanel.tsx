import "./UsagePanel.css";

// `<UsagePanel/>`: the pinned subscription-headroom panel — the Claude gauges, the Codex row,
// the factory's own spend per provider and the "what's contributing" grid. Controlled: it takes
// `open` and calls `onClose`. The view arrives finished (tones, percents, countdowns, the
// `age` text); the words arrive as `labels`.

export type SpendProvider = "claude" | "codex" | "unknown";

export interface GaugeView {
  readonly key: string;
  readonly label: string;
  readonly short: string;
  readonly pct: number;
  readonly tone: string;
  readonly left: number;
  /** Time to the reset; empty when the gauge reports none. */
  readonly countdown: string;
  readonly resetsAt?: string;
  /** `resets <at> <tz>`; absent without a timezone. */
  readonly title?: string;
}

export type CodexView =
  | { readonly kind: "spend-control" }
  | {
      readonly kind: "row";
      readonly header: string;
      readonly gauges: readonly GaugeView[];
    };

export type SpendCellView =
  | { readonly kind: "nil" }
  | {
      readonly kind: "figures";
      readonly tokens: string;
      readonly runs: string;
      readonly estimate?: { readonly text: string; readonly basis: string };
      readonly unpriced?: string;
    };

export interface SpendView {
  readonly rows: readonly {
    readonly provider: SpendProvider;
    readonly note?: string;
    readonly h24: SpendCellView;
    readonly d7: SpendCellView;
  }[];
}

export type ContribCell =
  | { readonly kind: "nil" }
  | { readonly kind: "value"; readonly text: string; readonly title?: string };

export interface ContribView {
  readonly cols: string;
  readonly heads: readonly string[];
  readonly rows: readonly {
    readonly label: string;
    readonly cells: readonly ContribCell[];
  }[];
  readonly tops: readonly {
    readonly label: string;
    readonly cells: readonly {
      readonly name: string;
      readonly pct: number;
    }[][];
  }[];
  readonly loose: readonly string[];
}

export type UsagePanelView =
  | {
      readonly kind: "loading";
      readonly codex: CodexView | undefined;
      readonly spend: SpendView | undefined;
    }
  | {
      readonly kind: "unavailable";
      readonly reason: string;
      readonly codex: CodexView | undefined;
      readonly spend: SpendView | undefined;
    }
  | {
      readonly kind: "ok";
      readonly plan?: string;
      readonly age: string;
      readonly gauges: readonly GaugeView[];
      readonly unknownBuckets: readonly string[];
      readonly codex: CodexView | undefined;
      readonly spend: SpendView | undefined;
      readonly disclaimer?: string;
      readonly contributing: ContribView | undefined;
    };

/** Every word the panel prints. */
export interface UsagePanelLabels {
  readonly title: string;
  /** After a gauge's percent: `42 % used`. */
  readonly used: string;
  /** After a gauge's remaining percent: `58% left`. */
  readonly left: string;
  /** Before a gauge's reset time: `resets Fri 09:00`. */
  readonly resets: string;
  /** Before an unreported per-model bucket's name: `week · opus`. */
  readonly week: string;
  readonly unknown: string;
  readonly loading: string;
  readonly unavailable: string;
  readonly spendControl: string;
  readonly spendHeading: string;
  readonly spendNote: string;
  readonly last24h: string;
  readonly last7d: string;
  /** After a spend cell's token figure: `1.2M tok · 4 runs`. */
  readonly tokens: string;
  readonly contributing: string;
  /** The contributing heading's scope note, shown when the view carries a disclaimer. */
  readonly scope: string;
}

export interface UsagePanelProps {
  readonly view: UsagePanelView;
  readonly labels: UsagePanelLabels;
  readonly open: boolean;
  readonly onClose: () => void;
  /** The close button's glyph. */
  readonly closeGlyph?: string;
}

function GaugeCard({
  gauge,
  labels,
}: {
  readonly gauge: GaugeView;
  readonly labels: UsagePanelLabels;
}) {
  return (
    <div
      class={`up-g ${gauge.tone}`}
      {...(gauge.title !== undefined ? { title: gauge.title } : {})}
    >
      <div class="up-g-l">{gauge.label}</div>
      <div class="up-g-n">
        <b>
          {gauge.pct}
          <s>%</s>
        </b>
        <span>{labels.used}</span>
      </div>
      <div class="up-bar">
        <span style={`width:${gauge.pct}%`} />
      </div>
      <div class="up-g-f">
        <span class="up-left">
          {gauge.left}% {labels.left}
        </span>
        <em class="up-cd">{gauge.countdown}</em>
      </div>
      {gauge.resetsAt !== undefined && (
        <div class="up-rs">
          {labels.resets} {gauge.resetsAt}
        </div>
      )}
    </div>
  );
}

/** A per-model weekly bucket the account did not report: no bar and no `% left`, never a zero. */
function UnknownBucketCard({
  name,
  labels,
}: {
  readonly name: string;
  readonly labels: UsagePanelLabels;
}) {
  return (
    <div class="up-g">
      <div class="up-g-l">
        {labels.week} · {name}
      </div>
      <div class="up-g-n">
        <i class="up-nil">{labels.unknown}</i>
      </div>
    </div>
  );
}

/** One row under the Claude gauges. No Codex data reads as an absence, never an error banner. */
function CodexSection({
  codex,
  labels,
}: {
  readonly codex: CodexView | undefined;
  readonly labels: UsagePanelLabels;
}) {
  if (codex === undefined) return null;
  if (codex.kind === "spend-control") {
    return (
      <div class="cx-row bad">
        <span>{labels.spendControl}</span>
      </div>
    );
  }
  return (
    <div class="cx-row">
      <span>{codex.header}</span>
      {codex.gauges.length > 0 && (
        <div class="up-gs">
          {codex.gauges.map((g) => (
            <GaugeCard key={g.key} gauge={g} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The "what's contributing" section: a fixed label gutter + one column per period. */
function ContributingGrid({ grid }: { readonly grid: ContribView | undefined }) {
  if (grid === undefined) return null;
  const { cols } = grid;
  return (
    <div class="up-grid">
      <div class="up-gr-h" style={cols}>
        <span />
        {grid.heads.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
      {grid.rows.map((r, i) => (
        <div key={i} class="up-gr-r" style={cols}>
          <i>{r.label}</i>
          {r.cells.map((c, j) => (
            <span key={j}>
              {c.kind === "nil" ? (
                <i class="up-nil">—</i>
              ) : (
                <b {...(c.title !== undefined ? { title: c.title } : {})}>{c.text}</b>
              )}
            </span>
          ))}
        </div>
      ))}
      {grid.tops.map((t) => (
        <div key={t.label} class="up-gr-r up-gr-c" style={cols}>
          <i>{t.label}</i>
          {t.cells.map((tops, i) => (
            <span key={i} class="up-tops">
              {tops.length === 0 ? (
                <i class="up-nil">—</i>
              ) : (
                tops.map((x, j) => (
                  <span key={j} class="up-top">
                    <b>{x.name}</b>
                    {x.pct}%
                  </span>
                ))
              )}
            </span>
          ))}
        </div>
      ))}
      {grid.loose.map((l, i) => (
        <div key={i} class="up-loose">
          {l}
        </div>
      ))}
    </div>
  );
}

function SpendCell({
  cell,
  labels,
}: {
  readonly cell: SpendCellView;
  readonly labels: UsagePanelLabels;
}) {
  if (cell.kind === "nil") {
    return (
      <span>
        <i class="up-nil">—</i>
      </span>
    );
  }
  return (
    <span>
      <b>{cell.tokens}</b> {labels.tokens} · {cell.runs}
      {cell.estimate !== undefined && (
        <>
          {" · "}
          <em title={cell.estimate.basis}>{cell.estimate.text}</em>
        </>
      )}
      {cell.unpriced !== undefined && (
        <>
          {" · "}
          <i class="up-nil">{cell.unpriced}</i>
        </>
      )}
    </span>
  );
}

/** Under the Codex row: the factory's own journaled spend per provider. */
function SpendSection({
  spend,
  labels,
}: {
  readonly spend: SpendView | undefined;
  readonly labels: UsagePanelLabels;
}) {
  if (spend === undefined) return null;
  return (
    <div class="up-sec sp-sec">
      <div class="up-sec-h">
        {labels.spendHeading}
        <em>{labels.spendNote}</em>
      </div>
      <div class="up-grid">
        <div class="up-gr-h up-sp-cols">
          <span />
          <span>{labels.last24h}</span>
          <span>{labels.last7d}</span>
        </div>
        {spend.rows.map((r) => (
          <div key={r.provider} class="up-gr-r up-sp-cols">
            <i title={r.note}>
              {r.provider}
              {r.note !== undefined && <span class="up-nil"> {r.note}</span>}
            </i>
            <SpendCell cell={r.h24} labels={labels} />
            <SpendCell cell={r.d7} labels={labels} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsagePanel({
  view,
  labels,
  open,
  onClose: close,
  closeGlyph = "✕",
}: UsagePanelProps) {
  if (view.kind === "loading") {
    return (
      <div class="up-panel" hidden={!open}>
        <div class="up-head">
          <span class="up-title">{labels.title}</span>
          <button type="button" class="up-x" onClick={close}>
            {closeGlyph}
          </button>
        </div>
        <div class="up-none up-loading">{labels.loading}</div>
        <CodexSection codex={view.codex} labels={labels} />
        <SpendSection spend={view.spend} labels={labels} />
      </div>
    );
  }

  if (view.kind === "unavailable") {
    return (
      <div class="up-panel" hidden={!open}>
        <div class="up-none">
          {labels.unavailable}
          <br />
          <span>{view.reason}</span>
        </div>
        <CodexSection codex={view.codex} labels={labels} />
        <SpendSection spend={view.spend} labels={labels} />
      </div>
    );
  }

  return (
    <div class="up-panel" hidden={!open}>
      <div class="up-head">
        <span class="up-title">{labels.title}</span>
        {view.plan !== undefined && (
          <span class="up-plan" title={view.plan}>
            {view.plan}
          </span>
        )}
        <span class="up-age">{view.age}</span>
        <button type="button" class="up-x" onClick={close}>
          {closeGlyph}
        </button>
      </div>
      <div class="up-gs">
        {view.gauges.map((g) => (
          <GaugeCard key={g.key + g.label} gauge={g} labels={labels} />
        ))}
        {view.unknownBuckets.map((name) => (
          <UnknownBucketCard key={name} name={name} labels={labels} />
        ))}
      </div>
      <CodexSection codex={view.codex} labels={labels} />
      <SpendSection spend={view.spend} labels={labels} />
      <div class="up-sec">
        <div class="up-sec-h">
          {labels.contributing}
          {view.disclaimer !== undefined && <em title={view.disclaimer}>{labels.scope}</em>}
        </div>
        <ContributingGrid grid={view.contributing} />
      </div>
    </div>
  );
}
