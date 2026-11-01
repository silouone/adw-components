import "./Dropdown.css";

// `<Dropdown/>`: the one gesture every top-bar chip shares. The panel opens while the
// pointer is over the chip or the panel, pins on click, and the page closes it on a
// click outside or Escape.
//
// Controlled: the page owns which dropdown is open and which is pinned, and hears
// every gesture through `onOpenChange`. The panel is `hidden`, never unmounted, so a
// search input inside it keeps its value and focus; focus inside the panel asks to pin
// it so typing is not cut off when the pointer leaves. The panel is a DOM child of
// `.dd`, so moving from chip to panel never leaves the hover target.

import type { ComponentChildren } from "preact";

export type DropdownChange = "enter" | "leave" | "toggle" | "focus";

export interface DropdownProps {
  readonly id: string;
  readonly open: boolean;
  readonly pinned: boolean;
  readonly onOpenChange: (change: DropdownChange) => void;
  /** The chip's face; the `▾` caret is added here. */
  readonly chip: ComponentChildren;
  readonly class?: string;
  /** Warn border on the chip while the panel is not pinned. */
  readonly warn?: boolean;
  readonly children: ComponentChildren;
}

export function Dropdown({
  id,
  open,
  pinned,
  onOpenChange,
  chip,
  class: cls,
  warn,
  children,
}: DropdownProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only reveals the panel; the chip button inside is the keyboard path
    <div
      class={`dd${pinned ? " dd-on" : ""}${cls === undefined ? "" : ` ${cls}`}`}
      data-dd={id}
      onMouseEnter={() => onOpenChange("enter")}
      onMouseLeave={() => onOpenChange("leave")}
    >
      <button
        type="button"
        class={warn === true && !pinned ? "dd-chip dd-chip-warn" : "dd-chip"}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => onOpenChange("toggle")}
      >
        {chip}
        <i>▾</i>
      </button>
      <div class="dd-panel" hidden={!open} onFocusIn={() => onOpenChange("focus")}>
        {children}
      </div>
    </div>
  );
}
