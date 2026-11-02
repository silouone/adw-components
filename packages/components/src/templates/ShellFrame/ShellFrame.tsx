import "./ShellFrame.css";

import type { ComponentChildren } from "preact";

// `<ShellFrame/>`: the board's frame, a `[rail 1][rail 2][stage]` grid under the top bar. It places
// three slots and nothing else: which organism fills a rail (a strip or its panel) and what the stage
// draws are the caller's. Pure over its props: each rail's open state and width arrive as values, and
// a dropped stream arrives as `stale` plus the words of its notice. Below the rail breakpoint an open
// rail floats over the stage, so its track collapses and the stage takes the width.

export interface ShellFrameProps {
  readonly rail1: ComponentChildren;
  readonly rail2: ComponentChildren;
  readonly stage: ComponentChildren;
  readonly rail1Open: boolean;
  readonly rail2Open: boolean;
  /** A CSS length for the first rail's track; absent → sized by its content. */
  readonly rail1Width?: string;
  /** A CSS length for the second rail's track; absent → sized by its content. */
  readonly rail2Width?: string;
  /** A dropped stream: the frame is marked and, given `staleNotice`, shows it. */
  readonly stale: boolean;
  readonly staleNotice?: string;
}

const widthStyle = (
  rail1Width: string | undefined,
  rail2Width: string | undefined,
): Record<string, string> | undefined => {
  const entries = [
    ...(rail1Width === undefined ? [] : [["--adw-shell-frame-rail1", rail1Width] as const]),
    ...(rail2Width === undefined ? [] : [["--adw-shell-frame-rail2", rail2Width] as const]),
  ];
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
};

export function ShellFrame({
  rail1,
  rail2,
  stage,
  rail1Open,
  rail2Open,
  rail1Width,
  rail2Width,
  stale,
  staleNotice,
}: ShellFrameProps) {
  const cls = [
    "shell-frame",
    ...(stale ? ["shell-frame-stale"] : []),
    ...(rail1Open ? ["shell-frame-rail1-open"] : []),
    ...(rail2Open ? ["shell-frame-rail2-open"] : []),
  ].join(" ");
  return (
    <>
      {stale && staleNotice !== undefined && (
        <p class="shell-frame-notice" role="status">
          {staleNotice}
        </p>
      )}
      <div
        class={cls}
        data-rail1={rail1Open ? "open" : "closed"}
        data-rail2={rail2Open ? "open" : "closed"}
        style={widthStyle(rail1Width, rail2Width)}
      >
        {rail1}
        {rail2}
        <main class="shell-frame-stage">{stage}</main>
      </div>
    </>
  );
}
