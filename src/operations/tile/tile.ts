import { warps, wefts, Drawdown, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
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
  max: 100,
  value: 2,
  dx: 'the number of times to repeat this time across the width'
};

const weft_repeats: NumParam = {
  name: 'weft-repeats',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'the number of times to repeat this time across the length'
}


const params = [warp_repeats, weft_repeats];

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

  const w = warp_rep * warps(input_draft.drawdown);
  const h = weft_rep * wefts(input_draft.drawdown);

  const seq = new Sequence.TwoD();
  seq.import(input_draft.drawdown);

  const dd: Drawdown = seq.fill(w, h).export();
  let d = initDraftFromDrawdown(dd);
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'tile(' + parseDraftNames(drafts) + ")";
}


export const tile: Operation = { name, meta, params, inlets, perform, generateName };