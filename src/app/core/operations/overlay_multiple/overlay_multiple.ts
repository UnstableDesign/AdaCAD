import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "adacad-drafting-lib/draft";
import { Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "overlay_multiple";
const old_names = [];

//PARAMS


const params = [];

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

  let drafts = getAllDraftsAtInlet(op_inputs, 0);

  if (drafts.length == 0) return Promise.resolve([]);

  let sys_seq = new Sequence.OneD([0]);

  let composite = new Sequence.TwoD().setBlank(2);
  let ends = utilInstance.lcm(drafts.map(el => warps(el.drawdown)));
  let pics = utilInstance.lcm(drafts.map(el => wefts(el.drawdown)));



  drafts.forEach((draft, ndx) => {
    let seq = new Sequence.TwoD().import(draft.drawdown);
    seq.mapToSystems([0], [0], sys_seq, sys_seq, ends, pics);
    composite.overlay(seq, true);
  })


  let d = initDraftFromDrawdown(composite.export());
  d = updateWeftSystemsAndShuttles(d, drafts[0]);
  d = updateWarpSystemsAndShuttles(d, drafts[0]);

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'overlay_multi' + parseDraftNames(drafts) + ")";
}


export const overlay_multi: Operation = { name, old_names, params, inlets, perform, generateName };