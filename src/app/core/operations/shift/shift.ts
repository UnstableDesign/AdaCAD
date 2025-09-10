import { initDraftFromDrawdown, warps } from "adacad-drafting-lib/draft";
import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";

/**
 * this will be the default function going forward, as the others will be removed. 
 */

const name = "shift";
const old_names = [];

//PARAMS

const amt_x: NumParam =
{
  name: 'warps',
  type: 'number',
  min: -100,
  max: 100,
  value: 1,
  dx: 'the amount of warps to shift by'
}

const amt_y: NumParam =
{
  name: 'wefts',
  type: 'number',
  min: -100,
  max: 100,
  value: 1,
  dx: 'the amount of wefts to shift by'
}


const params = [amt_x, amt_y];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  dx: 'the draft to shift',
  uses: "draft",
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let amt_x = getOpParamValById(0, op_params);
  let amt_y = getOpParamValById(1, op_params);

  if (input_draft == null) return Promise.resolve([]);

  let warp_systems = new Sequence.OneD(input_draft.colSystemMapping).shift(-amt_x);

  let warp_mats = new Sequence.OneD(input_draft.colShuttleMapping).shift(-amt_x);

  let weft_systems = new Sequence.OneD(input_draft.rowSystemMapping).shift(-amt_y);

  let weft_materials = new Sequence.OneD(input_draft.rowShuttleMapping).shift(-amt_y);


  let pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    let seq = new Sequence.OneD().import(row).shift(-amt_x).val();
    pattern.pushWeftSequence(seq);
  })

  let next_pattern = new Sequence.TwoD();

  for (let j = 0; j < warps(input_draft.drawdown); j++) {
    let col = pattern.getWarp(j);
    let seq = new Sequence.OneD().import(col).shift(-amt_y);
    next_pattern.pushWarpSequence(seq.val());
  }

  let d = initDraftFromDrawdown(next_pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_systems.val();
  d.rowShuttleMapping = weft_materials.val();
  d.rowSystemMapping = weft_systems.val();



  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  let amt_x = getOpParamValById(0, param_vals);
  let amt_y = getOpParamValById(1, param_vals);
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'shift' + amt_x + '/' + amt_y + '(' + parseDraftNames(drafts) + ")";
}


export const shift: Operation = { name, old_names, params, inlets, perform, generateName };