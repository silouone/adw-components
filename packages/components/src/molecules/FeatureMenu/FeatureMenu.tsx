import "./FeatureMenu.css";

// `<FeatureMenu/>`: the « feature ▾ » picker shared by the backlog list and the graph
// drawer. A chip that opens a list, each item picks, and the caller's dismiss edge closes
// it. The list is a two-level tree (a top feature, its children behind a guide line)
// with open counts and done/total bars. `<ProjectFeaturePanel/>` is the same rows for
// one project, shown by CSS `:hover`.
//
// Controlled: the caller owns `open` and hears `onOpen`, `onClose` and `onPick`. Every
// word arrives as a prop (`labels`).

import type { RefObject } from "preact";

export interface FeatureRowView {
  readonly name: string;
  /** What the row shows: the full name of a top, the part after `top/` of a child. */
  readonly label: string;
  readonly open: number;
  readonly done: number;
  readonly total: number;
  /** How many projects the feature spans; `↔N` is shown iff more than one. */
  readonly spans: number;
}

export interface FeatureGroup {
  readonly top: FeatureRowView;
  readonly children: readonly FeatureRowView[];
}

export interface FeatureTree {
  readonly groups: readonly FeatureGroup[];
  /** Open non-epic rows that are in no feature. */
  readonly unfiled: number;
}

/** The words of the menu and of its project panel. */
export interface FeatureMenuLabels {
  /** The chip's lead-in, e.g. `feature`. */
  readonly feature: string;
  /** The row that picks no feature, e.g. `— no feature —`. */
  readonly none: string;
  readonly open: string;
  readonly done: string;
  /** The footer line for the rows that are in no feature. */
  readonly unfiled: (count: number) => string;
}

export interface FeatureMenuProps {
  /** The test/data hook: rendered as `data-<hook>` on the root. */
  readonly hook: "bfeature" | "gfeature";
  readonly class: string;
  /** The first header cell: « all features » on the backlog, « features » in the drawer. */
  readonly heading: string;
  readonly buttonClass: string;
  readonly labels: FeatureMenuLabels;
  readonly tree: FeatureTree;
  /** The name of the picked feature, if any. */
  readonly picked: string | undefined;
  /** `""` picks « no feature ». */
  readonly onPick: (name: string) => void;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  /** The menu root, so the caller's dismiss edge can tell an inside click. */
  readonly rootRef: RefObject<HTMLSpanElement>;
}

interface FeatureGroupsProps {
  /** Class namespace: `bl-fm-*` for the menu, `bl-pm-*` for the project panel. */
  readonly ns: "fm" | "pm";
  /** The attribute that carries the feature's name on each row. */
  readonly optAttr: "data-fopt" | "data-pfopt";
  readonly groups: readonly FeatureGroup[];
  readonly picked: string | undefined;
  readonly onPick: (name: string) => void;
}

function FeatureGroups({ ns, optAttr, groups, picked, onPick }: FeatureGroupsProps) {
  const row = (v: FeatureRowView, level: "top" | "kid") => (
    <button
      key={v.name}
      type="button"
      role="menuitem"
      {...{ [optAttr]: v.name }}
      class={`bl-${ns}-row bl-${ns}-${level}${v.open === 0 ? " idle" : ""}${v.name === picked ? " on" : ""}`}
      onClick={() => onPick(v.name)}
    >
      <span title={v.name}>{v.label}</span>
      <b>{v.open === 0 ? "–" : v.open}</b>
      <span class={`bl-${ns}-prog`}>
        <i class={`bl-${ns}-bar`}>
          <i style={{ width: `${v.total === 0 ? 0 : (100 * v.done) / v.total}%` }} />
        </i>
        {v.done}/{v.total}
      </span>
      <span class={`bl-${ns}-span`}>{v.spans > 1 ? `↔${v.spans}` : ""}</span>
    </button>
  );
  return (
    <>
      {groups.map((g) => (
        <div key={g.top.name} class={`bl-${ns}-group`}>
          {row(g.top, "top")}
          {g.children.length > 0 && (
            <div class={`bl-${ns}-kids`}>{g.children.map((c) => row(c, "kid"))}</div>
          )}
        </div>
      ))}
    </>
  );
}

export function FeatureMenu({
  hook,
  class: cls,
  heading,
  buttonClass,
  labels,
  tree,
  picked,
  onPick,
  open,
  onOpen,
  onClose,
  rootRef,
}: FeatureMenuProps) {
  const choose = (name: string): void => {
    onClose();
    onPick(name);
  };
  return (
    <span
      class={`bl-copymenu bl-fmenu ${cls}`}
      ref={rootRef}
      data-value={picked ?? ""}
      {...{ [`data-${hook}`]: "" }}
    >
      {labels.feature}{" "}
      <button
        type="button"
        class={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <b>{picked ?? labels.none}</b> ▾
      </button>
      {open && (
        <div class="bl-copymenu-list bl-fmenu-list" role="menu">
          <div class="bl-fm-head">
            <span>{heading}</span>
            <span>{labels.open}</span>
            <span>{labels.done}</span>
            <span />
          </div>
          <button
            type="button"
            role="menuitem"
            data-fopt=""
            class={`bl-fm-row bl-fm-none${picked === undefined ? " on" : ""}`}
            onClick={() => choose("")}
          >
            {labels.none}
          </button>
          <FeatureGroups
            ns="fm"
            optAttr="data-fopt"
            groups={tree.groups}
            picked={picked}
            onPick={choose}
          />
          <div class="bl-fm-foot">{labels.unfiled(tree.unfiled)}</div>
        </div>
      )}
    </span>
  );
}

export interface ProjectFeaturePanelProps {
  /** The panel's first header cell, e.g. the project name and the word for features. */
  readonly heading: string;
  readonly labels: Pick<FeatureMenuLabels, "open" | "done" | "unfiled">;
  /** This project's features, counted over its rows. */
  readonly tree: FeatureTree;
  readonly onPick: (name: string) => void;
}

export function ProjectFeaturePanel({ heading, labels, tree, onPick }: ProjectFeaturePanelProps) {
  return (
    <div class="bl-ppanel">
      <div class="bl-pm-list" role="menu">
        <div class="bl-pm-head">
          <span>{heading}</span>
          <span>{labels.open}</span>
          <span>{labels.done}</span>
          <span />
        </div>
        <FeatureGroups
          ns="pm"
          optAttr="data-pfopt"
          groups={tree.groups}
          picked={undefined}
          onPick={onPick}
        />
        <div class="bl-pm-foot">{labels.unfiled(tree.unfiled)}</div>
      </div>
    </div>
  );
}
