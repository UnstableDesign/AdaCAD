import { Draft, wefts, warps, getHeddle, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { lcm, getMaxWefts, defaults } from "../../utils";
import { clothOp } from "../categories";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../operations";
import { BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "join_left";

const meta: OpMeta = {
  displayname: 'join left',
  desc: 'Joins drafts assigned to the drafts input together horizontally.',
  img: 'join_left.png',
  categories: [clothOp],
  old_names: ['join left']
}


//PARAMS

const repeats: BoolParam = {
  name: 'calculate repeats',
  type: 'boolean',
  falsestate: 'do not repeat inputs to match size',
  truestate: 'repeat inputs to match size',
  value: 1,
  dx: "controls if the inputs are repeated along the height so they repeat in even intervals"
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

const weft_data: OperationInlet = {
  name: 'weft pattern',
  type: 'static',
  value: null,
  uses: "weft-data",
  dx: 'optional, define a custom weft material or system pattern here',
  num_drafts: 1
}




const inlets = [draft_inlet, weft_data];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const weftdata = getAllDraftsAtInlet(op_inputs, 1);
  const factor_in_repeats = getOpParamValById(0, op_params);

  if (drafts.length == 0) return Promise.resolve([]);

  let total_wefts: number = 0;

  const all_wefts = drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  if (factor_in_repeats === 1) total_wefts = lcm(all_wefts, defaults.lcm_timeout);
  else total_wefts = getMaxWefts(drafts);

  const pattern = new Sequence.TwoD();

  for (let i = 0; i < total_wefts; i++) {

    const seq = new Sequence.OneD();



    drafts.forEach(draft => {
      for (let j = 0; j < warps(draft.drawdown); j++) {
        if (!factor_in_repeats && i >= wefts(draft.drawdown)) {
          seq.push(2);
        } else {
          seq.push(getHeddle(draft.drawdown, i % wefts(draft.drawdown), j))
        }
      }
    })
    pattern.pushWeftSequence(seq.val());
  }


  const d: Draft = initDraftFromDrawdown(pattern.export());

  const warp_mats = new Sequence.OneD();
  const warp_sys = new Sequence.OneD();



  drafts.forEach(draft => {
    for (let j = 0; j < warps(draft.drawdown); j++) {
      warp_mats.push(draft.colShuttleMapping[j]);
      warp_sys.push(draft.colSystemMapping[j]);
    }
  })

  d.colShuttleMapping = warp_mats.resize(warps(d.drawdown)).val();

  d.colSystemMapping = warp_sys.resize(warps(d.drawdown)).val();

  if (weftdata.length > 0) {
    d.rowShuttleMapping = new Sequence.OneD().import(weftdata[0].rowShuttleMapping).resize(wefts(d.drawdown)).val();

    d.rowSystemMapping = new Sequence.OneD().import(weftdata[0].rowSystemMapping).resize(wefts(d.drawdown)).val();

  } else {

    d.rowShuttleMapping = new Sequence.OneD().import(drafts[0].rowShuttleMapping).resize(wefts(d.drawdown)).val();

    d.rowSystemMapping = new Sequence.OneD().import(drafts[0].rowSystemMapping).resize(wefts(d.drawdown)).val();

  }


  return Promise.resolve([{ draft: d }]);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(drafts);
  return "join left(" + name_list + ")";
}

const sizeCheck = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const factor_in_repeats = getOpParamValById(0, op_params);

  if (drafts.length == 0) return true;

  let total_wefts: number = 0;

  const all_wefts = drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  if (factor_in_repeats === 1) total_wefts = lcm(all_wefts, defaults.lcm_timeout);
  else total_wefts = getMaxWefts(drafts);

  const total_warps = drafts.reduce((acc, draft) => {
    return acc + warps(draft.drawdown);
  }, 0);

  return (total_wefts * total_warps <= defaults.max_area) ? true : false;
}

export const join_left: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };