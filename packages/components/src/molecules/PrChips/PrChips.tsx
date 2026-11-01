import "./PrChips.css";

// The card's PR chip row. A pure function of one `PrView`. `undefined` is the "no PR"
// absence and renders NOTHING — not an empty row. The row is a flat flex list of sibling
// chips, so a third verdict can append later.
//
// Every word is in the view: each chip arrives with its label and its tooltip, already
// worded by the caller. The component picks the glyph and the colour class from `kind`.

import { NEUTRAL_GLYPH } from "../../glyphs";
import { Kpi } from "../../atoms/Kpi/Kpi";

export interface CiView {
  readonly kind: "passing" | "failing" | "no-verdict";
  /** The chip text; for a failing check, its name. */
  readonly label: string;
  readonly title: string;
  /** Failing only: the job the name links to. */
  readonly url?: string;
}

export interface ValidationView {
  readonly kind:
    | "merged"
    | "rejected"
    | "approved"
    | "changes-requested"
    | "review-required"
    | "awaiting";
  readonly label: string;
  /** The ledger row's shorter label; the tooltip keeps the full wording. */
  readonly compactLabel?: string;
  readonly title: string;
  /** Merged only: adds a superscript dot to the label. */
  readonly withoutApproval?: boolean;
}

export interface MergeView {
  readonly kind: "conflicts" | "behind" | "parked";
  readonly label: string;
  readonly title: string;
}

export interface PrAbsentView {
  readonly kind: "no-repo" | "unavailable" | "unfetched";
  readonly label: string;
  readonly title: string;
}

export interface PrFoundView {
  readonly kind: "pr";
  readonly number: number;
  readonly url: string;
  readonly ci: CiView;
  readonly validation?: ValidationView;
  readonly merge?: MergeView;
}

export type PrView = PrFoundView | PrAbsentView;

const CI_GLYPH = { passing: "◉", failing: "◉", "no-verdict": NEUTRAL_GLYPH } as const;
const CI_CLASS = { passing: "ok", failing: "bad", "no-verdict": "none" } as const;

const VALIDATION_GLYPH: Readonly<Record<ValidationView["kind"], string>> = {
  merged: "✓",
  rejected: "✕",
  approved: "✓",
  "changes-requested": "⚑",
  "review-required": "⧗",
  awaiting: "⧗",
};

const MERGE_GLYPH: Readonly<Record<MergeView["kind"], string>> = {
  conflicts: "⚠",
  behind: "↓",
  parked: "⏸",
};

const ABSENT_GLYPH: Readonly<Record<PrAbsentView["kind"], string>> = {
  "no-repo": "∅",
  unavailable: "⚠",
  unfetched: "…",
};

export function Ci({ ci }: { readonly ci: CiView }) {
  return (
    <Kpi
      cls={`pr-ci ${CI_CLASS[ci.kind]}`}
      glyph={CI_GLYPH[ci.kind]}
      value={
        ci.kind === "failing" && ci.url !== undefined ? (
          <a href={ci.url} target="_blank" rel="noopener noreferrer">
            {ci.label}
          </a>
        ) : (
          ci.label
        )
      }
      title={ci.title}
    />
  );
}

/** Every review verdict links to the PR itself: the verdict is what the operator acts on,
 * so it is the click target, not the faint `#N`. */
function Validation({
  v,
  url,
  compact,
}: {
  readonly v: ValidationView;
  readonly url: string;
  readonly compact: boolean;
}) {
  const label = compact ? (v.compactLabel ?? v.label) : v.label;
  return (
    <Kpi
      href={url}
      cls={`pr-val ${v.kind}`}
      glyph={VALIDATION_GLYPH[v.kind]}
      value={
        v.kind === "merged" && v.withoutApproval === true ? (
          <>
            {label}
            <sup class="pr-dot">•</sup>
          </>
        ) : (
          label
        )
      }
      title={v.title}
    />
  );
}

function Merge({ m }: { readonly m: MergeView }) {
  return (
    <Kpi cls={`pr-merge ${m.kind}`} glyph={MERGE_GLYPH[m.kind]} value={m.label} title={m.title} />
  );
}

export interface PrChipsProps {
  readonly pr: PrView | undefined;
  /** The ledger row's short labels; the card keeps the full ones. */
  readonly compact?: boolean;
}

export function PrChips({ pr, compact = false }: PrChipsProps) {
  if (pr === undefined) return null;
  return (
    <div class="pr-row">
      {pr.kind === "pr" ? (
        <>
          <Ci ci={pr.ci} />
          {pr.validation !== undefined && (
            <Validation v={pr.validation} url={pr.url} compact={compact} />
          )}
          {pr.merge !== undefined && <Merge m={pr.merge} />}
          <a class="pr-num" href={pr.url} target="_blank" rel="noopener noreferrer">
            #{pr.number}
          </a>
        </>
      ) : (
        <Kpi
          cls={`pr-absent${pr.kind === "unavailable" ? " warn" : ""}`}
          glyph={ABSENT_GLYPH[pr.kind]}
          value={pr.label}
          title={pr.title}
        />
      )}
    </div>
  );
}
