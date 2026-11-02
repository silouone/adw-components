import "./RunPageFrame.css";

import type { ComponentChildren } from "preact";

// `<RunPageFrame/>`: the run page's frame: the crumb back to the board, a notice, then the console box
// (the header over the stage, or in full screen only the strip), the hover card and the dock. It
// places slots and measures, scrolls and scopes nothing. Pure over its props: `full` swaps the
// console's content for the strip, `shut` marks the dock shut on the run route, and `embedded` marks
// the console on the board's stage, where it is not the run route's flex column. With no slot at all
// (before the first frame) only the crumb and the notice render.

export interface RunPageFrameProps {
  /** The way back to the board; absent on the board's stage. */
  readonly crumbHref?: string;
  /** The words of the crumb, after its arrow; given with `crumbHref`. */
  readonly crumbLabel?: string;
  readonly notice?: string;
  /** Full screen: the console shows only `strip`. */
  readonly full: boolean;
  /** The dock is shut (run route only). */
  readonly shut: boolean;
  /** On the board's stage: the console is not the run route's flex column. */
  readonly embedded?: boolean;
  /** The dock is shown; default true. */
  readonly dockOpen?: boolean;
  /** The run's header, above the stage. */
  readonly header?: ComponentChildren;
  /** The one-line console shown in full screen, in place of the header and the stage. */
  readonly strip?: ComponentChildren;
  /** The lanes, ledger or journey. */
  readonly stage?: ComponentChildren;
  /** The hover card, a floating overlay. */
  readonly card?: ComponentChildren;
  readonly dock?: ComponentChildren;
}

export function RunPageFrame({
  crumbHref,
  crumbLabel,
  notice,
  full,
  shut,
  embedded = false,
  dockOpen = true,
  header,
  strip,
  stage,
  card,
  dock,
}: RunPageFrameProps) {
  const hasBody = [header, strip, stage, card, dock].some((s) => s !== undefined);
  const dockShut = !embedded && shut && !full;
  const consoleClass = [
    "run-page-frame-console",
    ...(full ? ["run-page-frame-console-full"] : []),
    ...(embedded ? [] : ["run-page-frame-console-docked"]),
    ...(dockShut ? ["run-page-frame-console-dock-shut"] : []),
  ].join(" ");
  const dockClass = [
    "run-page-frame-dock",
    ...(full ? ["run-page-frame-dock-full"] : []),
    ...(dockShut ? ["run-page-frame-dock-shut"] : []),
  ].join(" ");
  return (
    <>
      {crumbHref !== undefined && (
        <a class="run-page-frame-crumb" href={crumbHref}>
          ← {crumbLabel}
        </a>
      )}
      {notice !== undefined && (
        <ul class="run-page-frame-notices" role="alert">
          <li>⚠ {notice}</li>
        </ul>
      )}
      {hasBody && (
        <>
          <div class={consoleClass}>
            {full ? (
              strip
            ) : (
              <>
                {header}
                {stage}
              </>
            )}
          </div>
          {card}
          <div class={dockClass} hidden={!dockOpen}>
            {dock}
          </div>
        </>
      )}
    </>
  );
}
