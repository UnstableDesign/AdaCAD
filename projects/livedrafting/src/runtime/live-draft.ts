import type { Draft } from "adacad-drafting-lib";
import { display } from "./display";
import * as ops from "./addons";

/**
 * Chainable draft handle. Awaitable as a raw Draft, or chain with .stretch(), .fill(), .display(), etc.
 */
export class LiveDraft implements PromiseLike<Draft> {
  constructor(private readonly draftPromise: Promise<Draft>) { }

  then<TResult1 = Draft, TResult2 = never>(
    onfulfilled?: ((value: Draft) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.draftPromise.then(onfulfilled, onrejected);
  }

  private chain(step: (draft: Draft) => Promise<Draft>): LiveDraft {
    return new LiveDraft(this.draftPromise.then(step));
  }

  stretch(weft_stretch: number, warp_stretch: number): LiveDraft {
    return this.chain((d) => ops.stretch(d, weft_stretch, warp_stretch));
  }

  shift(shift_ends: number, shift_pics: number): LiveDraft {
    return this.chain((d) => ops.shift(d, shift_ends, shift_pics));
  }

  symmetry(options: number, remove_center: boolean = false): LiveDraft {
    return this.chain((d) => ops.symmetry(d, options, remove_center));
  }

  addColors(weft_colors: number[], warp_colors: number[]): LiveDraft {
    return this.chain((d) => ops.addColors(d, weft_colors, warp_colors));
  }

  tile(
    warp_repeats: number = 2,
    weft_repeats: number = 2,
    mode: number = 0,
    offset: number = 50
  ): LiveDraft {
    return this.chain((d) => ops.tile(d, warp_repeats, weft_repeats, mode, offset));
  }

  resize(width: number, height: number): LiveDraft {
    return this.chain((d) => ops.resize(d, width, height));
  }

  fill(black_draft: LiveDraft, white_draft: LiveDraft): LiveDraft {
    return new LiveDraft(
      Promise.all([this.draftPromise, black_draft.draftPromise, white_draft.draftPromise]).then(
        ([pattern, black, white]) => ops.fill(pattern, black, white)
      )
    );
  }




  async display(mode: "draft" | "color" = "draft"): Promise<void> {
    const draft = await this.draftPromise;
    switch (mode) {
      case "draft":
        display(draft, false, false);
        break;
      case "color":
        display(draft, true, false);
        break;
    }
  }
}

function fromPromise(promise: Promise<Draft>): LiveDraft {
  return new LiveDraft(promise);
}

/** Wrap an existing draft for chaining. */
export function draft(existing: Draft): LiveDraft {
  return new LiveDraft(Promise.resolve(existing));
}

// --- Structure factories (return LiveDraft) ---

export function twill(
  raised: number,
  lowered: number,
  offset: boolean,
  facing: boolean
): LiveDraft {
  return fromPromise(ops.twill(raised, lowered, offset ? 1 : 0, facing ? 1 : 0));
}

export function satin(repeat: number, shift: number, facing: boolean): LiveDraft {
  return fromPromise(ops.satin(repeat, shift, facing));
}

export function tabby(
  warps_raised: number,
  warps_lowered: number,
  base_pics: number,
  alt_pics: number
): LiveDraft {
  return fromPromise(ops.tabby(warps_raised, warps_lowered, base_pics, alt_pics));
}

export function waffle(
  float_length: number,
  binding_rows: number,
  packing_factor: number
): LiveDraft {
  return fromPromise(ops.waffle(float_length, binding_rows, packing_factor));
}

export function random(ends: number, pics: number, pcent: number): LiveDraft {
  return fromPromise(ops.random(ends, pics, pcent));
}

// --- Multi-draft helpers ---

export function interlace(
  drafts: LiveDraft[],
  repeats: boolean = false,
  weft_oriented: boolean = false
): LiveDraft {
  return fromPromise(
    Promise.all(drafts.map((d) => d.draftPromise)).then((resolved) =>
      ops.interlace(resolved, repeats, weft_oriented)
    )
  );
}

export function join(drafts: LiveDraft[], repeats: boolean = false): LiveDraft {
  return fromPromise(
    Promise.all(drafts.map((d) => d.draftPromise)).then((resolved) => ops.join(resolved, repeats))
  );
}
