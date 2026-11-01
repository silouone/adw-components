import "./CopyRunMenu.css";

// `<CopyRunMenu/>`: the one compact « ▶ copy ▾ » control that replaces the gate-host select
// and the copy button. With hosts it opens a small menu — « this mac » then each host — and
// each item copies its own line; without hosts one click copies today's line.
//
// Controlled: the caller owns `open` and hears `onOpenChange`; it closes the menu on Escape
// or an outside click, and `rootRef` lets it tell an inside click. The owner copies: this
// menu only says what is copied and how it is labelled. Every word arrives as `labels`.

import type { RefObject } from "preact";

export interface CopyRunMenuView {
  /** `false` when the project declares no gate host: one click copies. */
  readonly hasMenu: boolean;
  readonly lastLine: string;
  /** « this mac » (`host` undefined) first, then each declared host. */
  readonly items: readonly {
    readonly host: string | undefined;
    readonly line: string;
  }[];
}

/** The words of the control. */
export interface CopyRunMenuLabels {
  /** The button's word after the `▶`, e.g. `copy`. */
  readonly copy: string;
  /** The menu button's tooltip, e.g. `copy the run command — pick where the gate runs`. */
  readonly pick: string;
  /** The item that runs on this machine (`host` undefined). */
  readonly thisMac: string;
  /** What a copied line is called when `onCopy` reports it, e.g. `dispatch line`. */
  readonly line: string;
}

export interface CopyRunMenuProps {
  readonly view: CopyRunMenuView;
  readonly className: string;
  readonly labels: CopyRunMenuLabels;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Records the picked host (`undefined` = this mac) for the project. */
  readonly onPickHost: (host: string | undefined) => void;
  /** The owner copies; this menu only says what and how it is labelled. */
  readonly onCopy: (text: string, label: string) => void;
  /** The menu root, so the caller's dismiss edge can tell an inside click. */
  readonly rootRef: RefObject<HTMLSpanElement>;
}

export function CopyRunMenu({
  view,
  className,
  labels,
  open,
  onOpenChange,
  onPickHost,
  onCopy,
  rootRef,
}: CopyRunMenuProps) {
  const lastLine = view.lastLine;

  if (!view.hasMenu) {
    return (
      <span class="bl-copymenu" ref={rootRef}>
        <button
          type="button"
          class={className}
          title={lastLine}
          data-dispatch={lastLine}
          onClick={() => onCopy(lastLine, labels.line)}
        >
          ▶ {labels.copy}
        </button>
      </span>
    );
  }

  const choose = (host: string | undefined, line: string) => {
    onCopy(line, labels.line);
    onPickHost(host);
    onOpenChange(false);
  };

  return (
    <span class="bl-copymenu" ref={rootRef}>
      <button
        type="button"
        class={className}
        title={labels.pick}
        aria-haspopup="menu"
        aria-expanded={open}
        data-dispatch={lastLine}
        onClick={() => onOpenChange(!open)}
      >
        ▶ {labels.copy} ▾
      </button>
      {open && (
        <div class="bl-copymenu-list" role="menu">
          {view.items.map(({ host, line }) => (
            <button
              key={host ?? ""}
              type="button"
              role="menuitem"
              class="bl-copymenu-item"
              onClick={() => choose(host, line)}
            >
              {host ?? labels.thisMac}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
