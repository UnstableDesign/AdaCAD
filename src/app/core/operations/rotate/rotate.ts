import { BoolParam, Draft, Operation, OperationInlet, OpInput, OpParamVal, SelectParam } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, initDraftWithParams, setHeddle, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "rotate";
const old_names = [];

//PARAMS

const amt:SelectParam ={
        name: 'amount',
        type: 'select',
        selectlist: [
        {name: '90', value: 0},
        {name: '180', value: 1},
        {name: '270', value: 2},
        ],
        value: 0,
        dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
}

const rotate_materials: BoolParam = {
        name: 'materials?',
        type: 'boolean',
        falsestate: 'no, don\'t rotate materials',
        truestate: 'yes, rotate materials',
        value: 1, 
        dx: 'if your draft has materials assigned, you can choose wether you want to rotate the draft or the materials only'

      }


const params = [amt, rotate_materials];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to rotate',
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let draft = getInputDraft(op_inputs);
  const num_rots = getOpParamValById(0, op_params);
  const rotate_mats = (getOpParamValById(1, op_params) === 0) ? false : true;

   if(draft == null) return Promise.resolve([]);


   let seq = new Sequence.TwoD();

   switch(num_rots){

    case 0:

    draft.drawdown.forEach((row, i) => {
        let r = new Sequence.OneD().import(row).reverse();
        seq.pushWarpSequence(r.val());

    });
    break;

    case 1:
    draft.drawdown.forEach((row, i) => {
        let r = new Sequence.OneD().import(row).reverse();
        seq.unshiftWeftSequence(r.val());
    })

    break;
    case 2:

    draft.drawdown.forEach((row, i) => {
        let r = new Sequence.OneD().import(row);
        seq.unshiftWarpSequence(r.val());
    })


    break;

   }

   let weft_materials = new Sequence.OneD().import(draft.rowShuttleMapping);
   let weft_systems = new Sequence.OneD().import(draft.rowSystemMapping);
   let warp_materials = new Sequence.OneD().import(draft.colShuttleMapping);
   let warp_systems = new Sequence.OneD().import(draft.colSystemMapping);

   const d = initDraftFromDrawdown(seq.export());

   if(rotate_mats){
    switch(num_rots){

        case 0:

        d.rowShuttleMapping =  warp_materials.reverse().val();
        d.rowSystemMapping =  warp_systems.reverse().val();
        d.colShuttleMapping = weft_materials.val();
        d.colSystemMapping = weft_systems.val();


        break;

        case 1:
        d.rowShuttleMapping =  weft_materials.reverse().val();
        d.rowSystemMapping =  weft_systems.reverse().val();
        d.colShuttleMapping = warp_materials.reverse().val();
        d.colSystemMapping = warp_systems.reverse().val();


        break;
        case 2:

        d.rowShuttleMapping =  warp_materials.val();
        d.rowSystemMapping =  warp_systems.val();
        d.colShuttleMapping = weft_materials.reverse().val();
        d.colSystemMapping = weft_systems.reverse().val();



        break;

     }
    }else{

        d.rowShuttleMapping =  weft_materials.resize(wefts(d.drawdown)).val();
        d.rowSystemMapping =  weft_systems.resize(wefts(d.drawdown)).val();
        d.colShuttleMapping = warp_materials.resize(warps(d.drawdown)).val();
        d.colSystemMapping = warp_systems.resize(warps(d.drawdown)).val();
       
    }




   return Promise.resolve([d]);
 

}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'rotate('+parseDraftNames(drafts)+")";
}


export const rotate: Operation = {name, old_names, params, inlets, perform, generateName};