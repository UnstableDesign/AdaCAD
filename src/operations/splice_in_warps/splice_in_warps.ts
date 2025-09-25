import { Draft, warps, wefts, makeSystemsUnique, getHeddle, initDraftFromDrawdown, updateWeftSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { lcm, getMaxWefts } from "../../utils";
import { compoundOp } from "../categories";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "splice_in_warps";

const meta: OpMeta = {
  displayname: 'splice in ends',
  desc: 'Splices the ends of the `splicing draft` input draft into the `receiving draft`. You can use the parameters to describe if you want the entire draft spliced in, or to splice the draft in end by end and the amount of ends between each insertion.',
  img: 'splice_in_warps.png',
  categories: [compoundOp],
  advanced: true,
  old_names: ['splice in warps']
}

//PARAMS
const ends_btwn: NumParam =
{
  name: 'ends between insertions',
  type: 'number',
  min: 1,
  max: 100,
  value: 1,
  dx: "the number of ends to keep between each splice"
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


const params = [ends_btwn, repeats, style];

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
  const ends_btwn = <number>getOpParamValById(0, op_params);
  const repeat = <number>getOpParamValById(1, op_params);
  const style = getOpParamValById(2, op_params);

  const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];
  const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];

  const all_drafts: Array<Draft> = [receiving_draft, splicing_draft].filter((d): d is Draft => d !== null);

  if (all_drafts.length == 0) return Promise.resolve([]);
  if (receiving_draft == null || splicing_draft == null) return Promise.resolve([]);

  let total_warps: number = 0;
  let factors: Array<number> = [];
  if (repeat === 1) {
    if (style) {
      factors = [warps(receiving_draft.drawdown), (warps(splicing_draft.drawdown) * (ends_btwn + warps(splicing_draft.drawdown)))];
    } else {
      factors = [warps(receiving_draft.drawdown), warps(splicing_draft.drawdown) * (ends_btwn + 1)];
    }
    total_warps = lcm(factors);
  }
  else {
    //sums the warps from all the drafts
    total_warps = all_drafts.reduce((acc, el) => {
      return acc + warps((el) ? el.drawdown : []);
    }, 0);
  }

  let total_wefts: number = 0;
  const all_wefts: Array<number> = all_drafts.map(el => wefts((el) ? el.drawdown : [])).filter(el => el !== null);

  if (repeat === 1) total_wefts = lcm(all_wefts);
  else total_wefts = getMaxWefts(all_drafts);


  const uniqueSystemCols = makeSystemsUnique(all_drafts.map(el => el.colSystemMapping));

  let array_a_ndx = 0;
  let array_b_ndx = 0;

  //create a draft to hold the merged values
  // const d:Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, rowShuttleMapping:static_input.rowShuttleMapping, rowSystemMapping:static_input.rowSystemMapping});

  const pattern = new Sequence.TwoD();
  const col_shuttle: Array<number> = [];
  const col_system: Array<number> = [];

  for (let j = 0; j < total_warps; j++) {
    let select_array: number;
    if (style) {
      const cycle = ends_btwn + warps(splicing_draft.drawdown);
      select_array = (j % (cycle) >= ends_btwn) ? 1 : 0;
    } else {
      select_array = (j % (ends_btwn + 1) === ends_btwn) ? 1 : 0;
    }

    if (!repeat) {
      if (array_b_ndx >= warps(splicing_draft.drawdown)) select_array = 0;
      if (array_a_ndx >= warps(receiving_draft.drawdown)) select_array = 1;
    }

    const cur_warp_num = warps(all_drafts[select_array].drawdown)
    const ndx = (select_array === 0) ? array_a_ndx % cur_warp_num : array_b_ndx % cur_warp_num;

    const seq = new Sequence.OneD();
    for (let i = 0; i < total_wefts; i++) {
      const cur_weft_num = wefts(all_drafts[select_array].drawdown);
      if (i >= cur_weft_num && !repeat) seq.push(2);
      seq.push(getHeddle(all_drafts[select_array].drawdown, i % cur_weft_num, ndx));
    }

    pattern.pushWarpSequence(seq.val());



    // const col:Array<Cell> = d.drawdown.reduce((acc, el) => {
    //   acc.push(el[j]);
    //   return acc;
    // }, [])



    col_system.push(uniqueSystemCols[select_array][ndx]);
    col_shuttle.push(all_drafts[select_array].colShuttleMapping[ndx]);


    if (select_array === 0) {
      array_a_ndx++;
    }
    else {
      array_b_ndx++;
    }

  }

  let d: Draft = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = col_shuttle.slice();
  d.colSystemMapping = col_system.slice();
  d = updateWeftSystemsAndShuttles(d, receiving_draft);
  // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
  return Promise.resolve([{ draft: d }]);

};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const r = getAllDraftsAtInlet(op_inputs, 0);
  const s = getAllDraftsAtInlet(op_inputs, 1);
  const name_list = parseDraftNames(r.concat(s));
  return "spliced(" + name_list + ")";
}


export const splice_in_warps: Operation = { name, meta, params, inlets, perform, generateName };