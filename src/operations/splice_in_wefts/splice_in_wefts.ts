import { Draft, wefts, warps, makeSystemsUnique, getHeddle, initDraftFromDrawdown, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { lcm, getMaxWarps, defaults } from "../../utils";
import { compoundOp } from "../categories";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "splice_in_wefts";

const meta: OpMeta = {
  displayname: 'splice in pics',
  desc: 'Splices the pics of the `splicing draft` input draft into the `receiving draft`. You can use the parameters to describe if you want the entire draft spliced in, or to splice the draft in pic by pic and the amount of pics between each insertion.',
  img: 'splice_in_wefts.png',
  categories: [compoundOp],
  advanced: true,
  old_names: ['splice in wefts']
}

//PARAMS
const pics_btwn: NumParam =
{
  name: 'pics between insertions',
  type: 'number',
  min: 1,
  max: 5000,
  value: 1,
  dx: "the number of pics to keep between each splice row"
}

const repeats: BoolParam =
{
  name: 'calculate repeats',
  type: 'boolean',
  falsestate: 'do not repeat inputs to match size',
  truestate: 'repeat inputs to match size',
  value: 1,
  dx: ""
};

const style: BoolParam =
{
  name: 'splice style',
  type: 'boolean',
  falsestate: 'line by line',
  truestate: 'whole draft',
  value: 0,
  dx: "controls if the whole draft is spliced in every nth weft or just the next pic in the draft"
}





const params = [pics_btwn, repeats, style];

//INLETS
const receiving: OperationInlet = {
  name: 'receiving draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'all the drafts you would like to interlace',
  num_drafts: 1
}

const splicing: OperationInlet = {
  name: 'splicing draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to splice into the recieving draft',
  num_drafts: 1
}


const inlets = [receiving, splicing];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const receiving_drafts = getAllDraftsAtInlet(op_inputs, 0);
  const splicing_drafts = getAllDraftsAtInlet(op_inputs, 1);
  const pics_btwn = <number>getOpParamValById(0, op_params);
  const repeat = <number>getOpParamValById(1, op_params);
  const style = getOpParamValById(2, op_params);

  const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];

  const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];

  const all_drafts: Array<Draft> = [receiving_draft, splicing_draft].filter((d): d is Draft => d !== null);

  if (all_drafts.length == 0) return Promise.resolve([]);
  if (receiving_draft == null || splicing_draft == null) return Promise.resolve([]);

  let total_wefts: number = 0;
  if (repeat === 1) {
    let factors = [];
    if (style) {
      factors = [wefts(splicing_draft.drawdown), wefts(splicing_draft.drawdown) * (pics_btwn + wefts(splicing_draft.drawdown))];
    } else {
      factors = [wefts(receiving_draft.drawdown), wefts(splicing_draft.drawdown) * (pics_btwn + 1)];
    }
    total_wefts = lcm(factors, defaults.lcm_timeout);
  }
  else {
    //sums the wefts from all the drafts
    total_wefts = all_drafts.reduce((acc, el) => {
      return acc + wefts((el) ? el.drawdown : []);
    }, 0);
  }

  let total_warps: number = 0;
  const all_warps = all_drafts.map(el => warps((el) ? el.drawdown : [])).filter(el => el > 0);
  if (repeat === 1) total_warps = lcm(all_warps, defaults.lcm_timeout);
  else total_warps = getMaxWarps(all_drafts);


  const uniqueSystemRows = makeSystemsUnique(all_drafts.map(el => el.rowSystemMapping));

  let array_a_ndx = 0;
  let array_b_ndx = 0;

  const row_shuttle = [];
  const row_system = [];
  const pattern = new Sequence.TwoD();

  for (let i = 0; i < total_wefts; i++) {
    let select_array: number = 0;

    if (style) {
      const cycle = pics_btwn + wefts(splicing_draft.drawdown);
      select_array = (i % cycle >= pics_btwn) ? 1 : 0;
    } else {
      select_array = (i % (pics_btwn + 1) === pics_btwn) ? 1 : 0;
    }

    if (!repeat) {
      if (array_b_ndx >= wefts(splicing_draft.drawdown)) select_array = 0;
      if (array_a_ndx >= warps(receiving_draft.drawdown)) select_array = 1;
    }

    const cur_weft_num = wefts(all_drafts[select_array].drawdown);
    const ndx = (select_array === 0) ? array_a_ndx % cur_weft_num : array_b_ndx % cur_weft_num;
    const seq = new Sequence.OneD();
    for (let j = 0; j < total_warps; j++) {
      const cur_warp_num = warps(all_drafts[select_array].drawdown);
      if (j >= cur_warp_num && !repeat) seq.push(2);
      else seq.push(getHeddle(all_drafts[select_array].drawdown, ndx, j % cur_warp_num));

    }

    row_system.push(uniqueSystemRows[select_array][ndx]);
    row_shuttle.push(all_drafts[select_array].rowShuttleMapping[ndx]);
    pattern.pushWeftSequence(seq.val());


    if (select_array === 0) {
      array_a_ndx++;
    }
    else {
      array_b_ndx++;
    }

  }
  let d = initDraftFromDrawdown(pattern.export());
  d.rowShuttleMapping = row_shuttle;
  d.rowSystemMapping = row_system.slice();
  if (receiving_draft !== null)
    d = updateWarpSystemsAndShuttles(d, receiving_draft);
  return Promise.resolve([{ draft: d }]);

};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const r = getAllDraftsAtInlet(op_inputs, 0);
  const s = getAllDraftsAtInlet(op_inputs, 1);
  const name_list = parseDraftNames(r.concat(s));
  return "spliced(" + name_list + ")";
}


export const splice_in_wefts: Operation = { name, meta, params, inlets, perform, generateName };