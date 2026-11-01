import type { SlotsChipLabels, SlotsChipView } from "../src/molecules/SlotsChip/SlotsChip";
import { FOOT_TEXT, HOLDER_OK, LOCAL_RUNNER, SLOTS_LABELS, SSH_RUNNER } from "./SlotsPanel";

// Hand-written view models for `<SlotsChip/>`: its test and its stories read these. The
// panel inside it is `<SlotsPanel/>`'s, from the same-named fixture module.

export const CHIP_LABELS: SlotsChipLabels = {
  slots: "slots",
  queued: "queued",
  panel: SLOTS_LABELS,
};

const bays = (...held: readonly boolean[]) => held.map((h, i) => ({ key: `b${i}`, held: h }));

/** Five bays on two runners, three held, nine waiting: `slots 3/5 +9 queued`, no warn. */
export const CHIP_PARTIAL: SlotsChipView = {
  tally: { held: 3, total: 5, queued: 9, full: false },
  bays: bays(true, true, true, false, false),
  panel: { runners: [LOCAL_RUNNER, SSH_RUNNER], footText: FOOT_TEXT },
};

/** Every bay held: the warn border. */
export const CHIP_FULL: SlotsChipView = {
  tally: { held: 2, total: 2, queued: 0, full: true },
  bays: bays(true, true),
  panel: { runners: [{ ...LOCAL_RUNNER, bays: [HOLDER_OK] }], footText: FOOT_TEXT },
};

/** Nobody waiting: no `queued` suffix. */
export const CHIP_NO_QUEUE: SlotsChipView = {
  tally: { held: 2, total: 5, queued: 0, full: false },
  bays: bays(true, true, false, false, false),
  panel: { runners: [LOCAL_RUNNER, SSH_RUNNER], footText: FOOT_TEXT },
};

/** Bays across runners in order: held, free, free, held. */
export const CHIP_INTERLEAVED: SlotsChipView = {
  tally: { held: 2, total: 4, queued: 0, full: false },
  bays: bays(true, false, false, true),
  panel: { runners: [LOCAL_RUNNER, SSH_RUNNER], footText: FOOT_TEXT },
};

/** One bay held and one waiting. */
export const CHIP_ONE_WAITING: SlotsChipView = {
  tally: { held: 1, total: 1, queued: 1, full: true },
  bays: bays(true),
  panel: { runners: [{ ...LOCAL_RUNNER, bays: [HOLDER_OK] }], footText: FOOT_TEXT },
};

/** No slot pool: `slots —`, no bays, no warn. */
export const CHIP_NONE: SlotsChipView = {
  tally: { held: 0, total: 0, queued: 0, full: false },
  bays: [],
  panel: { runners: [], footText: FOOT_TEXT },
};
