import { warps, wefts, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, lcm, parseDraftNames } from "../../utils";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";


const name = "overlay_multiple";
const old_names: Array<string> = [];


//PARAMS


const params: Array<OperationParam> = [];

//INLETS
const drafts: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'all the drafts you would like to overlay another onto',
  num_drafts: -1
}



const inlets = [drafts];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);

  if (drafts.length == 0) return Promise.resolve([]);

  const sys_seq = new Sequence.OneD([0]);

  const composite = new Sequence.TwoD().setBlank(2);
  const ends = lcm(drafts.map(el => warps(el.drawdown)));
  const pics = lcm(drafts.map(el => wefts(el.drawdown)));



  drafts.forEach((draft) => {
    const seq = new Sequence.TwoD().import(draft.drawdown);
    seq.mapToSystems([0], [0], sys_seq, sys_seq, ends, pics);
    composite.overlay(seq, true);
  })


  let d = initDraftFromDrawdown(composite.export());
  d = updateWeftSystemsAndShuttles(d, drafts[0]);
  d = updateWarpSystemsAndShuttles(d, drafts[0]);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'overlay_multi' + parseDraftNames(drafts) + ")";
}


export const overlay_multi: Operation = { name, old_names, params, inlets, perform, generateName };