import "./CopyId.css";

// `<CopyId/>`: the card's hover-only `⧉` control. A click copies the full ticket id
// and flashes `copied`; it never follows the card's stretched link (the click's
// default is prevented and its bubbling stopped). The copy is a callback, the flash
// is a prop, and the words (`label`, `copiedLabel`) arrive as props.

import { useEffect, useRef, useState } from "preact/hooks";

const COPIED_MS = 1200;

export interface CopyIdProps {
  readonly ticketId: string;
  readonly onCopy: (text: string) => void;
  /** The control's accessible name and tooltip, e.g. the words for "copy <id>". */
  readonly label: string;
  /** The flash text shown for `flashMs` after a click. */
  readonly copiedLabel: string;
  readonly flashMs?: number;
  /** Show the control without hover, as the focus panel's head does. */
  readonly shown?: boolean;
}

export function CopyId({
  ticketId,
  onCopy,
  label,
  copiedLabel,
  flashMs = COPIED_MS,
  shown,
}: CopyIdProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const click = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    onCopy(ticketId);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), flashMs);
  };

  return (
    <button
      type="button"
      class={shown === true ? "tc-copy tc-copy-shown" : "tc-copy"}
      aria-label={label}
      title={label}
      onClick={click}
    >
      {copied ? copiedLabel : "⧉"}
    </button>
  );
}
