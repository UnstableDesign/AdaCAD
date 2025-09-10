import { createCell, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "adacad-drafting-lib/draft";
import { BoolParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "set unset";
const old_names = ['unset'];

//PARAMS
const liftlower: BoolParam = {
  name: 'lift/lower',
  type: 'boolean',
  falsestate: 'unset to warp lift',
  truestate: 'unset to warp lower',
  value: 1,
  dx: ''
}

const params = [liftlower];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'static',
  value: null,
  dx: 'the draft you would like to modify',
  uses: "draft",
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let set_up = getOpParamValById(0, op_params);
  if (input_draft == null) return Promise.resolve([]);

  let pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    let set = row.map(el => {
      if (!el.is_set) {
        if (set_up == 1) return createCell(false);
        else return createCell(true);
      }
      return el;
    })

    pattern.pushWeftSequence(new Sequence.OneD().import(set).val())
  })


  let d = initDraftFromDrawdown(pattern.export())
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'set unset interlacements(' + parseDraftNames(drafts) + ")";
}


export const set: Operation = { name, old_names, params, inlets, perform, generateName };