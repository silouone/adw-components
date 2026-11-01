import "./NetworkTree.css";

// `<NetworkTree/>`: rail 1 open — runners, their projects and their live runs as a tree.
// It draws the `NetworkRunner[]` the page derives and asks the page (callbacks) to change
// the filters, the rail, the expansion state and the selection; the filters, the
// selection and the folds arrive as props. The words arrive as `labels`.

import type { OnFilter } from "../FiltersPanel/FiltersPanel";

export interface Leaf {
  readonly ticketId: string;
  readonly short: string;
  readonly kind: "holder" | "agent" | "waiter";
  readonly glyph: "●" | "✳" | "⏳";
  readonly now: string;
  readonly title: string;
  readonly hue: number;
}

export interface NetworkProject {
  readonly name: string;
  readonly live: number;
  readonly leaves: readonly Leaf[];
}

export interface NetworkRunner {
  readonly key: string;
  readonly label: string;
  readonly kind: string;
  readonly planned: boolean;
  readonly status: "busy" | "idle" | "planned";
  /** The status dot's class: `live`, `ok` or `planned`. */
  readonly dot: string;
  readonly glyph: string;
  readonly note: string;
  readonly held: number;
  readonly total: number;
  readonly runs: number;
  readonly projects: readonly NetworkProject[];
}

/** The footer's counts. */
export interface NetworkTally {
  readonly live: number;
  readonly waiting: number;
  readonly agents: number;
}

/** The words of the tree that its view does not carry. */
export interface NetworkTreeLabels {
  readonly ariaLabel: string;
  readonly heading: (online: number, total: number) => string;
  readonly close: string;
  readonly fold: string;
  readonly unfold: string;
  readonly focusBoardOn: (name: string) => string;
  readonly runs: (n: number) => string;
  readonly slotsHeld: (held: number, total: number) => string;
  readonly notConfigured: string;
  readonly nothingRunning: string;
  readonly projectLive: (n: number) => string;
  readonly footer: (tally: NetworkTally) => string;
}

export interface NetworkTreeProps {
  readonly net: readonly NetworkRunner[];
  readonly tally: NetworkTally;
  readonly labels: NetworkTreeLabels;
  readonly hostFilter: string;
  readonly projFilter: string;
  readonly selected: string | null;
  readonly expandedRunners: ReadonlySet<string>;
  readonly collapsedProjects: ReadonlySet<string>;
  readonly onFilter: OnFilter;
  readonly onToggleRail: (open: boolean) => void;
  readonly onToggleRunner: (key: string) => void;
  /** The key is `<runner>/<project>`. */
  readonly onToggleProject: (key: string) => void;
  readonly onOpenRun: (ticketId: string) => void;
}

interface NodeActions {
  readonly labels: NetworkTreeLabels;
  readonly expandedRunners: ReadonlySet<string>;
  readonly collapsedProjects: ReadonlySet<string>;
  readonly onFilter: OnFilter;
  readonly onToggleRunner: (key: string) => void;
  readonly onToggleProject: (key: string) => void;
  readonly onOpenRun: (ticketId: string) => void;
}

export function NetworkTree({
  net,
  tally,
  labels,
  hostFilter,
  projFilter,
  selected,
  expandedRunners,
  collapsedProjects,
  onFilter,
  onToggleRail,
  onToggleRunner,
  onToggleProject,
  onOpenRun,
}: NetworkTreeProps) {
  const online = net.filter((r) => !r.planned).length;
  return (
    <aside class="rail rail1 net" data-rail="host" aria-label={labels.ariaLabel}>
      <div class="net-hd">
        <span>{labels.heading(online, net.length)}</span>
        <button
          type="button"
          class="toggle"
          title={labels.close}
          onClick={() => onToggleRail(false)}
        >
          ◧
        </button>
      </div>
      <div class="net-body">
        {net.map((r) => (
          <RunnerNode
            key={r.key}
            r={r}
            active={hostFilter === r.key}
            projFilter={projFilter}
            selected={selected}
            labels={labels}
            expandedRunners={expandedRunners}
            collapsedProjects={collapsedProjects}
            onFilter={onFilter}
            onToggleRunner={onToggleRunner}
            onToggleProject={onToggleProject}
            onOpenRun={onOpenRun}
          />
        ))}
      </div>
      <p class="net-ft">{labels.footer(tally)}</p>
    </aside>
  );
}

function RunnerNode({
  r,
  active,
  projFilter,
  selected,
  labels,
  expandedRunners,
  collapsedProjects,
  onFilter,
  onToggleRunner,
  onToggleProject,
  onOpenRun,
}: NodeActions & {
  readonly r: NetworkRunner;
  readonly active: boolean;
  readonly projFilter: string;
  readonly selected: string | null;
}) {
  const open = expandedRunners.has(r.key);
  const classes = ["nrun"];
  if (active) classes.push("on");
  if (r.planned) classes.push("planned");
  return (
    <div class="nr">
      <div class={classes.join(" ")} data-runner={r.key}>
        <button
          type="button"
          class="caret net-caret"
          title={open ? labels.fold : labels.unfold}
          disabled={r.planned}
          onClick={() => onToggleRunner(r.key)}
        >
          {open ? "▾" : "▸"}
        </button>
        <i class={`rdot ${r.dot}`} />
        <span class="g">{r.glyph}</span>
        <button
          type="button"
          class="nm"
          title={labels.focusBoardOn(r.label)}
          onClick={() => {
            // the runner filter toggles; a planned runner has nothing to filter to, so its
            // name is inert.
            if (!r.planned) onFilter("host", active ? "*" : r.key);
          }}
        >
          {r.label}
        </button>
        <span class="ktag">{r.kind}</span>
        <span class="nruns">{labels.runs(r.runs)}</span>
        <span class="nheld" title={labels.slotsHeld(r.held, r.total)}>
          {`${r.held}/${r.total}`}
        </span>
      </div>
      {r.planned && <p class="nnone">{labels.notConfigured}</p>}
      {!r.planned && open && r.projects.length === 0 && (
        <p class="nnone">{labels.nothingRunning}</p>
      )}
      {!r.planned &&
        open &&
        r.projects.map((p) => {
          const key = `${r.key}/${p.name}`;
          const folded = collapsedProjects.has(key);
          return (
            <div class="np" key={p.name}>
              <div class={projFilter === p.name ? "nproj on" : "nproj"}>
                <button
                  type="button"
                  class="caret net-caret"
                  title={folded ? labels.unfold : labels.fold}
                  onClick={() => onToggleProject(key)}
                >
                  {folded ? "▸" : "▾"}
                </button>
                <button
                  type="button"
                  class="nm"
                  title={labels.focusBoardOn(p.name)}
                  // the project filter toggles — a second click clears.
                  onClick={() => onFilter("proj", projFilter === p.name ? "*" : p.name)}
                >
                  {`▢ ${p.name}`}
                </button>
                <span class="cnt">{labels.projectLive(p.live)}</span>
              </div>
              {!folded &&
                p.leaves.map((l) => (
                  <button
                    key={l.ticketId}
                    type="button"
                    class={selected === l.ticketId ? "leaf sel" : "leaf"}
                    style={{ "--hue": String(l.hue) }}
                    title={l.title}
                    onClick={() => onOpenRun(l.ticketId)}
                  >
                    <span class="lgl">{l.glyph}</span>
                    <span class="lid">{l.short}</span>
                    <span class="lnow">{l.now}</span>
                  </button>
                ))}
            </div>
          );
        })}
    </div>
  );
}
