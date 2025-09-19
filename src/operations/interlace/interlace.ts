import { wefts, makeSystemsUnique, warps, initDraftFromDrawdown, updateWarpSystemsAndShuttles, Draft } from "../../draft";
import { Sequence } from "../../sequence";
import { lcm, getMaxWarps } from "../../utils";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../operations";
import { BoolParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "interlace";
const old_names: Array<string> = [];


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

const warp_systems: OperationInlet = {
  name: 'warp system map',
  type: 'static',
  value: null,
  uses: "warp-data",
  dx: 'if you would like to specify the warp system or materials, you can do so by adding a draft here',
  num_drafts: 1
}


const inlets = [draft_inlet, warp_systems];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {


  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const systems = getAllDraftsAtInlet(op_inputs, 1);
  const repeat = getOpParamValById(0, op_params);

  if (drafts.length == 0) return Promise.resolve([]);


  const total_wefts = lcm(drafts.map(el => wefts(el.drawdown))) * drafts.length;


  const make_unique = drafts.reduce((acc: Array<Array<number>>, draft) => {
    const sized: Array<number> = new Sequence.OneD().import(draft.rowSystemMapping).resize(total_wefts).val();
    acc.push(sized);
    return acc;
  }, [])

  const unique = makeSystemsUnique(make_unique);

  let total_warps;
  if (repeat) {
    total_warps = lcm(drafts.map(el => warps(el.drawdown)));
  } else {
    total_warps = getMaxWarps(drafts);
  }


  const pattern = new Sequence.TwoD();
  const weft_systems: Array<number> = [];
  const weft_shuttles: Array<number> = [];

  for (let i = 0; i < total_wefts; i++) {

    const selected_draft_id = i % drafts.length;
    const within_draft_i = Math.floor(i / drafts.length);
    const selected_draft = drafts[selected_draft_id];




    if (repeat || within_draft_i < wefts(selected_draft.drawdown)) {

      const selected_draft = drafts[selected_draft_id];
      const modulated_id = within_draft_i % wefts(selected_draft.drawdown);
      const row = new Sequence.OneD().import(selected_draft.drawdown[modulated_id]);

      if (repeat) row.resize(total_warps);
      else row.padTo(total_warps);

      pattern.pushWeftSequence(row.val());
      weft_systems.push(unique[selected_draft_id][within_draft_i]);
      weft_shuttles.push(selected_draft.rowShuttleMapping[modulated_id]);
    }
  }

  let d = initDraftFromDrawdown(pattern.export());
  d.rowShuttleMapping = weft_shuttles;
  d.rowSystemMapping = weft_systems;
  if (systems.length > 0) d = updateWarpSystemsAndShuttles(d, systems[0]);



  return Promise.resolve([d]);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(drafts);
  return "interlace(" + name_list + ")";
}


export const interlace: Operation = { name, old_names, params, inlets, perform, generateName };