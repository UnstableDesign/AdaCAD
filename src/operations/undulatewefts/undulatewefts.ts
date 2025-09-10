import { Draft, wefts, warps, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, getAllDraftsAtInlet } from "../../operations";
import { StringParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";
import { parseRegex } from "../../utils";

const name = "undulatewefts";
const old_names: Array<string> = [];


//PARAMS
const shift_pattern: StringParam =
{
  name: 'undulation pattern',
  type: 'string',
  regex: /\d+|\D+/i,
  value: '1 1 1 2 2 3',
  error: '',
  dx: 'shifts each pic of the input draft according to the number sequence specified.'
};




const params = [shift_pattern];

//INLETS

const draft_input: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to undulate',
  num_drafts: 1
}

const inlets = [draft_input];


const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const undulating_string: string = <string>getOpParamValById(0, param_vals);

  const drafts: Array<Draft> = getAllDraftsAtInlet(op_inputs, 0);

  if (drafts.length == 0) return Promise.resolve([]);

  const regex_matches = parseRegex(undulating_string, shift_pattern.regex)


  const undulating_array = regex_matches
    .filter(el => el !== ' ')
    .map(el => parseInt(el))


  const pattern = new Sequence.TwoD();

  let max_wefts = 0;
  let max_warps = 0;


  max_wefts = wefts(drafts[0].drawdown);
  max_warps = warps(drafts[0].drawdown)


  for (let i = 0; i < max_wefts; i++) {

    const und_val = undulating_array[i % undulating_array.length];


    pattern.pushWeftSequence(
      new Sequence.OneD()
        .import(drafts[0].drawdown[i % wefts(drafts[0].drawdown)])
        .resize(max_warps)
        .shift(und_val)
        .val());

  }

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWarpSystemsAndShuttles(d, drafts[0]);
  d = updateWeftSystemsAndShuttles(d, drafts[0]);

  return Promise.resolve([d]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'undulate wefts(' + param_vals[0].val + ')';
}



export const undulatewefts: Operation = { name, old_names, params, inlets, perform, generateName };



