import { Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { copyDraft, getHeddle, initDraftFromDrawdown, initDraftWithParams, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";

const name = "apply materials";
const old_names = [];

//PARAMS
const shift_warp_mat:NumParam =  
{name: 'warp colors shift',
min: 0,
max: 10000,
value: 0,
type: 'number',
dx: 'number of ends by which to shift the warp color pattern'
}

const shift_weft_mats:NumParam = {
    name: 'weft colors shift',
      min: 0,
      max: 10000,
      value: 0,
      type: 'number',
      dx: 'number of pics by which to shift the weft color pattern'
}

const shift_warp_systems:NumParam =  
{name: 'warp system shift',
min: 0,
max: 10000,
value: 0,
type: 'number',
dx: 'number of ends by which to shift the warp system order'
}

const shift_weft_systems:NumParam =  
{name: 'weft system shift',
min: 0,
max: 10000,
value: 0,
type: 'number',
dx: 'number of pics by which to shift the weft system order'
}




const params = [shift_warp_mat, shift_weft_mats, shift_warp_systems, shift_weft_systems];



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
    name: 'systems & materials', 
    type: 'static',
    value: null,
    uses: 'warp-and-weft-data',
    dx: 'a draft which has the materials and systems you would like to repeat across the pics and ends of the resulting draft',
    num_drafts: 1
  }


  const inlets = [draft, materials];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {

     const base_drafts = getAllDraftsAtInlet(op_inputs, 0);
     const materials_drafts = getAllDraftsAtInlet(op_inputs, 1);

    const weft_mat_shift = getOpParamValById(1, op_params);
    const warp_mat_shift = getOpParamValById(0, op_params);
    const warp_sys_shift = getOpParamValById(2, op_params);
    const weft_sys_shift = getOpParamValById(3, op_params);


     if(base_drafts.length == 0 && materials_drafts.length == 0) return Promise.resolve([]);



    if(base_drafts.length == 0) return Promise.resolve([materials_drafts[0]]);
     if(materials_drafts.length == 0) return Promise.resolve([base_drafts[0]]);


    let active_draft = base_drafts[0];
    let materials_draft = materials_drafts[0];
    

    let width = warps(active_draft.drawdown);
    let height = wefts(active_draft.drawdown);

    let warp_systems = new Sequence.OneD(materials_draft.colSystemMapping).resize(width).shift(warp_sys_shift);

    let warp_mats = new Sequence.OneD(materials_draft.colShuttleMapping).resize(width).shift(warp_mat_shift);

    let weft_systems = new Sequence.OneD(materials_draft.rowSystemMapping).resize(height).shift(weft_sys_shift);

    let weft_materials = new Sequence.OneD(materials_draft.rowShuttleMapping).resize(height).shift(weft_mat_shift);

    
   let d = copyDraft(active_draft);
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();



    return Promise.resolve([d]);


};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let r = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(r);
  return name_list;
}


export const apply_mats: Operation = {name, old_names, params, inlets, perform, generateName};

