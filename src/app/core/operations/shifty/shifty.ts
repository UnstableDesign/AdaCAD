import { getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps } from "adacad-drafting-lib/draft";
import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "shift up";
const old_names = [];

//PARAMS

const amt: NumParam =
{
  name: 'amount',
  type: 'number',
  min: 1,
  max: 100,
  value: 1,
  dx: 'the amount of wefts to shift by'
}

const params = [amt];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to shift',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let amt = getOpParamValById(0, op_params);

  if (input_draft == null) return Promise.resolve([]);

  let pattern = new Sequence.TwoD();

  for (let j = 0; j < warps(input_draft.drawdown); j++) {
    const col = getCol(input_draft.drawdown, j);
    let seq = new Sequence.OneD().import(col).shift(-amt).val();
    pattern.pushWarpSequence(seq);

  }
  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  let amt = getOpParamValById(0, param_vals);
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'shifty' + amt + '(' + parseDraftNames(drafts) + ")";
}


export const shifty: Operation = { name, old_names, params, inlets, perform, generateName };