import { Draft, warps, wefts, getCol, getCellValue, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { lcm, getMaxWarps } from "../../utils";
import { clothOp } from "../categories";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../operations";
import { BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "join_top";

const meta: OpMeta = {
  displayname: 'join top',
  desc: 'Joins drafts assigned to the inlets vertically.',
  img: 'join_top.png',
  categories: [clothOp],
  old_names: ['join top']

}


//PARAMS

const repeats: BoolParam = {
  name: 'calculate repeats',
  type: 'boolean',
  falsestate: 'do not repeat inputs to match size',
  truestate: 'repeat inputs to match size',
  value: 1,
  dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
}



const params = [repeats];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to join horizontally',
  num_drafts: -1
}

const warp_data: OperationInlet = {
  name: 'warp pattern',
  type: 'static',
  value: null,
  uses: "warp-data",
  dx: 'optional, define a custom warp material or system pattern here',
  num_drafts: 1
}




const inlets = [draft_inlet, warp_data];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const warpdata = getAllDraftsAtInlet(op_inputs, 1);
  const factor_in_repeats = getOpParamValById(0, op_params);

  if (drafts.length == 0) return Promise.resolve([]);

  let total_warps: number = 0;
  const all_warps = drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  if (factor_in_repeats === 1) total_warps = lcm(all_warps);
  else total_warps = getMaxWarps(drafts);

  const pattern = new Sequence.TwoD();

  for (let j = 0; j < total_warps; j++) {

    const seq = new Sequence.OneD();
    drafts.forEach(draft => {

      if (!factor_in_repeats && j >= warps(draft.drawdown)) {
        seq.pushMultiple(2, wefts(draft.drawdown));
      } else {
        const col = getCol(draft.drawdown, j % warps(draft.drawdown));

        for (let i = 0; i < wefts(draft.drawdown); i++) {
          seq.push(getCellValue(col[i]));
        }
      }
    })
    pattern.pushWarpSequence(seq.val());
  }


  const d: Draft = initDraftFromDrawdown(pattern.export());

  const weft_mats = new Sequence.OneD();
  const weft_sys = new Sequence.OneD();



  drafts.forEach(draft => {
    for (let i = 0; i < wefts(draft.drawdown); i++) {
      weft_mats.push(draft.rowShuttleMapping[i]);
      weft_sys.push(draft.rowSystemMapping[i]);
    }
  })

  d.rowShuttleMapping = weft_mats.resize(wefts(d.drawdown)).val();

  d.rowSystemMapping = weft_sys.resize(wefts(d.drawdown)).val();

  if (warpdata.length > 0) {
    d.colShuttleMapping = new Sequence.OneD().import(warpdata[0].colShuttleMapping).resize(warps(d.drawdown)).val();

    d.colSystemMapping = new Sequence.OneD().import(warpdata[0].colSystemMapping).resize(warps(d.drawdown)).val();

  } else {

    d.colShuttleMapping = new Sequence.OneD().import(drafts[0].colShuttleMapping).resize(warps(d.drawdown)).val();

    d.colSystemMapping = new Sequence.OneD().import(drafts[0].colSystemMapping).resize(warps(d.drawdown)).val();

  }


  return Promise.resolve([{ draft: d }]);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(drafts);
  return "join top(" + name_list + ")";
}


export const join_top: Operation = { name, meta, params, inlets, perform, generateName };