import "./KpiPanel.css";

// `<KpiPanel/>`: the KPI chip's dropdown body — a pure render of a
// `KpiPanelView`, over the board's loaded window. Five headline cells, three
// eight-bucket sparklines with their 24 h deltas, the time and outcome stacks
// and the per-project table. It reads no signal and no clock: the chip owns
// both and hands this the finished numbers. The words the view does not carry
// arrive as `labels`.

export interface KpiCellView {
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly hue?: "ok" | "bad";
}

export interface KpiSparkView {
  readonly name: string;
  readonly title: string;
  readonly hue?: "ok" | "model";
  /** `▲ 12%` against the 24 h before; absent when there is no baseline. */
  readonly delta?: string;
  readonly bars: readonly {
    readonly key: number;
    /** Percent of the tallest bar. */
    readonly height: number;
    /** The bucket's UTC hour on every other bar. */
    readonly label?: string;
  }[];
}

export interface KpiStackView {
  readonly name: string;
  readonly title: string;
  readonly segments: readonly {
    readonly key: string;
    readonly cls: string;
    readonly value: number;
  }[];
  /** The legend line; `—` when the stack is empty. */
  readonly legend: string;
}

export interface KpiRowView {
  readonly target: string;
  readonly runs: number;
  readonly live: number;
  /** The green bar's width in percent; absent when unmeasured. */
  readonly greenBar?: number;
  readonly green: string;
  readonly blocked: number;
  readonly median: string;
  readonly spend: string;
}

export interface KpiPanelView {
  readonly cells: readonly KpiCellView[];
  readonly sparks: readonly KpiSparkView[];
  readonly stacks: readonly KpiStackView[];
  readonly rows: readonly KpiRowView[];
  readonly foot: string;
}

/** The words of the panel that its view does not carry. */
export interface KpiPanelLabels {
  /** The tooltip of a sparkline's delta, e.g. `vs the 24 h before`. */
  readonly vsPrevious: string;
  /** The per-project table's column heads. */
  readonly heads: {
    readonly project: string;
    readonly runs: string;
    readonly live: string;
    readonly green: string;
    readonly blocked: string;
    readonly median: string;
    readonly spend: string;
  };
}

export interface KpiPanelProps {
  readonly view: KpiPanelView;
  readonly labels: KpiPanelLabels;
}

function Cell({ name, label, value, sub, hue }: KpiCellView) {
  return (
    <div class="kp-cell" data-cell={name}>
      <span class="kp-l">{label}</span>
      <b class={`kp-v${hue === undefined ? "" : ` ${hue}`}`}>{value}</b>
      <span class="kp-s">{sub}</span>
    </div>
  );
}

function Spark({
  name,
  title,
  bars,
  delta,
  hue,
  vsPrevious,
}: KpiSparkView & { readonly vsPrevious: string }) {
  return (
    <div class="kp-spark" data-spark={name}>
      <div class="kp-eyebrow">
        <span>{title}</span>
        {delta === undefined ? (
          <span class="kp-delta" />
        ) : (
          <span class="kp-delta" title={vsPrevious}>
            {delta}
          </span>
        )}
      </div>
      <div class="kp-bars">
        {bars.map((b) => (
          <div class="kp-col" key={b.key}>
            <i
              class={`kp-bar${hue === undefined ? "" : ` ${hue}`}`}
              style={{ height: `${b.height}%` }}
            />
            {b.label !== undefined && <span class="kp-lbl">{b.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stack({ name, title, segments, legend }: KpiStackView) {
  return (
    <div class="kp-stack" data-stack={name}>
      <div class="kp-eyebrow">
        <span>{title}</span>
      </div>
      <div class="kp-seglist">
        {segments.map((p) => (
          <i class={`kp-seg ${p.cls}`} key={p.key} style={{ flex: p.value }} />
        ))}
      </div>
      <div class="kp-legend">{legend}</div>
    </div>
  );
}

function ProjectRow({ p }: { readonly p: KpiRowView }) {
  return (
    <tr data-project={p.target}>
      <td class="kp-name">{p.target}</td>
      <td>{p.runs}</td>
      <td>{p.live}</td>
      <td data-col="green">
        {p.greenBar !== undefined && (
          <span class="kp-gtrack">
            <i class="kp-gbar" style={{ width: `${p.greenBar}%` }} />
          </span>
        )}
        {p.green}
      </td>
      <td data-col="blocked" class={p.blocked > 0 ? "bad" : ""}>
        {p.blocked}
      </td>
      <td data-col="median">{p.median}</td>
      <td data-col="spend" class="ok">
        {p.spend}
      </td>
    </tr>
  );
}

const HEAD_KEYS = ["project", "runs", "live", "green", "blocked", "median", "spend"] as const;

export function KpiPanel({ view, labels }: KpiPanelProps) {
  return (
    <div class="kp" data-kpi-panel>
      <div class="kp-cells">
        {view.cells.map((c) => (
          <Cell key={c.name} {...c} />
        ))}
      </div>
      <div class="kp-sparks">
        {view.sparks.map((s) => (
          <Spark key={s.name} {...s} vsPrevious={labels.vsPrevious} />
        ))}
      </div>
      <div class="kp-stacks">
        {view.stacks.map((s) => (
          <Stack key={s.name} {...s} />
        ))}
      </div>
      <table class="kp-table">
        <thead>
          <tr>
            {HEAD_KEYS.map((h) => (
              <th key={h}>{labels.heads[h]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((p) => (
            <ProjectRow p={p} key={p.target} />
          ))}
        </tbody>
      </table>
      <div class="kp-foot">{view.foot}</div>
    </div>
  );
}
