import { Draft, wefts, warps, getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { parseRegex } from "../../utils";
import { transformationOp } from "../categories";
import { getOpParamValById, getAllDraftsAtInlet } from "../operations";
import { StringParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";


const name = "undulatewarps";


const meta: OpMeta = {
  displayname: 'undulate warps',
  desc: 'Given a user specified input of a series of number, it shifts every end by the value specified in the corresponding location of the user specified input. For example, if 1 3 1 is entered, it shifts the first end to the down by 1, second to the down by 3, third down by 1',
  img: 'undulatewarps.png',
  categories: [transformationOp],
  advanced: true
}


//PARAMS
const shift_pattern: StringParam =
{
  name: 'undulation pattern',
  type: 'string',
  regex: /\d+|\D+/i,
  value: '1 1 1 2 2 3',
  error: '',
  dx: 'shifts each end of the input draft according to the number sequence specified.'
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


  const max_wefts = wefts(drafts[0].drawdown);
  const max_warps = warps(drafts[0].drawdown)


  for (let j = 0; j < max_warps; j++) {

    const und_val = undulating_array[j % undulating_array.length];


    pattern.pushWarpSequence(
      new Sequence.OneD()
        .import(getCol(drafts[0].drawdown, j % warps(drafts[0].drawdown)))
        .resize(max_wefts)
        .shift(und_val)
        .val());

  }

  let d = initDraftFromDrawdown(pattern.export());
  d = updateWarpSystemsAndShuttles(d, drafts[0]);
  d = updateWeftSystemsAndShuttles(d, drafts[0]);

  return Promise.resolve([d]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'undulate warps(' + param_vals[0].val + ')';
}


export const undulatewarps: Operation = { name, meta, params, inlets, perform, generateName };



