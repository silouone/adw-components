import "./DockStrip.css";

// The dock strip's failure line: the shut dock's header row plus, after the crumb,
// one ellipsised line saying what failed. A run with no failure draws nothing, so its
// strip is the crumb only.

export function DockStrip({ line }: { readonly line?: string }) {
  if (line === undefined) return null;
  return (
    <span class="rp-fail" title={line}>
      {line}
    </span>
  );
}
