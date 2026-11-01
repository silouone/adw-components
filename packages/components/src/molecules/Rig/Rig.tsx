import "./Rig.css";

// `<RigTag/>`: what one step ran on — provider glyph and name, model, a 5-step thinking
// meter with its effort word (or a thinking budget), and the gear. Compact form drops the
// provider name and hides the effort word visually (it stays in the DOM — a text
// contract).
//
// Pure: a `RigView` in, markup out. The model is already shortened, the budget already
// worded and the tooltip already built by the caller; with no rig, `none` is the text.

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

const PROVIDER_MARK = { claude: "✳", codex: "◎" } as const;

export interface RigView {
  readonly provider?: "claude" | "codex";
  /** The model as shown, e.g. `opus-5-5`. */
  readonly model: string;
  /** One of low, medium, high, xhigh, max: drives the meter. */
  readonly effort?: string;
  /** The thinking text when there is no effort, e.g. a budget. */
  readonly budget?: string;
  readonly gear?: string;
  /** The tooltip: provider, model, thinking, gear. */
  readonly title: string;
}

export interface RigTagProps {
  readonly rig: RigView | undefined;
  /** What a step without a journaled rig says, e.g. `rig not journaled`. */
  readonly none: string;
  readonly compact?: boolean;
}

function Thinking({ rig }: { readonly rig: RigView }) {
  if (rig.effort === undefined) {
    return rig.budget === undefined ? null : <span class="think txt">{rig.budget}</span>;
  }
  const level = (EFFORTS as readonly string[]).indexOf(rig.effort) + 1;
  return (
    <span class="think" data-level={level} data-effort={rig.effort}>
      {EFFORTS.map((e, i) => (
        <i key={e} class={i < level ? "on" : ""} />
      ))}
      <em>{rig.effort}</em>
    </span>
  );
}

export function RigTag({ rig, none, compact = false }: RigTagProps) {
  if (rig === undefined) return <span class="rig none">{none}</span>;
  return (
    <span class={`rig${compact ? " compact" : ""}`} title={rig.title}>
      <span class={`prov ${rig.provider ?? "unknown"}`}>
        {rig.provider === undefined ? "?" : PROVIDER_MARK[rig.provider]}
      </span>
      {!compact && rig.provider !== undefined && <span class="prov-n">{rig.provider}</span>}
      <span class="rig-m">{rig.model}</span>
      <Thinking rig={rig} />
      {rig.gear !== undefined && <span class="gear">{rig.gear}</span>}
    </span>
  );
}
