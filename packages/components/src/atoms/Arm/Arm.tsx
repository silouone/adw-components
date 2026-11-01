import "./Arm.css";

// `<Arm/>`: one control of the focus panel's action bar — a hairline button, glyph +
// lowercase verb, dim until hovered. It is presentational: the action bar owns the
// arming, so it can hide the right group while one control is armed. A filled block
// is a status, never a control, so no tone here sets a background.

export interface ArmProps {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly tone: "live" | "bad" | "ok" | "dim";
  readonly armed?: boolean;
  readonly dashed?: boolean;
  readonly disabled?: boolean;
  readonly armMs?: number;
  /** The rail passes "rail": the button renders `arm-rail`. */
  readonly density?: "rail" | undefined;
  readonly onClick: () => void;
}

export function Arm({
  id,
  glyph,
  label,
  tone,
  armed = false,
  dashed = false,
  disabled = false,
  armMs,
  density,
  onClick,
}: ArmProps) {
  const rail = density === "rail" ? " arm-rail" : "";
  return (
    <button
      type="button"
      class={`arm t-${tone}${rail}${armed ? " armed" : ""}${dashed ? " dashed" : ""}`}
      data-arm={id}
      disabled={disabled}
      style={armMs === undefined ? undefined : `--arm-ms:${armMs}ms`}
      onClick={onClick}
    >
      {armed ? label : `${glyph} ${label}`}
    </button>
  );
}
