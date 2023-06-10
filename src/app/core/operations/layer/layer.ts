import { BoolParam, Draft, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { generateMappingFromPattern, getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames, transferSystemsAndShuttles } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "layer";
const old_names = [];

//PARAMS

const params = [];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'drafts', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the drafts to layer (from top to bottom)',
    num_drafts: -1
  }


  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


  let drafts = getAllDraftsAtInlet(op_inputs, 0);

  if(drafts.length == 0) return Promise.resolve([]);


    //create a default system mapping that assumes alternating weft and warp systems associated with each layer
   let sys_seq = new Sequence.OneD();
   for(let i = 0; i < drafts.length; i++){
    sys_seq.push(i);
   }

   let composite = new Sequence.TwoD().setBlank(2
    );
   drafts.forEach((draft, ndx) => {
    let seq = new Sequence.TwoD().import(draft.drawdown);
    seq.mapToSystems([ndx], [ndx], sys_seq, sys_seq);
    composite.overlay(seq);
   })

   let system_layer_map = sys_seq.val().map(el => {return {ws: el, layer: el}});
   composite.layerSystems(system_layer_map, sys_seq);


    let d: Draft = initDraftFromDrawdown(composite.export());
    d.colSystemMapping =  generateMappingFromPattern(d.drawdown, sys_seq.val(),'col', 3);
    d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, sys_seq.val(),'row', 3);



  return Promise.resolve([d]);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "layer("+name_list+")";
}


export const layer: Operation = {name, old_names, params, inlets, perform, generateName};