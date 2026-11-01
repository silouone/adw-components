import "./SlotsChip.css";

// `<SlotsChip/>`: the top bar's slots chip — one mini bay per configured slot (held in the
// live hue, free faint), `held/total`, `+n queued`, and a warn border while every bay is
// held. Its dropdown is `<Dropdown/>` and its panel is `<SlotsPanel/>`. Controlled: the page
// owns `open` and `pinned` and hears every gesture through `onOpenChange`.

import {
  SlotsPanel,
  type SlotsPanelLabels,
  type SlotsPanelView,
} from "../../organisms/SlotsPanel/SlotsPanel";
import { Dropdown, type DropdownChange } from "../Dropdown/Dropdown";

export interface SlotsChipView {
  readonly tally: {
    readonly held: number;
    readonly total: number;
    readonly queued: number;
    /** Every configured bay is held (and there is at least one). */
    readonly full: boolean;
  };
  readonly bays: readonly { readonly key: string; readonly held: boolean }[];
  readonly panel: SlotsPanelView;
}

/** The words of the chip, then those of its panel. */
export interface SlotsChipLabels {
  /** The chip's name, before `held/total`. */
  readonly slots: string;
  readonly queued: string;
  readonly panel: SlotsPanelLabels;
}

export interface SlotsChipProps {
  readonly view: SlotsChipView;
  readonly labels: SlotsChipLabels;
  readonly open: boolean;
  readonly pinned: boolean;
  readonly onOpenChange: (change: DropdownChange) => void;
  readonly onOpenRun: (ticketId: string) => void;
}

export function SlotsChip({ view, labels, open, pinned, onOpenChange, onOpenRun }: SlotsChipProps) {
  const { held, total, queued, full } = view.tally;
  const { bays } = view;
  const chip =
    total === 0 ? (
      <b>{labels.slots} —</b>
    ) : (
      <>
        <span class="sl-bays" aria-hidden="true">
          {bays.map((b) => (
            <span key={b.key} class={`sl-bay ${b.held ? "held" : "free"}`} />
          ))}
        </span>
        <b>
          {labels.slots} {held}/{total}
          {queued > 0 && (
            <em>
              {" "}
              +{queued} {labels.queued}
            </em>
          )}
        </b>
      </>
    );
  return (
    <Dropdown
      id="slots"
      open={open}
      pinned={pinned}
      onOpenChange={onOpenChange}
      chip={chip}
      warn={full}
      {...(full ? { class: "slots-warn" } : {})}
    >
      <SlotsPanel view={view.panel} labels={labels.panel} onOpenRun={onOpenRun} />
    </Dropdown>
  );
}
