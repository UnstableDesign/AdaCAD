import type { Draft, InitDraftParams } from "adacad-drafting-lib";
import type {
  DynamicOperation,
  OpInput,
  OpOutput,
  OpParamValType,
  Operation,
} from "adacad-drafting-lib";

declare class LiveDraft implements Promise<Draft> {
  stretch(weft_stretch: number, warp_stretch: number): LiveDraft;
  shift(shift_ends: number, shift_pics: number): LiveDraft;
  symmetry(options: number, remove_center?: boolean): LiveDraft;
  addColors(weft_colors: number[], warp_colors: number[]): LiveDraft;
  tile(
    warp_repeats?: number,
    weft_repeats?: number,
    mode?: number,
    offset?: number
  ): LiveDraft;
  resize(width: number, height: number): LiveDraft;
  fill(black_draft: LiveDraft, white_draft: LiveDraft): LiveDraft;
  display(use_color?: boolean, floats?: boolean): Promise<void>;
  then: Promise<Draft>["then"];
  catch: Promise<Draft>["catch"];
  finally: Promise<Draft>["finally"];
}

declare global {
  function getOp(name: string): Operation | DynamicOperation | null;
  function call(
    op: Operation,
    params: Array<OpParamValType>,
    inlets?: Array<OpInput>
  ): Promise<Array<OpOutput>>;
  function display(draft: Draft, use_color?: boolean, floats?: boolean): void;
  function initDraft(): Draft;
  function initDraftWithParams(params: InitDraftParams): Draft;
  function draft(existing: Draft): LiveDraft;
  function oscillator(
    min: number,
    max: number,
    options?: { frequency?: number; phase?: number }
  ): number;
  function renderCount(multiplier?: number): number;

  function twill(
    raised: number,
    lowered: number,
    offset: number,
    binding: number
  ): LiveDraft;
  function satin(repeat: number, shift: number, facing: boolean): LiveDraft;
  function tabby(
    warps_raised: number,
    warps_lowered: number,
    base_pics: number,
    alt_pics: number
  ): LiveDraft;
  function waffle(
    float_length: number,
    binding_rows: number,
    packing_factor: number
  ): LiveDraft;
  function random(ends: number, pics: number, pcent: number): LiveDraft;
  function interlace(
    drafts: LiveDraft[],
    repeats?: boolean,
    weft_oriented?: boolean
  ): LiveDraft;
  function join(drafts: LiveDraft[], repeats?: boolean): LiveDraft;

  function stretch(draft: Draft, weft_stretch: number, warp_stretch: number): Promise<Draft>;
  function shift(draft: Draft, shift_ends: number, shift_pics: number): Promise<Draft>;
  function symmetry(
    draft: Draft,
    options: number,
    remove_center?: boolean
  ): Promise<Draft>;
  function addColors(
    draft: Draft,
    weft_colors: number[],
    warp_colors: number[]
  ): Promise<Draft>;
  function tile(
    draft: Draft,
    warp_repeats?: number,
    weft_repeats?: number,
    mode?: number,
    offset?: number
  ): Promise<Draft>;
  function resize(draft: Draft, width: number, height: number): Promise<Draft>;
  function fill(pattern: Draft, black_draft: Draft, white_draft: Draft): Promise<Draft>;
}

export {};
