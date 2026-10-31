import "./Kpi.css";

// The one chip primitive: `<span class="kpi {cls}" title><i>glyph</i>
// <b>value</b></span>`. With an `href` the same chip renders as an `<a>` opening
// in a new tab.

import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useContext } from "preact/hooks";

/** Where the chip sits: the card's light figures, the card's foot, a ledger row. */
export type KpiTone = "card" | "card-end" | "row";

/** The tone every `<Kpi>` below inherits, so a group of chips need not thread a prop. */
export const KpiToneContext = createContext<KpiTone | undefined>(undefined);

const toneClass = (tone: KpiTone | undefined): string =>
  tone === undefined ? "" : tone === "card-end" ? " kpi-card kpi-card-end" : ` kpi-${tone}`;

export interface KpiProps {
  readonly cls: string;
  readonly glyph: string;
  readonly value: ComponentChildren;
  readonly title: string;
  readonly href?: string;
  readonly tone?: KpiTone;
}

export function Kpi({ cls, glyph, value, title, href, tone }: KpiProps) {
  const inherited = useContext(KpiToneContext);
  const cls2 = toneClass(tone ?? inherited);
  const body = (
    <>
      <i>{glyph}</i>
      <b>{value}</b>
    </>
  );
  return href === undefined ? (
    <span class={`kpi ${cls}${cls2}`} title={title}>
      {body}
    </span>
  ) : (
    <a
      class={`kpi ${cls}${cls2} kpi-link`}
      title={title}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {body}
    </a>
  );
}
