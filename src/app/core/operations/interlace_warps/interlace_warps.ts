import { getCol, initDraftFromDrawdown, updateWeftSystemsAndShuttles, warps, wefts } from "adacad-drafting-lib/draft";
import { BoolParam, Draft, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "interlacewarps";
const old_names = ['interlace_warps'];

//PARAMS
const repeats: BoolParam =
{
  name: 'calculate repeats',
  type: 'boolean',
  falsestate: 'do not repeat inputs to match size',
  truestate: 'repeat inputs to match size',
  value: 1,
  dx: "controls if the inputs are intelaced in the exact format sumitted or repeated to fill evenly"
}



const params = [repeats];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'drafts',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'all the drafts you would like to interlace',
  num_drafts: -1
}

const weft_systems: OperationInlet = {
  name: 'weft system map',
  type: 'static',
  value: null,
  uses: "weft-data",
  dx: 'if you would like to specify the weft system or materials, you can do so by adding a draft here',
  num_drafts: 1
}


const inlets = [draft_inlet, weft_systems];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {


  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  let systems = getAllDraftsAtInlet(op_inputs, 1);
  let repeat = getOpParamValById(0, op_params);

  if (drafts.length == 0) return Promise.resolve([]);


  let total_warps = utilInstance.lcm(drafts.map(el => warps(el.drawdown))) * drafts.length;

  let total_wefts;
  if (repeat) {
    total_wefts = utilInstance.lcm(drafts.map(el => wefts(el.drawdown)));
  } else {
    total_wefts = utilInstance.getMaxWefts(drafts);
  }


  let pattern = new Sequence.TwoD();
  let warp_systems: Array<number> = [];
  let warp_shuttles: Array<number> = [];

  for (let j = 0; j < total_warps; j++) {

    let selected_draft_id = j % drafts.length;
    let within_draft_j = Math.floor(j / drafts.length);
    let selected_draft = drafts[selected_draft_id];

    if (repeat || within_draft_j < warps(selected_draft.drawdown)) {

      let selected_draft = drafts[selected_draft_id];
      let modulated_id = within_draft_j % warps(selected_draft.drawdown);
      let col = new Sequence.OneD().import(getCol(selected_draft.drawdown, modulated_id));

      if (repeat) col.resize(total_wefts);
      else col.padTo(total_wefts);

      pattern.pushWarpSequence(col.val());
      warp_systems.push(selected_draft.colSystemMapping[modulated_id]);
      warp_shuttles.push(selected_draft.colShuttleMapping[modulated_id]);
    }
  }

  let d = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = warp_shuttles;
  d.colSystemMapping = warp_systems;
  if (systems.length > 0) d = updateWeftSystemsAndShuttles(d, systems[0]);



  return Promise.resolve([d]);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  let name_list = parseDraftNames(drafts);
  return "interlace warps(" + name_list + ")";
}


export const interlacewarps: Operation = { name, old_names, params, inlets, perform, generateName };