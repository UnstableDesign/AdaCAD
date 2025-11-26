import { warps, wefts, flipDraft, cellToSequenceVal, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { defaults, lcm } from "../../utils";
import { clothOp } from "../categories";


const name = "chaos";

const meta: OpMeta = {
  displayname: "chaos sequence",
  categories: [clothOp],
  desc: "Made in collaboration Jacqueline Wernimont, Molly Morin and Nikki Stevens to explore non-deterministic drafts. Tiles the input drafts, randomly selecting which draft to place at which position. At each position, it randomly rotates the draft by either 90, 180 or 270 degrees. ",
  img: "chaos.png"
}

//PARAMS
const warp_repeats: NumParam =
{
  name: 'warp-repeats',
  type: 'number',
  min: 1,
  max: 5000,
  value: 2,
  dx: 'the number of times to repeat this time across the width'
};

const weft_repeats: NumParam = {
  name: 'weft-repeats',
  type: 'number',
  min: 1,
  max: 5000,
  value: 2,
  dx: 'the number of times to repeat this time across the length'
}


const params = [warp_repeats, weft_repeats];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  dx: 'the draft to tile in the chaos sequence',
  uses: 'draft',
  num_drafts: -1
}

const inlets = [draft_inlet];


const perform = async (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const input_drafts = getAllDraftsAtInlet(op_inputs, 0);
  const warp_rep: number = <number>getOpParamValById(0, op_params);
  const weft_rep: number = <number>getOpParamValById(1, op_params);


  if (input_drafts.length == 0) return Promise.resolve([]);


  const all_warps = input_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  const total_warps = lcm(all_warps, defaults.lcm_timeout);

  const all_wefts = input_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  const total_wefts = lcm(all_wefts, defaults.lcm_timeout);
  const num_inputs = input_drafts.length;

  const draft_indexing_fns = [];
  //randomly grab one of the inputs
  let ndx = Math.floor(Math.random() * num_inputs);
  for (let i = 0; i < weft_rep; i++) {
    for (let j = 0; j < warp_rep; j++) {
      const x_flip = (Math.random() < 0.5) ? false : true;
      const y_flip = (Math.random() < 0.5) ? false : true;
      draft_indexing_fns.push(flipDraft(input_drafts[ndx], x_flip, y_flip));
      ndx = Math.floor(Math.random() * num_inputs);
    }
  }

  return Promise.all(draft_indexing_fns).then(all_flips => {
    const pattern = new Sequence.TwoD();


    for (let di = 0; di < weft_rep; di++) {

      const drafts_on_row = all_flips.filter((el, ndx) => (ndx >= warp_rep * di && ndx < warp_rep * di + warp_rep));

      for (let i = 0; i < total_wefts; i++) {
        const seq = new Sequence.OneD();
        drafts_on_row
          .forEach(draft_on_row => {
            const selected_row = draft_on_row.drawdown[i % wefts(draft_on_row.drawdown)]
            const expanded = new Sequence.OneD(selected_row.map(cell => cellToSequenceVal(cell))).resize(total_warps);
            seq.pushRow(expanded.val())
          })
        pattern.pushWeftSequence(seq.val());
      }
    }



    let d = initDraftFromDrawdown(pattern.export());
    d = updateWeftSystemsAndShuttles(d, input_drafts[0]);
    d = updateWarpSystemsAndShuttles(d, input_drafts[0]);

    return Promise.resolve([{ draft: d }]);


  })


}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'chaos(' + parseDraftNames(drafts) + ")";
}

const sizeCheck = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
  const input_drafts = getAllDraftsAtInlet(op_inputs, 0);
  if (input_drafts.length == 0) return true;

  const all_warps = input_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  const total_warps = lcm(all_warps, defaults.lcm_timeout);

  const all_wefts = input_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  const total_wefts = lcm(all_wefts, defaults.lcm_timeout);

  const warp_rep: number = <number>getOpParamValById(0, op_params);
  const weft_rep: number = <number>getOpParamValById(1, op_params);

  const area = total_warps * total_wefts * warp_rep * weft_rep;
  return (area <= defaults.max_area ? true : false);

}

export const chaos: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };