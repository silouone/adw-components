import "./BucketHint.css";

// `<BucketHint/>`: next to a dispatch action, which per-model weekly buckets the run
// will draw on and how much of each is used. The sentence arrives whole as `text`;
// a bucket with no figure reads `unknown` in it, never `0%`.

export interface BucketHintProps {
  /** The hint's sentence; `undefined` = nothing to draw on, nothing shown. */
  readonly text: string | undefined;
}

export function BucketHint({ text }: BucketHintProps) {
  if (text === undefined) return null;
  return <span class="bl-buckets">{text}</span>;
}
