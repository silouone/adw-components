import "./SyncButton.css";

// `<SyncButton/>`: the backlog header's one control. A view: it shows `status` and calls
// `onSync`; the sweep itself (the request, the poll, the toast) is the page's. It never touches
// backlog data. The words arrive as `labels`; the `⟳` glyph is the component's.

export type SyncState = "idle" | "syncing";

/** The words of the button: its two labels and its tooltip. */
export interface SyncButtonLabels {
  readonly sync: string;
  readonly syncing: string;
  /** The tooltip: what a sweep does. */
  readonly title: string;
}

export interface SyncButtonProps {
  readonly status: SyncState;
  readonly labels: SyncButtonLabels;
  readonly onSync: () => void;
}

export function SyncButton({ status, labels, onSync }: SyncButtonProps) {
  const busy = status === "syncing";
  return (
    <button type="button" class="bl-sync" disabled={busy} title={labels.title} onClick={onSync}>
      ⟳ {busy ? labels.syncing : labels.sync}
    </button>
  );
}
