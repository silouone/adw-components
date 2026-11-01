import "./Dock.css";

// `<Dock/>`: the run panel's full content — the status/crumb/tools row, the rail (always fully
// rendered, one entry per drawn box) and the one active scope's section.
//
// Pure: the active `scope` arrives as a prop and every change reports through a callback.
// `scope === undefined` means the dock is closed: the pane empties, the rail stays. Only the box
// matching `scope` is mounted in the pane, and the pane carries `key={scope}`, so Preact reuses
// the same DOM node across an update that leaves the scope unchanged (its `scrollTop` survives)
// while a real scope switch mounts a new section.

import { DockStrip } from "../../atoms/DockStrip/DockStrip";
import {
  Drawer,
  type DrawerBlock,
  type DrawerFigures,
  type DrawerLabels,
  type DrawerView,
} from "../Drawer/Drawer";
import type { FailurePaneView } from "../FailureView/FailureView";
import { isToggleClick, type RunStatusView } from "../RunHeader/RunHeader";
import {
  RunScopeSection,
  type RunScopeLabels,
  type RunSummaryView,
} from "../RunScopeSection/RunScopeSection";

/** One block drawn in a box, with the lane role it was filed into. */
export interface DockMember {
  readonly role: string;
  readonly block: DrawerBlock;
}

export interface DockDrawerEntry {
  readonly key: string;
  readonly member: DockMember;
  readonly drawer?: DrawerView;
  readonly failure?: FailurePaneView;
  readonly figures: DrawerFigures;
}

/** One drawn box on the rail. `outcomeClass` is the box's state class (`ok`, `bad`, `live`, ...). */
export interface DockRailEntry {
  readonly key: string;
  readonly box: { readonly label: string; readonly outcomeClass: string };
  readonly dur: string;
  readonly drawers: readonly DockDrawerEntry[];
}

export interface DockView extends RunStatusView {
  /** The rail key the failing node's banner opens. */
  readonly failureScope?: string;
  /** The one-line failure shown on a shut dock's strip. */
  readonly stripLine?: string;
  readonly rail: readonly DockRailEntry[];
}

/** What the overview's banner says about a blocked run. */
export interface DockFailure {
  readonly headline: string;
  readonly gate?: string;
}

export interface DockLabels {
  readonly overview: string;
  readonly run: string;
  readonly blockedAt: string;
  readonly gate: string;
  readonly open: string;
  readonly restoreGantt: string;
  readonly fullScreen: string;
  readonly markdown: string;
  readonly raw: string;
  readonly markdownTitle: string;
  readonly close: string;
  readonly drawer: DrawerLabels;
  readonly scope: RunScopeLabels;
}

export interface DockProps {
  /** The blocked run's failure, for the overview banner; `undefined` for a run with none. */
  readonly failure?: DockFailure | undefined;
  readonly view: DockView;
  readonly summary: RunSummaryView;
  /** `"run"` for the overview, a rail key for a step, `undefined` when the dock is closed. */
  readonly scope: string | undefined;
  readonly shut: boolean;
  readonly full: boolean;
  readonly md: boolean;
  readonly labels: DockLabels;
  readonly onScope: (scope: string) => void;
  readonly onClose: () => void;
  readonly onShutDock: () => void;
  readonly onFullScreen: () => void;
  readonly onMarkdownToggle: () => void;
}

function StepSection({
  drawers,
  labels,
}: {
  readonly drawers: readonly DockDrawerEntry[];
  readonly labels: DrawerLabels;
}) {
  return (
    <div class="rp-s">
      <div class="rp-sb">
        {drawers.map((d) => (
          <Drawer
            key={d.key}
            block={d.member.block}
            laneRole={d.member.role}
            figures={d.figures}
            labels={labels}
            {...(d.drawer !== undefined ? { drawer: d.drawer } : {})}
            {...(d.failure !== undefined ? { failure: d.failure } : {})}
          />
        ))}
      </div>
    </div>
  );
}

/** The one-line pointer at the top of a blocked run's overview: a button only when there is a box to open. */
function FailureBanner({
  node,
  failure,
  failureScope,
  labels,
  onScope,
}: {
  readonly node: string;
  readonly failure: DockFailure;
  readonly failureScope?: string;
  readonly labels: DockLabels;
  readonly onScope: (scope: string) => void;
}) {
  const text = `✕ ${labels.blockedAt} ${node} — ${failure.headline}${
    failure.gate !== undefined ? ` · ${labels.gate} ${failure.gate}` : ""
  }`;
  if (failureScope === undefined) return <div class="dock-banner">{text}</div>;
  return (
    <button
      type="button"
      class="dock-banner"
      onClick={() => {
        onScope(failureScope);
      }}
    >
      <span>{text}</span>
      <b>{labels.open} ▸</b>
    </button>
  );
}

export function Dock({
  failure,
  view,
  summary,
  scope,
  shut,
  full,
  md,
  labels,
  onScope,
  onClose,
  onShutDock,
  onFullScreen,
  onMarkdownToggle,
}: DockProps) {
  const { failedNode, failureScope } = view;
  const activeEntry =
    scope !== undefined && scope !== "run"
      ? view.rail.find((entry) => entry.key === scope)
      : undefined;

  const backToRun = (e: MouseEvent) => {
    e.preventDefault();
    onScope("run");
  };

  return (
    <div class={`rp${shut ? " shut" : ""}`} id="rp">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: mouse-only toggle on the header bar; the tools row buttons are the keyboard path */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: same reason */}
      <div
        class="rp-kpis"
        onClick={(e) => {
          if (isToggleClick(e.target)) onShutDock();
        }}
      >
        <div class="rp-id">
          <span class="chev" aria-hidden="true">
            {shut ? "▸" : "▾"}
          </span>
          <span class={`st ${view.cls}`}>{view.text}</span>
          <nav class="rp-crumb" id="rp-crumb">
            {scope === "run" || scope === undefined ? (
              <b>{labels.run}</b>
            ) : (
              <>
                {/* biome-ignore lint/a11y/useValidAnchor: a "back to run" breadcrumb gesture styled by `.rp-crumb a`; preventDefault stops the href from navigating */}
                <a href="#" onClick={backToRun}>
                  {labels.run}
                </a>{" "}
                ▸ <b>{activeEntry?.box.label ?? scope}</b>
              </>
            )}
          </nav>
          {shut && (
            <DockStrip {...(view.stripLine !== undefined ? { line: view.stripLine } : {})} />
          )}
        </div>
        <div class="rp-tools">
          <button
            type="button"
            class={`rp-t${full ? " on" : ""}`}
            title={full ? labels.restoreGantt : labels.fullScreen}
            onClick={() => onFullScreen()}
          >
            {full ? "⤡" : "⤢"}
          </button>
          <button
            type="button"
            class={`rp-t${md ? " on" : ""}`}
            title={labels.markdownTitle}
            onClick={() => onMarkdownToggle()}
          >
            {md ? labels.raw : labels.markdown}
          </button>
          <button type="button" class="rp-t rp-x" title={labels.close} onClick={() => onClose()}>
            ✕
          </button>
        </div>
      </div>
      {!shut && (
        <div class="rp-sections" id="rp-sections">
          <nav class="rp-steps">
            <button
              type="button"
              class={`rp-step${scope === "run" ? " on" : ""}`}
              data-rail="run"
              onClick={() => onScope("run")}
            >
              <b>{labels.overview}</b>
              <span>{labels.run}</span>
            </button>
            {view.rail.map(({ key, box, dur }) => (
              <button
                key={key}
                type="button"
                class={`rp-step ${box.outcomeClass}${scope === key ? " on" : ""}`}
                data-rail={key}
                title={box.label}
                onClick={() => onScope(key)}
              >
                <b>{box.label}</b>
                <span>{dur}</span>
              </button>
            ))}
          </nav>
          <div class="rp-pane" id="rp-pane" key={scope ?? "closed"}>
            {scope === "run" && failedNode !== undefined && failure !== undefined && (
              <FailureBanner
                node={failedNode}
                failure={failure}
                labels={labels}
                {...(failureScope !== undefined ? { failureScope } : {})}
                onScope={onScope}
              />
            )}
            {scope === "run" && (
              <RunScopeSection summary={summary} mdOn={md} labels={labels.scope} />
            )}
            {activeEntry !== undefined && (
              <StepSection drawers={activeEntry.drawers} labels={labels.drawer} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
