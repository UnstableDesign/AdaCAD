import { warps, wefts, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, SelectParam } from "../types";
import { clothOp } from "../categories";

const name = "tile";

const meta: OpMeta = {
  displayname: 'tile',
  desc: 'Repeats the input block along the warp and weft according to the parameters described below.',
  img: 'tile.png',
  categories: [clothOp],
  advanced: true
}

//PARAMS
const warp_repeats: NumParam =
{
  name: 'warp-repeats',
  type: 'number',
  min: 1,
  max: 5000,
  value: 2,
  dx: 'the number of times to repeat this time across the width'
};

const weft_repeats: NumParam = {
  name: 'weft-repeats',
  type: 'number',
  min: 1,
  max: 5000,
  value: 2,
  dx: 'the number of times to repeat this time across the length'
}

const mode: SelectParam = {
  name: 'mode',
  type: 'select',
  selectlist: [
    { name: 'horizontal brick', value: 0 },
    { name: 'vertical brick', value: 1 }
  ],
  value: 0,
  dx: 'the mode to repeat the draft in'
}

const offset: NumParam = {
  name: 'offset',
  type: 'number',
  min: 0,
  max: 1,
  value: 0,
  dx: 'the portion of this draft that will be staggered'
}

const params = [warp_repeats, weft_repeats, mode, offset];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to tile',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);


  const warp_rep = <number>getOpParamValById(0, op_params);
  const weft_rep = <number>getOpParamValById(1, op_params);
  const mode = <number>getOpParamValById(2, op_params);
  const offset = <number>getOpParamValById(3, op_params);

  const w = warp_rep * warps(input_draft.drawdown);
  const h = weft_rep * wefts(input_draft.drawdown);

  const seq = new Sequence.TwoD();
  seq.import(input_draft.drawdown).fill(w, h);


  const weft_shift = Math.floor(offset * warps(input_draft.drawdown));
  const warp_shift = Math.floor(offset * wefts(input_draft.drawdown));


  switch (mode) {
    case 0: //horizontal brick
      for (let repeat = 0; repeat < weft_rep; repeat++) {
        for (let i = 0; i < wefts(input_draft.drawdown); i++) {
          seq.shiftRow(repeat * wefts(input_draft.drawdown) + i, weft_shift);
        }
      }

      break;
    case 1: //vertical
      for (let repeat = 0; repeat < warp_rep; repeat++) {
        for (let j = 0; j < warps(input_draft.drawdown); j++) {
          seq.shiftCol(repeat * warps(input_draft.drawdown) + j, warp_shift);
        }
      }
      break;
  }


  let d = initDraftFromDrawdown(seq.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'tile(' + parseDraftNames(drafts) + ")";
}


export const tile: Operation = { name, meta, params, inlets, perform, generateName };