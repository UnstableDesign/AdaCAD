import { createCell, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { BoolParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";


const name = "set down to unset";
const old_names = ['set'];

//PARAMS
const liftlower: BoolParam = {
  name: 'raised/lowered',
  type: 'boolean',
  falsestate: 'warp raised to unset',
  truestate: 'warp lowered to unset',
  value: 1,
  dx: ""
}

const params = [liftlower];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to modify',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  const set_up = getOpParamValById(0, op_params);
  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    const set = row.map(el => {
      if (el.is_set) {
        if (el.is_up && set_up == 0) return createCell(null);
        else if (!el.is_up && set_up == 1) return createCell(null);
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
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'set interlacements to unset(' + parseDraftNames(drafts) + ")";
}


export const unset: Operation = { name, old_names, params, inlets, perform, generateName };