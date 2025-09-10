import { initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "shift left";
const old_names: Array<string> = [];


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

  const input_draft = getInputDraft(op_inputs);
  const amt = <number>getOpParamValById(0, op_params);

  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    const seq = new Sequence.OneD().import(row).shift(-amt).val();
    pattern.pushWeftSequence(seq);
  })

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const amt = getOpParamValById(0, param_vals);
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'shift' + amt + '(' + parseDraftNames(drafts) + ")";
}


export const shiftx: Operation = { name, old_names, params, inlets, perform, generateName };