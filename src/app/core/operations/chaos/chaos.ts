import { flipDraft, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "adacad-drafting-lib/draft";
import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "chaos";
const old_names = [];

//PARAMS
const warp_repeats: NumParam =
{
  name: 'warp-repeats',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'the number of times to repeat this time across the width'
};

const weft_repeats: NumParam = {
  name: 'weft-repeats',
  type: 'number',
  min: 1,
  max: 100,
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


  let input_drafts = getAllDraftsAtInlet(op_inputs, 0);
  let warp_rep = getOpParamValById(0, op_params);
  let weft_rep = getOpParamValById(1, op_params);


  if (input_drafts.length == 0) return Promise.resolve([]);


  const all_warps = input_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  const total_warps = utilInstance.lcm(all_warps);

  const all_wefts = input_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  const total_wefts = utilInstance.lcm(all_wefts);
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
        let seq = new Sequence.OneD();
        drafts_on_row
          .forEach(draft_on_row => {
            let expanded = new Sequence.OneD(draft_on_row.drawdown[i % wefts(draft_on_row.drawdown)]).resize(total_warps);
            seq.pushRow(expanded.val())
          })
        pattern.pushWeftSequence(seq.val());
      }
    }



    let d = initDraftFromDrawdown(pattern.export());
    d = updateWeftSystemsAndShuttles(d, input_drafts[0]);
    d = updateWarpSystemsAndShuttles(d, input_drafts[0]);

    return Promise.resolve([d]);


  })


}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'chaos(' + parseDraftNames(drafts) + ")";
}


export const chaos: Operation = { name, old_names, params, inlets, perform, generateName };