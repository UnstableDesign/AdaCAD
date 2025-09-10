import { getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps } from "adacad-drafting-lib/draft";
import { Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "flip vert";
const old_names = [];

//PARAMS

const params = [];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to flip vertically',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);

  let pattern = new Sequence.TwoD();

  for (let j = 0; j < warps(input_draft.drawdown); j++) {
    const col = getCol(input_draft.drawdown, j);
    let seq = new Sequence.OneD().import(col).reverse().val();
    pattern.pushWarpSequence(seq);

  }


  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'flipy(' + parseDraftNames(drafts) + ")";
}


export const flipy: Operation = { name, old_names, params, inlets, perform, generateName };