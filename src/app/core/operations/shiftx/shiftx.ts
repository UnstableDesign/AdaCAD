import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "adacad-drafting-lib/draft";
import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "shift left";
const old_names = [];

//PARAMS

const amt: NumParam =
{
  name: 'amount',
  type: 'number',
  min: 1,
  max: 100,
  value: 1,
  dx: 'the amount of warps to shift by'
}

const params = [amt];

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
  let amt = getOpParamValById(0, op_params);

  if (input_draft == null) return Promise.resolve([]);

  let pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    let seq = new Sequence.OneD().import(row).shift(-amt).val();
    pattern.pushWeftSequence(seq);
  })

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  let amt = getOpParamValById(0, param_vals);
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'shift' + amt + '(' + parseDraftNames(drafts) + ")";
}


export const shiftx: Operation = { name, old_names, params, inlets, perform, generateName };