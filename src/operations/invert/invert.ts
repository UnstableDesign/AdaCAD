import { Draft, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";


const name = "invert";
const old_names: Array<string> = [];


//PARAMS


const params: Array<OperationParam> = [];

//INLETS

const input: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to invert',
  num_drafts: 1
};

const inlets = [input];


const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();
  input_draft.drawdown.forEach(row => {
    const r = new Sequence.OneD().import(row).invert().val();
    pattern.pushWeftSequence(r);
  });

  let d: Draft = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);


  return Promise.resolve([d]);

}


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'invert(' + parseDraftNames(drafts) + ")";


}


export const invert: Operation = { name, old_names, params, inlets, perform, generateName };



