import { wefts, copyDraft } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "..";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";
import { colorEffectsOp } from "../categories";

const name = "apply_weft_materials";


const meta: OpMeta = {
  displayname: "set weft materials",
  img: 'apply_weft_materials.png',
  desc: "Copies the materials used in the materials draft to the picks of the input draft.",
  categories: [colorEffectsOp],
  old_names: ['apply weft materials']

}


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


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {

  const base_drafts = getAllDraftsAtInlet(op_inputs, 0);
  const materials_drafts = getAllDraftsAtInlet(op_inputs, 1);

  const weft_mat_shift: number = <number>getOpParamValById(0, op_params);

  if (base_drafts.length == 0 && materials_drafts.length == 0) return Promise.resolve([]);



  if (base_drafts.length == 0) return Promise.resolve([{ draft: materials_drafts[0] }]);
  if (materials_drafts.length == 0) return Promise.resolve([{ draft: base_drafts[0] }]);

  const active_draft = base_drafts[0];
  const materials_draft = materials_drafts[0];


  const height = wefts(active_draft.drawdown);

  const weft_materials = new Sequence.OneD(materials_draft.rowShuttleMapping).resize(height).shift(weft_mat_shift);


  const d = copyDraft(active_draft);
  d.rowShuttleMapping = weft_materials.val();




  return Promise.resolve([{ draft: d }]);


};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const r = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(r);
  return name_list;
}


export const apply_weft_materials: Operation = { name, meta, params, inlets, perform, generateName };

