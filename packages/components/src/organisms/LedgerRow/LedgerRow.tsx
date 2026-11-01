import "./LedgerRow.css";

// `<LedgerRow/>`: one ticket as a board row — eleven fixed columns so the strips
// align down the page (the ledger view). The same selectable thing as `<Card/>`: same
// `data-ticket`, same run link as the click target. What it says about the run is in the
// view, the same status text `Card` prints, so the two views cannot disagree. The words
// that are not in the view arrive as `labels`.

import { BaseRedChip, type BaseRedLabels } from "../../atoms/BaseRedChip/BaseRedChip";
import { KpiToneContext } from "../../atoms/Kpi/Kpi";
import { PhaseStrip, type PhaseStripView } from "../../molecules/PhaseStrip/PhaseStrip";
import { PrChips } from "../../molecules/PrChips/PrChips";
import { type CardView, selectOnClick } from "../Card/Card";

export interface LedgerRowView {
  readonly card: Pick<
    CardView,
    | "ticketId"
    | "health"
    | "live"
    | "paused"
    | "hue"
    | "beacon"
    | "beaconTone"
    | "idHref"
    | "headShort"
    | "headTitle"
    | "providers"
    | "nowText"
    | "nowTone"
    | "nowTitle"
    | "timeText"
    | "baseRed"
    | "pr"
    | "latestPr"
    | "attempts"
  >;
  readonly lane: string;
  readonly strip: PhaseStripView;
  readonly where: string;
  readonly costText: string;
  readonly costTitle: string | undefined;
  readonly tokText: string;
}

/** The words of the row that its view does not carry. */
export interface LedgerRowLabels {
  readonly baseRed: BaseRedLabels;
  /** Before a provider's name in its tooltip, e.g. `built by`. */
  readonly builtBy: string;
  /** After the attempt count in the attempt dots' tooltip, e.g. `attempts, oldest first`. */
  readonly attemptsOldestFirst: string;
}

export interface LedgerRowProps {
  readonly view: LedgerRowView;
  readonly labels: LedgerRowLabels;
  readonly selected?: boolean;
  readonly onSelect?: (ticketId: string) => void;
}

function LedgerRowBody({ view, labels, selected = false, onSelect }: LedgerRowProps) {
  const v = view.card;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: selection is mouse-only on the row body; the id link and the network tree's leaf are the keyboard path
    // biome-ignore lint/a11y/noStaticElementInteractions: selection is mouse-only on the row body; the id link and the network tree's leaf are the keyboard path
    <div
      class={`lr ${v.paused ? "paused" : v.live ? "live" : v.health}${selected ? " sel" : ""}`}
      style={{ "--hue": v.hue }}
      data-health={v.health}
      data-ticket={v.ticketId}
      {...(selected ? { "data-selected": "true" } : {})}
      onClick={selectOnClick(v.ticketId, onSelect)}
    >
      <i class={`lr-beacon ${v.beaconTone}`}>{v.beacon}</i>
      <div class="lr-idt">
        <a class="lr-id" href={v.idHref} title={v.ticketId}>
          {v.headShort}
        </a>
        <span class="lr-title" title={v.headTitle}>
          {v.headTitle}
        </span>
      </div>
      <div class="lr-lane">
        <span class="tc-tag">{view.lane}</span>
        {v.providers.map((p) => (
          <i key={p.name} class={`prov ${p.name}`} title={`${labels.builtBy} ${p.name}`}>
            {p.glyph}
          </i>
        ))}
      </div>
      <div class={`lr-now ${v.nowTone}`} title={v.nowTitle}>
        {v.nowText}
      </div>
      <PhaseStrip view={view.strip} />
      <span class="lr-where">{view.where}</span>
      <span class="lr-time">{v.timeText}</span>
      <span class="lr-cost" title={view.costTitle}>
        {view.costText}
      </span>
      <span class="lr-tok">{view.tokText}</span>
      <div class="lr-end">
        <BaseRedChip baseRed={v.baseRed} labels={labels.baseRed} />
        <PrChips pr={v.pr} compact />
        {v.latestPr !== undefined && v.pr?.kind !== "pr" && (
          <div class="tc-pr lr-pr">
            <a class="pr-num" href={v.latestPr.url} target="_blank" rel="noopener noreferrer">
              #{v.latestPr.number}
              {v.latestPr.state !== undefined ? ` ${v.latestPr.state}` : ""}
            </a>
          </div>
        )}
      </div>
      <span
        class="lr-att"
        {...(v.attempts.length > 1
          ? { title: `${v.attempts.length} ${labels.attemptsOldestFirst}` }
          : {})}
      >
        {v.attempts.length > 1 &&
          v.attempts.map((a) => (
            <a key={a.runId} class={`${a.cls} lr-dot`} href={a.href} title={a.title}>
              {a.glyph}
            </a>
          ))}
      </span>
    </div>
  );
}

export function LedgerRow(props: LedgerRowProps) {
  return (
    <KpiToneContext.Provider value="row">
      <LedgerRowBody {...props} />
    </KpiToneContext.Provider>
  );
}
