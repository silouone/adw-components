import "./AppHeaderFrame.css";

import type { ComponentChildren } from "preact";

// `<AppHeaderFrame/>`: the one header every screen shares: the brand, then the tabs, then the active
// screen's own context (its counts and controls), then the chip. Pure over its props: the tab links
// come from `hrefFor` (the caller folds the token in), the active tab from `route`, and a plain left
// click reports through `onNavigate` instead of leaving the page. The chip is the LAST child and
// sits outside the context div: the context is swapped wholesale on a tab switch, and a chip rebuilt
// by a switch would lose its pinned-open state along with its DOM node.

export interface AppHeaderTab {
  readonly route: string;
  readonly label: string;
}

export interface AppHeaderFrameProps {
  readonly brand: string;
  readonly tabs: readonly AppHeaderTab[];
  /** The active tab; `undefined` (the run screen) marks none. */
  readonly route: string | undefined;
  /** The tab's link target, token already folded in by the caller. */
  readonly hrefFor: (route: string) => string;
  /** Client-side switch; absent → the tabs are plain links. */
  readonly onNavigate?: ((route: string) => void) | undefined;
  /** The per-screen counts and controls. */
  readonly context?: ComponentChildren;
  /** The usage chip, after the context. */
  readonly chip?: ComponentChildren;
  /** The context holds dropdown chips: one row, tight gap. */
  readonly ctxTight?: boolean;
}

export function AppHeaderFrame({
  brand,
  tabs,
  route,
  hrefFor,
  onNavigate,
  context,
  chip,
  ctxTight,
}: AppHeaderFrameProps) {
  return (
    <header class="app-header-frame">
      <span class="app-header-frame-brand">{brand}</span>
      <nav class="app-header-frame-tabs">
        {tabs.map((t) => (
          <a
            key={t.route}
            class={`app-header-frame-tab${route === t.route ? " on" : ""}`}
            data-route={t.route}
            href={hrefFor(t.route)}
            {...(route === t.route ? { "aria-current": "page" } : {})}
            onClick={(e) => {
              if (onNavigate === undefined) return;
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              onNavigate(t.route);
            }}
          >
            {t.label}
          </a>
        ))}
      </nav>
      <div
        class={
          ctxTight ? "app-header-frame-ctx app-header-frame-ctx-tight" : "app-header-frame-ctx"
        }
      >
        {context}
      </div>
      {chip}
    </header>
  );
}
