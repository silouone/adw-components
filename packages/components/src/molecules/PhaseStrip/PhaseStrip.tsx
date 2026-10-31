import "./PhaseStrip.css";

// `<PhaseStrip/>`: the card's 8 px row of run phases — one segment per bar of any
// lane, placed by percent coordinates the caller already computed, plus the
// hatched wait for a slot.
//
// Pure: a `PhaseStripView` in, markup out. Preact sets attribute values directly,
// so there is nothing to escape.

export interface PhaseStripView {
  readonly segments: readonly {
    readonly cls: string;
    readonly place: { readonly left: string; readonly width: string };
    readonly title: string;
  }[];
}

export interface PhaseStripProps {
  readonly view: PhaseStripView;
}

export function PhaseStrip({ view }: PhaseStripProps) {
  return (
    <div class="tc-strip">
      {view.segments.map((s, i) => (
        <i key={i} class={s.cls} style={s.place} title={s.title} />
      ))}
    </div>
  );
}
