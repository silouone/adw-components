import "./TabSection.css";

// An eyebrow-headed block for the focus panel's tabs: the same markup the run tab
// draws for its own sections.

import type { ComponentChildren } from "preact";

export function TabSection({
  title,
  right,
  density,
  children,
}: {
  readonly title: string;
  readonly right?: string;
  readonly density?: "rail" | undefined;
  readonly children: ComponentChildren;
}) {
  return (
    <section class={density === "rail" ? "tab-section tab-section-rail" : "tab-section"}>
      <div class="tab-section-eyebrow">
        <span>{title}</span>
        {right !== undefined && <span class="tab-section-note">{right}</span>}
      </div>
      {children}
    </section>
  );
}
