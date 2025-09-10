import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "adacad-drafting-lib/draft";
import { Drawdown, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "tile";
const old_names = [];

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


  let input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);


  let warp_rep = getOpParamValById(0, op_params);
  let weft_rep = getOpParamValById(1, op_params);

  const w = warp_rep * warps(input_draft.drawdown);
  const h = weft_rep * wefts(input_draft.drawdown);

  let seq = new Sequence.TwoD();
  seq.import(input_draft.drawdown);

  let dd: Drawdown = seq.fill(w, h).export();
  let d = initDraftFromDrawdown(dd);
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'tile(' + parseDraftNames(drafts) + ")";
}


export const tile: Operation = { name, old_names, params, inlets, perform, generateName };