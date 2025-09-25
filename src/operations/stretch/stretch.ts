import { cellToSequenceVal, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../operations";
import { NumParam, Operation, OperationInlet, OpInput, OpMeta, OpParamVal } from "../types";
import { transformationOp } from "../categories";


const name = "stretch";

const meta: OpMeta = {
  displayname: 'stretch',
  desc: 'Repeats each warp and/or weft by the values given in the parameters.',
  img: 'stretch.png',
  categories: [transformationOp],
  advanced: true
}


//PARAMS
const warp_repeats: NumParam =
{
  name: 'warp-repeats',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'number of times to repeat each warp end'
};

const weft_repeats: NumParam = {
  name: 'weft-repeats',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'number of times to repeat each weft pic'
}


const params = [warp_repeats, weft_repeats];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to stretch',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);


  const warp_rep = <number>getOpParamValById(0, op_params);
  const weft_rep = <number>getOpParamValById(1, op_params);
  const weft_mats = new Sequence.OneD();
  const weft_sys = new Sequence.OneD();
  const warp_mats = new Sequence.OneD();
  const warp_sys = new Sequence.OneD();
  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach((row, i) => {
    const seq = new Sequence.OneD();
    row.forEach((cell, j) => {
      seq.pushMultiple(cellToSequenceVal(cell), warp_rep);
      if (i == 0) {
        for (let r = 0; r < warp_rep; r++) {
          warp_mats.push(input_draft.colShuttleMapping[j]);
          warp_sys.push(input_draft.colSystemMapping[j]);
        }
      }

    });

    for (let r = 0; r < weft_rep; r++) {
      weft_mats.push(input_draft.rowShuttleMapping[i]);
      weft_sys.push(input_draft.rowSystemMapping[i]);
      pattern.pushWeftSequence(seq.val());
    }
  })


  const d = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_sys.val();
  d.rowShuttleMapping = weft_mats.val();
  d.rowSystemMapping = weft_sys.val();


  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'stretch(' + parseDraftNames(drafts) + ")";
}


export const stretch: Operation = { name, meta, params, inlets, perform, generateName };