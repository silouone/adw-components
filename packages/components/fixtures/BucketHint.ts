// Hand-written view models for `<BucketHint/>`: its test and its stories read these.

/** One bucket with a figure. */
export const HINT_ONE = "draws on Opus 22% used";

/** A bucket with no figure reads `unknown`, never `0%`. */
export const HINT_UNKNOWN = "draws on Fable unknown";

/** A real 0% prints `0%`. */
export const HINT_ZERO = "draws on Opus 0% used";

/** Several buckets joined with `·`. */
export const HINT_TWO = "draws on Opus 22% used · Fable unknown";

/** Both figures present, one of them 0%. */
export const HINT_TWO_FIGURES = "draws on Opus 0% used · Fable 100% used";
