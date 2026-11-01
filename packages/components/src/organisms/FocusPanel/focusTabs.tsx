// The focus panel's tab registry: one renderer per tab, each handed its own typed props. Every
// tab renders at rail density. The page builds the active tab's props (its view, its labels,
// `onCopy` for the run tab) and hands them to `focusBodyOf`; the result is the `<FocusPanel/>`
// children.

import type { ComponentChild } from "preact";
import type { FocusTab } from "../../glyphs";
import { CostTab, type CostTabProps } from "../CostTab/CostTab";
import { GatesTab, type GatesTabProps } from "../GatesTab/GatesTab";
import { ResultTab, type ResultTabProps } from "../ResultTab/ResultTab";
import { RouteTab, type RouteTabProps } from "../RouteTab/RouteTab";
import { RunTab, type RunTabProps } from "../RunTab/RunTab";
import { ToolsTab, type ToolsTabProps } from "../ToolsTab/ToolsTab";
import { WalkTab, type WalkTabProps } from "../WalkTab/WalkTab";

/** A tab's props without its density: the registry renders every tab at rail density. */
type Body<P> = Omit<P, "density">;

/** The active tab and its props: the key picks the renderer, the props are that tab's own. */
export type FocusBody =
  | { readonly tab: "run"; readonly props: Body<RunTabProps> }
  | { readonly tab: "walk"; readonly props: Body<WalkTabProps> }
  | { readonly tab: "gates"; readonly props: Body<GatesTabProps> }
  | { readonly tab: "tools"; readonly props: Body<ToolsTabProps> }
  | { readonly tab: "cost"; readonly props: Body<CostTabProps> }
  | { readonly tab: "route"; readonly props: Body<RouteTabProps> }
  | { readonly tab: "result"; readonly props: Body<ResultTabProps> };

type Renderers = {
  readonly [K in FocusTab]: (props: Extract<FocusBody, { tab: K }>["props"]) => ComponentChild;
};

export const FOCUS_TAB_RENDERERS: Renderers = {
  run: (props) => <RunTab {...props} density="rail" />,
  walk: (props) => <WalkTab {...props} density="rail" />,
  gates: (props) => <GatesTab {...props} density="rail" />,
  tools: (props) => <ToolsTab {...props} density="rail" />,
  cost: (props) => <CostTab {...props} density="rail" />,
  route: (props) => <RouteTab {...props} density="rail" />,
  result: (props) => <ResultTab {...props} density="rail" />,
};

/** The active tab's body for the focus panel. */
export function focusBodyOf(body: FocusBody): ComponentChild {
  const render = FOCUS_TAB_RENDERERS[body.tab] as (props: FocusBody["props"]) => ComponentChild;
  return render(body.props);
}
