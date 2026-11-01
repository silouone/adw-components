import "./ToolsTab.css";

// `<ToolsTab/>`: what the agent could use, the skills that reach it, the context it was given
// and what its tool calls captured. It needs no card, only the view; the words arrive as
// `labels`.

import { TabSection } from "../../atoms/TabSection/TabSection";

export type SkillSet =
  | { readonly kind: "all" }
  | { readonly kind: "none" }
  | { readonly kind: "list"; readonly names: readonly string[] };

export interface ToolCallRow {
  readonly node: string;
  readonly state: "ok" | "none" | "live";
  readonly calls?: number;
  readonly ms?: number;
  /** `…` while live, else the duration, ready to render. */
  readonly msText: string;
}

export interface ToolsView {
  /** `undefined` when the target declares none: the factory default applies. */
  readonly allowed?: readonly string[];
  readonly skills: { readonly repo: SkillSet; readonly global: SkillSet };
  readonly context: {
    readonly files: readonly string[];
    readonly specs: readonly string[];
    readonly artifacts: readonly string[];
  };
  /** `undefined` when no agent block carries capture data. */
  readonly calls?: {
    readonly captured: number;
    readonly total: number;
    readonly rows: readonly ToolCallRow[];
  };
}

/** The words of the tab that its view does not carry. */
export interface ToolsTabLabels {
  readonly couldUse: string;
  readonly factoryDefault: string;
  readonly suiteGuard: string;
  readonly skillsReaching: string;
  readonly repo: string;
  readonly categories: string;
  readonly everyRepoSkill: string;
  readonly everyCategory: string;
  readonly none: string;
  readonly everyStage: string;
  readonly contextGiven: string;
  readonly files: string;
  readonly specs: string;
  readonly artifacts: string;
  readonly toolCalls: string;
  /** After the count: `2/3` _captured_. */
  readonly captured: string;
  readonly noCaptureData: string;
  readonly noCapture: string;
  /** After a row's count: `12` _calls_. */
  readonly calls: string;
}

export interface ToolsTabProps {
  readonly view: ToolsView;
  readonly labels: ToolsTabLabels;
  /** The rail passes "rail": the root and sections render their rail variant. */
  readonly density?: "rail" | undefined;
}

const Tags = ({ names }: { readonly names: readonly string[] }) => (
  <>
    {names.map((n) => (
      <span key={n} class="tag toolstab-tag">
        {n}
      </span>
    ))}
  </>
);

function Skills({
  label,
  all,
  none,
  set,
}: {
  readonly label: string;
  readonly all: string;
  readonly none: string;
  readonly set: SkillSet;
}) {
  return (
    <div class="tl-row">
      <span class="faint">{label}</span>
      {set.kind === "list" ? (
        <Tags names={set.names} />
      ) : (
        <span>{set.kind === "all" ? all : none}</span>
      )}
    </div>
  );
}

const List = ({ label, items }: { readonly label: string; readonly items: readonly string[] }) =>
  items.length === 0 ? null : (
    <div class="tl-list">
      <span class="faint">{label}</span>
      {items.map((i) => (
        <div key={i} class="tl-item">
          {i}
        </div>
      ))}
    </div>
  );

export function ToolsTab({ view: v, labels, density }: ToolsTabProps) {
  return (
    <div class={density === "rail" ? "toolstab tl-rail" : "toolstab"}>
      <TabSection density={density} title={labels.couldUse}>
        <div class="tl-allowed">
          {v.allowed === undefined ? (
            <span class="faint">{labels.factoryDefault}</span>
          ) : (
            <Tags names={v.allowed} />
          )}
        </div>
        <div class="faint">{labels.suiteGuard}</div>
      </TabSection>
      <TabSection density={density} title={labels.skillsReaching}>
        <div class="tl-skills">
          <Skills
            label={labels.repo}
            all={labels.everyRepoSkill}
            none={labels.none}
            set={v.skills.repo}
          />
          <Skills
            label={labels.categories}
            all={labels.everyCategory}
            none={labels.none}
            set={v.skills.global}
          />
          <div class="faint">{labels.everyStage}</div>
        </div>
      </TabSection>
      <TabSection density={density} title={labels.contextGiven}>
        <div class="tl-context">
          <List label={labels.files} items={v.context.files} />
          <List label={labels.specs} items={v.context.specs} />
          <List label={labels.artifacts} items={v.context.artifacts} />
        </div>
      </TabSection>
      <TabSection
        density={density}
        title={labels.toolCalls}
        {...(v.calls !== undefined
          ? { right: `${v.calls.captured}/${v.calls.total} ${labels.captured}` }
          : {})}
      >
        {v.calls === undefined ? (
          <p class="faint">{labels.noCaptureData}</p>
        ) : (
          v.calls.rows.map((r, i) => (
            <div key={`${r.node}-${i}`} class="tl-call">
              <span>{r.node}</span>
              <span class="faint">{r.msText}</span>
              <span class="faint">
                {r.state === "none" ? labels.noCapture : `${r.calls ?? 0} ${labels.calls}`}
              </span>
            </div>
          ))
        )}
      </TabSection>
    </div>
  );
}
