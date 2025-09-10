import { copyDraft, wefts } from "adacad-drafting-lib/draft";
import { Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";

const name = "apply weft materials";
const old_names = [];

//PARAMS

const shift_weft_mats: NumParam = {
  name: 'weft colors shift',
  min: 0,
  max: 10000,
  value: 0,
  type: 'number',
  dx: 'number of pics by which to shift the weft color pattern'
}





const params = [shift_weft_mats];



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
  name: 'materials',
  type: 'static',
  value: null,
  uses: 'weft-data',
  dx: 'a draft which has the materials you would like to repeat across the pics and ends of the resulting draft',
  num_drafts: 1
}


const inlets = [draft, materials];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {

  const base_drafts = getAllDraftsAtInlet(op_inputs, 0);
  const materials_drafts = getAllDraftsAtInlet(op_inputs, 1);

  const weft_mat_shift = getOpParamValById(0, op_params);

  if (base_drafts.length == 0 && materials_drafts.length == 0) return Promise.resolve([]);



  if (base_drafts.length == 0) return Promise.resolve([materials_drafts[0]]);
  if (materials_drafts.length == 0) return Promise.resolve([base_drafts[0]]);


  let active_draft = base_drafts[0];
  let materials_draft = materials_drafts[0];


  let height = wefts(active_draft.drawdown);

  let weft_materials = new Sequence.OneD(materials_draft.rowShuttleMapping).resize(height).shift(weft_mat_shift);


  let d = copyDraft(active_draft);
  d.rowShuttleMapping = weft_materials.val();




  return Promise.resolve([d]);


};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  let r = getAllDraftsAtInlet(op_inputs, 0);
  let name_list = parseDraftNames(r);
  return name_list;
}


export const apply_weft_mats: Operation = { name, old_names, params, inlets, perform, generateName };

