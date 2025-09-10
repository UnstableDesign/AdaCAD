import { initDraftFromDrawdown, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";
import { hasOnlyUnsetOrDown } from "../../utils";

const name = "erase blank rows";
const old_names: Array<string> = [];


//PARAMS

const params: OperationParam[] = [];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to erase blank rows from',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);

  if (input_draft == null) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();
  const weft_sys = new Sequence.OneD();
  const weft_mats = new Sequence.OneD();


  input_draft.drawdown.forEach((row, i) => {
    const seq = new Sequence.OneD().import(row);
    if (!hasOnlyUnsetOrDown(row)) {
      pattern.pushWeftSequence(seq.val());
      weft_sys.push(input_draft.rowSystemMapping[i])
      weft_mats.push(input_draft.rowShuttleMapping[i])
    }

  })






  let d = initDraftFromDrawdown(pattern.export());

  d.rowShuttleMapping = weft_mats.val();
  d.rowSystemMapping = weft_sys.val();
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'eraseblank(' + parseDraftNames(drafts) + ")";
}


export const erase_blank: Operation = { name, old_names, params, inlets, perform, generateName };