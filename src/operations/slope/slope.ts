import { Draft, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, getAllDraftsAtInlet } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "slope";
const old_names: Array<string> = [];


//PARAMS
const end_shift: NumParam =
{
  name: 'end shift',
  type: 'number',
  min: -100,
  max: 100,
  value: 1,
  dx: 'the amount to shift rows by'
};

const pic_shift: NumParam = {
  name: 'pic shift (n)',
  type: 'number',
  min: 0,
  max: 100,
  value: 1,
  dx: 'describes how many rows we should apply the shift to'
};



const params = [end_shift, pic_shift];

//INLETS

const draft_input: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to slope',
  num_drafts: 1
}

const inlets = [draft_input];


const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const end_shift: number = <number>getOpParamValById(0, param_vals);
  const pic_shift: number = <number>getOpParamValById(1, param_vals);

  const drafts: Array<Draft> = getAllDraftsAtInlet(op_inputs, 0);

  if (drafts.length == 0) return Promise.resolve([]);

  const pattern = new Sequence.TwoD();

  drafts[0].drawdown.forEach((row, i) => {

    let row_shift = 0;
    if (pic_shift > 0)
      row_shift = Math.floor(i / pic_shift) * end_shift;

    pattern.pushWeftSequence(new Sequence.OneD().import(row).shift(row_shift).val())

  })

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWarpSystemsAndShuttles(d, drafts[0]);
  d = updateWeftSystemsAndShuttles(d, drafts[0]);


  return Promise.resolve([d]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  const end_shift: number = <number>getOpParamValById(0, param_vals);
  const pic_shift: number = <number>getOpParamValById(1, param_vals);
  return 'slope' + pic_shift + "/" + end_shift;
}


export const slope: Operation = { name, old_names, params, inlets, perform, generateName };



