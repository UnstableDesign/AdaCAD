import { initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../utils";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";


const name = "flip horiz";
const old_names: Array<string> = [];


//PARAMS

const params: Array<OperationParam> = [];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to flip horizontally',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    const seq = new Sequence.OneD().import(row).reverse().val();
    pattern.pushWeftSequence(seq);
  })

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'flipx(' + parseDraftNames(drafts) + ")";
}


export const flipx: Operation = { name, old_names, params, inlets, perform, generateName };