import { createCell, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "..";
import { BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { transformationOp } from "../categories";


const name = "set_unset";

const meta: OpMeta = {
  displayname: 'set unset',
  desc: 'Sets all unset interlacements/cells in this draft to the value set in the parameter.',
  img: 'set_unset.png',
  categories: [transformationOp],
  advanced: true,
  old_names: ['unset', 'set unset']
}


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

  const input_draft = getInputDraft(op_inputs);
  const set_up = getOpParamValById(0, op_params);
  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    const set = row.map(el => {
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

  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'set unset interlacements(' + parseDraftNames(drafts) + ")";
}

const sizeCheck = (): boolean => {
  return true;
}

export const set_unset: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };