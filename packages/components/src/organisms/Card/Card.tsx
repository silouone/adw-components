import "./Card.css";

// `<Card/>`: a pure function of its `CardView`. Every value the card prints — status,
// ids and links, ages, costs, token text, the attempt dots — is already in the view; the
// component only lays it out. The words that are not in the view (titles, the copy control,
// the ship chip) arrive as `labels`.

import {
  BaseRedChip,
  type BaseRedLabels,
  type RunBaseRed,
} from "../../atoms/BaseRedChip/BaseRedChip";
import { CopyId } from "../../atoms/CopyId/CopyId";
import { Kpi, KpiToneContext } from "../../atoms/Kpi/Kpi";
import { PrChips, type PrView } from "../../molecules/PrChips/PrChips";
import { StepThread, type StepThreadView } from "../../molecules/StepThread/StepThread";

/** Where the latest run's gates ran. */
export interface CardGateHost {
  readonly host: string;
  /** The gates that ran there. */
  readonly gates: readonly string[];
  /** The gates that re-ran locally because the host was unreachable. */
  readonly fellBack: readonly string[];
}

export interface CardView {
  readonly ticketId: string;
  readonly health: string;
  readonly live: boolean;
  readonly paused: boolean;
  readonly blockedCause: boolean;
  readonly beacon: string;
  readonly beaconTone: string;
  readonly nowText: string;
  readonly nowTone: string;
  readonly nowTitle: string;
  readonly timeText: string;
  readonly hue: string;
  readonly idHref: string;
  readonly headShort: string;
  readonly headTitle: string;
  readonly title: string;
  readonly providers: readonly {
    readonly name: string;
    readonly glyph: string;
  }[];
  readonly baseRed: RunBaseRed | undefined;
  readonly gateHost: CardGateHost | undefined;
  readonly ago: string;
  readonly autoLine: string | undefined;
  readonly steps: StepThreadView;
  readonly cost: {
    readonly value: string;
    readonly title: string;
    readonly estNone: boolean;
  };
  readonly rounds: { readonly value: string; readonly title: string } | undefined;
  readonly timeTitle: string;
  readonly tokens: { readonly value: string; readonly title: string };
  readonly pr: PrView | undefined;
  readonly latestPr:
    | { readonly url: string; readonly number: number; readonly state?: string }
    | undefined;
  readonly attempts: readonly {
    readonly runId: string;
    readonly cls: string;
    readonly href: string;
    readonly title: string;
    readonly glyph: string;
  }[];
  /** The `adw publish` recipe when finished work can be shipped; else none. */
  readonly shipTitle: string | undefined;
}

/** The words of the card that its view does not carry. */
export interface CardLabels {
  readonly baseRed: BaseRedLabels;
  /** Before the ticket id in the copy control's accessible name, e.g. `copy`. */
  readonly copy: string;
  /** The copy control's flash after a click. */
  readonly copied: string;
  /** The hover card of the step thread's trailing wait dot. */
  readonly waitingForSlot: string;
  /** Before a provider's name in its tooltip, e.g. `built by`. */
  readonly builtBy: string;
  /** The tooltip of the provider mark when both providers built the ticket. */
  readonly bothProviders: string;
  /** After the fallen-back gates, e.g. `re-ran on this mac`. */
  readonly reranLocally: string;
  /** Between the gates and the host in a remote host's tooltip, e.g. `ran on`. */
  readonly ranOn: string;
  /** Before the host in the tooltip of a host that has run no gate yet, e.g. `queued for a slot on`. */
  readonly queuedOn: string;
  /** After the attempt count in the attempt dots' tooltip, e.g. `attempts, oldest first`. */
  readonly attemptsOldestFirst: string;
  /** The ship chip's word; the component adds its `▸`. */
  readonly ship: string;
}

export interface CardProps {
  readonly view: CardView;
  readonly labels: CardLabels;
  /** Copies the full ticket id (the container owns the clipboard). */
  readonly onCopy: (text: string) => void;
  /** This ticket is the board's selection. */
  readonly selected?: boolean;
  /** Called with the ticket id when the card body is clicked. */
  readonly onSelect?: (ticketId: string) => void;
}

/** A click on the card or row body selects it; the id link and any button keep their own behaviour. */
export function selectOnClick(
  ticketId: string,
  onSelect: ((ticketId: string) => void) | undefined,
): (e: MouseEvent) => void {
  return (e) => {
    if (onSelect === undefined) return;
    if ((e.target as Element).closest("a,button") !== null) return;
    onSelect(ticketId);
  };
}

/** Where the latest run's gates ran, when that says something: `⇢ m1max` for a gate host,
 * `m1max → local` (warn) when the host was unreachable and a gate fell back. Nothing for gates
 * that all ran here, nor before the first gate. */
function HostChip({
  gateHost,
  labels,
}: {
  readonly gateHost: CardGateHost | undefined;
  readonly labels: CardLabels;
}) {
  if (gateHost === undefined) return null;
  if (gateHost.host === "local") return null;
  if (gateHost.fellBack.length > 0) {
    return (
      <span class="tc-host warn" title={`${gateHost.fellBack.join(", ")} ${labels.reranLocally}`}>
        {gateHost.host} → local
      </span>
    );
  }
  return (
    <span
      class="tc-host remote"
      title={
        gateHost.gates.length > 0
          ? `${gateHost.gates.join(", ")} ${labels.ranOn} ${gateHost.host}`
          : `${labels.queuedOn} ${gateHost.host}`
      }
    >
      ⇢ {gateHost.host}
    </span>
  );
}

// Four rows: top (id, provider, host, age), the title as a sentence, the step thread, and a
// foot holding the now line and the KPIs.
function CardBody({ view: v, labels, onCopy, selected = false, onSelect }: CardProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: selection is mouse-only on the card body; the id link and the network tree's leaf are the keyboard path
    // biome-ignore lint/a11y/noStaticElementInteractions: selection is mouse-only on the card body; the id link and the network tree's leaf are the keyboard path
    <div
      class={`tc ${v.paused ? "paused" : v.live ? "live" : v.health}${selected ? " sel" : ""}`}
      style={{ "--hue": v.hue }}
      data-health={v.health}
      data-ticket={v.ticketId}
      {...(selected ? { "data-selected": "true" } : {})}
      onClick={selectOnClick(v.ticketId, onSelect)}
    >
      <div class="tc-top">
        <i class={`tc-beacon ${v.beaconTone}`}>{v.beacon}</i>
        <a class="tc-id" href={v.idHref} title={v.ticketId}>
          {v.headShort}
        </a>
        <span class="tc-meta">
          {v.providers.length > 0 && (
            <span
              class="tc-prov"
              title={
                v.providers.length > 1
                  ? labels.bothProviders
                  : `${labels.builtBy} ${v.providers[0]?.name}`
              }
            >
              {v.providers.map((p) => (
                <i key={p.name} class={`prov ${p.name}`} title={`${labels.builtBy} ${p.name}`}>
                  {p.glyph}
                </i>
              ))}
            </span>
          )}
          <BaseRedChip baseRed={v.baseRed} labels={labels.baseRed} />
          <HostChip gateHost={v.gateHost} labels={labels} />
          <span class="tc-ago">{v.ago}</span>
          <CopyId
            ticketId={v.ticketId}
            onCopy={onCopy}
            label={`${labels.copy} ${v.ticketId}`}
            copiedLabel={labels.copied}
          />
        </span>
      </div>
      <div class="tc-title" title={v.headTitle}>
        {v.title}
      </div>
      <StepThread view={v.steps} waitLabel={labels.waitingForSlot} />
      <div class="tc-foot">
        <div class={`tc-now ${v.nowTone}`} title={v.nowTitle}>
          {v.nowText}
          {v.autoLine !== undefined && <span class="tc-auto"> · {v.autoLine}</span>}
        </div>
        <div class="tc-kpis">
          <Kpi
            cls={v.cost.estNone ? "kpi-cost est-none" : "kpi-cost"}
            glyph="$"
            value={v.cost.value}
            title={v.cost.title}
          />
          {v.rounds !== undefined && (
            <Kpi cls="kpi-rounds" glyph="↻" value={v.rounds.value} title={v.rounds.title} />
          )}
          <Kpi cls="kpi-time" glyph="◷" value={v.timeText} title={v.timeTitle} />
          <Kpi cls="kpi-tok-total" glyph="Σ" value={v.tokens.value} title={v.tokens.title} />
          <KpiToneContext.Provider value="card-end">
            <div class="tc-end">
              <PrChips pr={v.pr} />
              {v.latestPr !== undefined && v.pr?.kind !== "pr" && (
                <div class="tc-pr">
                  <a class="pr-num" href={v.latestPr.url} target="_blank" rel="noopener noreferrer">
                    #{v.latestPr.number}
                    {v.latestPr.state !== undefined ? ` ${v.latestPr.state}` : ""}
                  </a>
                </div>
              )}
              {v.attempts.length > 1 && (
                <span class="tc-att" title={`${v.attempts.length} ${labels.attemptsOldestFirst}`}>
                  {v.attempts.map((a) => (
                    <a key={a.runId} class={a.cls} href={a.href} title={a.title}>
                      {a.glyph}
                    </a>
                  ))}
                </span>
              )}
              {v.shipTitle !== undefined && (
                <span class="tc-ship" title={v.shipTitle}>
                  {labels.ship} ▸
                </span>
              )}
            </div>
          </KpiToneContext.Provider>
        </div>
      </div>
    </div>
  );
}

export function Card(props: CardProps) {
  return (
    <KpiToneContext.Provider value="card">
      <CardBody {...props} />
    </KpiToneContext.Provider>
  );
}
