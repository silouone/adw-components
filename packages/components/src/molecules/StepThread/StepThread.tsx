import "./StepThread.css";

// `<StepThread/>`: the card's run as one dot per node, strung on a thread and grouped
// by phase. A filled dot is an agent, a hollow one code or a gate run; each carries its
// hover card in `data-tip`. The dots shrink with their count (`--n`, `--gaps`) so the
// thread never leaves the card.
//
// Pure: a `StepThreadView` in, markup out. The words of the trailing wait dot arrive
// as `waitLabel`.

export interface StepThreadView {
  readonly n: number;
  readonly gaps: number;
  readonly waits: boolean;
  readonly dots: readonly { readonly cls: string; readonly tip: string }[];
}

export interface StepThreadProps {
  readonly view: StepThreadView;
  /** The hover card of the trailing wait dot, e.g. the words for "waiting for a slot". */
  readonly waitLabel: string;
}

export function StepThread({ view, waitLabel }: StepThreadProps) {
  return (
    <div class="tc-thread" style={{ "--n": String(view.n), "--gaps": String(view.gaps) }}>
      {view.dots.map((d, i) => (
        <i key={i} class={d.cls} data-tip={d.tip} />
      ))}
      {view.waits && <i class="st-dot wait" data-tip={waitLabel} />}
    </div>
  );
}
