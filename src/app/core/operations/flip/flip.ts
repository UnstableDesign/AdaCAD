import { BoolParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown, warps } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "flip";
const old_names = [];

//PARAMS

const horiz: BoolParam = 
        {name: 'horiz',
        type: 'boolean',
        falsestate: 'no',
        truestate: 'yes',
        value: 0,
        dx: ''
        }

const vert: BoolParam = 
    {name: 'vert',
    type: 'boolean',
    falsestate: "no",
    truestate: "yes",
    value: 0,
    dx: ''
    }



const params = [horiz, vert];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft', 
      type: 'static',
      value: null,
      uses: "draft",
      dx: 'the draft to flip horizontally',
      num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);

   if(input_draft == null) return Promise.resolve([]);


   let weft_systems = new Sequence.OneD(input_draft.rowSystemMapping);
   let weft_materials = new Sequence.OneD(input_draft.rowShuttleMapping);
   let warp_systems = new Sequence.OneD(input_draft.colSystemMapping);
   let warp_mats = new Sequence.OneD(input_draft.colShuttleMapping);
 

  let pattern = new Sequence.TwoD();
  let horiz = getOpParamValById(0, op_params);
  let vert = getOpParamValById(1, op_params);

  if(horiz){
  warp_systems.reverse();
  warp_mats.reverse();

    input_draft.drawdown.forEach(row => {
        let seq = new Sequence.OneD().import(row).reverse().val();
        pattern.pushWeftSequence(seq);
    })
  }else{
    pattern.import(input_draft.drawdown);
  }

  let next_pattern = new Sequence.TwoD();


  if(vert){
   weft_systems.reverse();
   weft_materials.reverse();

    for(let j  =0; j < warps(input_draft.drawdown);j++){
    let col = pattern.getWarp(j);
    let seq = new Sequence.OneD().import(col).reverse();
    next_pattern.pushWarpSequence(seq.val());
    }
  }else{
    next_pattern.import(pattern.export());
  }



  let d = initDraftFromDrawdown(next_pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_systems.val();
  d.rowShuttleMapping = weft_materials.val();
  d.rowSystemMapping = weft_systems.val();



  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'flip('+parseDraftNames(drafts)+")";
}


export const flip: Operation = {name, old_names, params, inlets, perform, generateName};