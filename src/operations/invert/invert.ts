import { Draft, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { transformationOp } from "../categories";


const name = "invert";

const meta: OpMeta = {
  displayname: 'invert',
  desc: 'Inverts the draft so that raised warp ends become weft picks and weft pics become raised warp ends.',
  img: 'invert.png',
  categories: [transformationOp],
}


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


export const invert: Operation = { name, meta, params, inlets, perform, generateName };



