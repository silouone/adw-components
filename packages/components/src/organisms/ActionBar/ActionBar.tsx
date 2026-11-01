import "./ActionBar.css";

// `<ActionBar/>`: the focus panel's arm-then-confirm bar. The first click arms a control
// (its label becomes the exact consequence and an underline drains over `armMs`); a second
// click inside the window fires it; the window lapsing, or any click elsewhere, disarms.
// While one is armed the right-hand group is hidden.
//
// Pause, resume, kill, requeue and boost go out through `onAction`; publish never posts, it
// hands its command to `onCopy`; "open run" asks the page through `onStage`. A click
// elsewhere is the page's to see, not the component's: it bumps `awayKey` and the bar
// disarms.
//
// The arming lives here, keyed by action id — not by card identity — because the board's
// stream replaces the card object every frame and a mid-arm update must not disarm.

import { useEffect, useRef, useState } from "preact/hooks";
import { Arm } from "../../atoms/Arm/Arm";

export const ARM_MS = 4000;
const COPIED_MS = 1200;

export type PauseVerb = "pause" | "resume" | "kill" | "requeue" | "boost" | "continue" | "retry";

export interface PauseScope {
  readonly target: string;
  /** Absent = the whole project. */
  readonly ticket?: string;
}

/** Posts the verb; `undefined` = done, else a short failure text. */
export type PauseAction = (
  verb: PauseVerb,
  scope: PauseScope,
  token: string,
) => Promise<string | undefined>;

export type ActionId =
  | "pause"
  | "pausing"
  | "resume"
  | "kill"
  | "publish"
  | "requeue"
  | "continue"
  | "retry"
  | "boost"
  | "open"
  | "pr";

export interface ActionSpec {
  readonly id: ActionId;
  readonly glyph: string;
  readonly verb: string;
  readonly tone: "live" | "bad" | "ok" | "dim";
  /** `post`: arm, then post · `copy`: one click copies · `link`: an anchor · `open`: asks
   * for the run stage · `disabled`: shown, inert. */
  readonly mode: "post" | "copy" | "link" | "open" | "disabled";
  readonly armedLabel?: string;
  /** The label while a `post` is in flight; defaults to `<verb>…`. */
  readonly busyLabel?: string;
  readonly post?: PauseVerb;
  readonly copy?: string;
  readonly href?: string;
  readonly dashed?: boolean;
}

export interface ActionBarView {
  readonly left: readonly ActionSpec[];
  readonly right: readonly ActionSpec[];
  /** The target and ticket every `post` action addresses. */
  readonly scope: PauseScope;
}

/** The words of the bar that its view does not carry. */
export interface ActionBarLabels {
  /** The control's label for a moment after a copy. */
  readonly copied: string;
}

export interface ActionBarProps {
  /** The actions and the scope they post to. */
  readonly view: ActionBarView;
  readonly labels: ActionBarLabels;
  readonly token: string;
  readonly onAction: PauseAction;
  readonly onCopy: (text: string) => void;
  /** "open run" asks the page to put the run on the stage. */
  readonly onStage: (stage: "board" | "run") => void;
  readonly armMs?: number;
  /** The rail passes "rail": `actions-rail` and `arm-rail`. */
  readonly density?: "rail" | undefined;
  /** The page bumps it on a click outside the bar; each change disarms. */
  readonly awayKey?: number;
}

export function ActionBar({
  view,
  labels,
  token,
  onAction,
  onCopy,
  onStage,
  armMs = ARM_MS,
  density,
  awayKey,
}: ActionBarProps) {
  const { left, right, scope } = view;
  const [armedId, setArmedId] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);
  const [flashId, setFlashId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(armTimer.current);
      clearTimeout(flashTimer.current);
    },
    [],
  );

  // The armed action can leave the bar (the run finished): drop the arming.
  const armed = armedId !== undefined && left.some((s) => s.id === armedId) ? armedId : undefined;
  useEffect(() => {
    if (armedId !== undefined && armed === undefined) setArmedId(undefined);
  }, [armedId, armed]);

  const disarm = (): void => {
    clearTimeout(armTimer.current);
    armTimer.current = undefined;
    setArmedId(undefined);
  };

  // A click away from the bar, reported by the page, disarms.
  useEffect(() => {
    if (awayKey !== undefined) disarm();
  }, [awayKey]);

  const flash = (id: string): void => {
    setFlashId(id);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      if (mounted.current) setFlashId(undefined);
    }, COPIED_MS);
  };

  const fire = (spec: ActionSpec): void => {
    if (spec.mode === "post" && spec.post !== undefined) {
      setBusyId(spec.id);
      setError(undefined);
      void onAction(spec.post, scope, token).then((failure) => {
        if (!mounted.current) return;
        setBusyId(undefined);
        setError(failure);
      });
      return;
    }
    if (spec.copy !== undefined) {
      onCopy(spec.copy);
      flash(spec.id);
    }
  };

  const click = (spec: ActionSpec): void => {
    if (busyId !== undefined) return;
    if (spec.mode === "open") {
      onStage("run");
      return;
    }
    if (spec.mode === "copy") {
      fire(spec);
      return;
    }
    if (armed !== spec.id) {
      setError(undefined);
      clearTimeout(armTimer.current);
      setArmedId(spec.id);
      armTimer.current = setTimeout(disarm, armMs);
      return;
    }
    disarm();
    fire(spec);
  };

  const control = (spec: ActionSpec) => {
    if (spec.mode === "link") {
      return (
        <a
          key={spec.id}
          class={`arm t-${spec.tone}${density === "rail" ? " arm-rail" : ""}`}
          data-arm={spec.id}
          href={spec.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {spec.glyph} {spec.verb}
        </a>
      );
    }
    const isArmed = armed === spec.id;
    const label = isArmed
      ? (spec.armedLabel ?? spec.verb)
      : busyId === spec.id
        ? (spec.busyLabel ?? `${spec.verb}…`)
        : flashId === spec.id
          ? labels.copied
          : spec.verb;
    return (
      <Arm
        key={spec.id}
        id={spec.id}
        glyph={spec.glyph}
        label={label}
        tone={spec.tone}
        armed={isArmed}
        dashed={spec.dashed === true}
        disabled={spec.mode === "disabled" || busyId === spec.id}
        armMs={armMs}
        density={density}
        onClick={() => click(spec)}
      />
    );
  };

  return (
    <div class={`actions${density === "rail" ? " actions-rail" : ""}`}>
      <div class="actions-left">{left.map(control)}</div>
      {armed === undefined && <div class="actions-right">{right.map(control)}</div>}
      {error !== undefined && <span class="arm-err">{error}</span>}
    </div>
  );
}
