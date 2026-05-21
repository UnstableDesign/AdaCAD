import type { Draft, InitDraftParams } from "adacad-drafting-lib";
import type {
  DynamicOperation,
  OpInput,
  OpOutput,
  OpParamValType,
  Operation,
} from "adacad-drafting-lib";

declare global {
  function getOp(name: string): Operation | DynamicOperation | null;
  function call(
    op: Operation,
    params: Array<OpParamValType>,
    inlets?: Array<OpInput>
  ): Promise<Array<OpOutput>>;
  function display(draft: Draft): void;
  function initDraft(): Draft;
  function initDraftWithParams(params: InitDraftParams): Draft;
  function oscillator(
    min: number,
    max: number,
    options?: { frequency?: number; phase?: number }
  ): number;

}

export { };
