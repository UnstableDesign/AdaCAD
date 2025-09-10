import { initDraftFromDrawdown, createCell, wefts, warps, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "overlay";
const old_names = ['overlay', 'overlay, (a,b) => (a OR b)'];

//PARAMS

const shift_ends: NumParam =
{
  name: 'shift ends',
  type: 'number',
  min: 0,
  max: 10000,
  value: 0,
  dx: ''
};

const shift_pics: NumParam =
{
  name: 'shift pics',
  type: 'number',
  min: 0,
  max: 10000,
  value: 0,
  dx: ''
};

const params = [shift_ends, shift_pics];

//INLETS
const draft_a: OperationInlet = {
  name: 'a',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'all the drafts you would like to overlay another onto',
  num_drafts: 1
}

const draft_b: OperationInlet = {
  name: 'b',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to overlay onto the base',
  num_drafts: 1
}

const inlets = [draft_a, draft_b];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft_a = getAllDraftsAtInlet(op_inputs, 0);
  const input_draft_b = getAllDraftsAtInlet(op_inputs, 1);
  const shift_ends = <number>getOpParamValById(0, op_params);
  const shift_pics = <number>getOpParamValById(1, op_params);

  if (input_draft_a.length == 0 && input_draft_b.length == 0) return Promise.resolve([]);

  const draft_a = (input_draft_a.length == 0) ? initDraftFromDrawdown([[createCell(null)]]) : input_draft_a[0];
  const draft_b = (input_draft_b.length == 0) ? initDraftFromDrawdown([[createCell(null)]]) : input_draft_b[0];


  const height = Math.max(wefts(draft_b.drawdown) + shift_pics, wefts(draft_a.drawdown));
  const width = Math.max(warps(draft_b.drawdown) + shift_ends, warps(draft_a.drawdown));


  //offset draft b:
  const pattern_b = new Sequence.TwoD();
  for (let i = 0; i < height; i++) {
    const seq = new Sequence.OneD();
    if (i < shift_pics) {
      seq.pushMultiple(2, width);
    } else if (i < (shift_pics + wefts(draft_b.drawdown))) {
      seq.pushMultiple(2, shift_ends).pushRow(draft_b.drawdown[i - shift_pics]);
      const remaining = width - (warps(draft_b.drawdown) + shift_ends);
      if (remaining > 0) seq.pushMultiple(2, remaining);
    } else {
      seq.pushMultiple(2, width);
    }
    pattern_b.pushWeftSequence(seq.val());
  }

  //make sure pattern a is the same size
  const pattern_a = new Sequence.TwoD();
  for (let i = 0; i < height; i++) {
    const seq = new Sequence.OneD();
    if (i < wefts(draft_a.drawdown)) {
      seq.pushRow(draft_a.drawdown[i]);
      const remaining = width - draft_a.drawdown[i].length;
      if (remaining > 0) seq.pushMultiple(2, remaining);
    } else {
      seq.pushMultiple(2, width);
    }
    pattern_a.pushWeftSequence(seq.val());
  }



  const pattern = new Sequence.TwoD();
  for (let i = 0; i < height; i++) {
    const seq_a = new Sequence.OneD(pattern_a.getWeft(i));
    const seq_b = new Sequence.OneD(pattern_b.getWeft(i));
    seq_a.computeFilter('or', seq_b);
    pattern.pushWeftSequence(seq_a.val());
  }





  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, draft_a);
  d = updateWarpSystemsAndShuttles(d, draft_a);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'overlay' + parseDraftNames(drafts) + ")";
}


export const overlay: Operation = { name, old_names, params, inlets, perform, generateName };