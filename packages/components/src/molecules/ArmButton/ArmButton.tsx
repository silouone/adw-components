import "./ArmButton.css";

// `<ArmButton/>`: a two-click control. The first click arms it and shows
// `armedLabel` (which names what it will act on); a second click within `armMs`
// fires `onFire`. The arming lapses by itself, so a stray click never leaves a
// loaded button behind. Lives inside `<summary>` too, so every click stops
// propagation — it must not toggle the enclosing `<details>`.

import { useEffect, useRef, useState } from "preact/hooks";

const ARM_MS = 4000;

export interface ArmButtonProps {
  readonly label: string;
  readonly armedLabel: string;
  /** `undefined` = done, else the failure text to show. */
  readonly onFire: () => Promise<string | undefined>;
  readonly armMs?: number;
}

export function ArmButton({ label, armedLabel, onFire, armMs = ARM_MS }: ArmButtonProps) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(timer.current);
    },
    [],
  );

  const disarm = (): void => {
    clearTimeout(timer.current);
    timer.current = undefined;
    setArmed(false);
  };

  const click = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!armed) {
      setFailure(undefined);
      setArmed(true);
      timer.current = setTimeout(disarm, armMs);
      return;
    }
    disarm();
    setBusy(true);
    void onFire().then((text) => {
      if (!mounted.current) return;
      setBusy(false);
      setFailure(text);
    });
  };

  return (
    <>
      <button
        type="button"
        class={`arm-btn${armed ? " armed" : ""}`}
        disabled={busy}
        onClick={click}
      >
        {armed ? armedLabel : label}
      </button>
      {failure !== undefined && <span class="arm-err">{failure}</span>}
    </>
  );
}
