import { warps, copyDraft, Draft } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "apply warp materials";

// const meta: OpMeta = {
//   displayname: "set warp materials",
//   desc: "Copies the materials used in the materials draft to the ends of the input draft.",
//   application: "Applying materials allows one to visualize the relationship between the draft and the color effects visible on the cloth's surface",
//   categories: [colorEffectsOp]
// }

const old_names: Array<string> = [];

//PARAMS
const shift_warp_mat: NumParam =
{
  name: 'warp colors shift',
  min: 0,
  max: 10000,
  value: 0,
  type: 'number',
  dx: 'number of ends by which to shift the warp color pattern'
}




const params = [shift_warp_mat];



//INLETS
const draft: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  uses: 'draft',
  dx: 'the draft to which you would like to apply materials',
  num_drafts: 1
}

const materials: OperationInlet = {
  name: 'warp materials',
  type: 'static',
  value: null,
  uses: 'warp-data',
  dx: 'a draft which has the materials you would like to repeat across the ends of the resulting draft',
  num_drafts: 1
}


const inlets = [draft, materials];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {

  const base_drafts = getAllDraftsAtInlet(op_inputs, 0);
  const materials_drafts = getAllDraftsAtInlet(op_inputs, 1);

  const warp_mat_shift: number = <number>getOpParamValById(0, op_params);


  if (base_drafts.length == 0 && materials_drafts.length == 0) return Promise.resolve([]);



  if (base_drafts.length == 0) return Promise.resolve([materials_drafts[0]]);
  if (materials_drafts.length == 0) return Promise.resolve([base_drafts[0]]);


  const active_draft = base_drafts[0];
  const materials_draft = materials_drafts[0];


  const width = warps(active_draft.drawdown);

  const warp_mats = new Sequence.OneD(materials_draft.colShuttleMapping).resize(width).shift(warp_mat_shift);


  const d = copyDraft(active_draft);
  d.colShuttleMapping = warp_mats.val();


  return Promise.resolve([d]);


};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const r = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(r);
  return name_list;
}


export const apply_warp_mats: Operation = { name, old_names, params, inlets, perform, generateName };

