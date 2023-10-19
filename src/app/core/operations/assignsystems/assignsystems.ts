import { createCell } from "../../model/cell";
import { Draft, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { generateMappingFromPattern, initDraftFromDrawdown, initDraftWithParams } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "assign systems";
const old_names = [];

//PARAMS

const pattern:StringParam =  
    {name: 'pattern',
    type: 'string',
    value: 'a1',
    regex: /.*?(.*?[a-xA-Z]*[\d]*.*?).*?/i, //this is the layer parsing regex
    error: 'invalid entry',
    dx: 'enter a letter and number to indicate the weft and warp system pair(s) upon which you would like this draft assigned. For instance, a1 will place the draft across all cells where weft system a meets warp system 1. a1c3 will place it across a1 and c3. You must enter a letter followed by a number for the software to interpret it correctly '
  }



const params = [pattern];

//INLETS
const systems: OperationInlet = {
  name: 'systems draft', 
  type: 'static',
  value: null,
  uses: "warp-and-weft-data",
  dx: 'the draft that describes the system ordering we will add input structures within',
  num_drafts: 1
}

  const draft_inlet: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: "the draft that will be assigned to a given system",
    num_drafts: 1
  }


  const inlets = [systems, draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


  const original_string = getOpParamValById(0, op_params);
  const original_string_split = utilInstance.parseRegex(original_string,  /.*?(.*?[a-xA-Z]*[\d]*.*?).*?/i);

  if(op_inputs.length == 0) return Promise.resolve([]);

  const system_map = getAllDraftsAtInlet(op_inputs, 0);
  if(system_map.length == 0) return Promise.resolve([]); ;

  const draft = getAllDraftsAtInlet(op_inputs, 1);
  if(draft.length == 0) return Promise.resolve([]); ;


  let weft_system_map = new Sequence.OneD(system_map[0].rowSystemMapping);
  let warp_system_map = new Sequence.OneD(system_map[0].colSystemMapping);
  let weft_shuttle_map = new Sequence.OneD(system_map[0].rowShuttleMapping);
  let warp_shuttle_map = new Sequence.OneD(system_map[0].colShuttleMapping);



  let layer_num = 0;

  

  //since there are no layers, this should be just one. 
  const layer_draft_map = original_string_split.map((unit, ndx) => {

    return {
      wesy: parseWeftSystem(unit), 
      wasy: parseWarpSystem(unit),
      layer: layer_num, //map layer order to the inlet id, all inlets must be ordered the same as the input
      draft:  draft[0]
    }
  });


  let composite = new Sequence.TwoD().setBlank(2);


  //assign drafts to their specified systems. 
  layer_draft_map.forEach((sdm, ndx) => {
    let seq;
    if(sdm.wasy.length == 0){
      seq = new Sequence.TwoD().import(draft[0].drawdown)
      seq.mapToWeftSystems(sdm.wesy, weft_system_map, warp_system_map);

    }else{
      seq = new Sequence.TwoD().import(sdm.draft.drawdown);
      seq.mapToSystems(sdm.wesy, sdm.wasy, weft_system_map, warp_system_map);
    }
    composite.overlay(seq, false);
   });


   let d: Draft = initDraftFromDrawdown(composite.export());
   d.colSystemMapping =  generateMappingFromPattern(d.drawdown, warp_system_map.val(),'col', 3);
   d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, weft_system_map.val(),'row', 3);
   d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, warp_shuttle_map.val(),'col', 3);
   d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, weft_shuttle_map.val(),'row', 3);

  
  

  return Promise.resolve([d]);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "assign systems("+name_list+")";
}




//pull out all the nubmers from a notation element into warp systems
const parseWarpSystem = (val: string) : Array<number> => {
  let matches = val.match(/\d+/g);
  if(matches == null || matches.length == 0){
    console.error("in Layer Notation, no warp system")
    return [];
  }
  return  matches.map(el => parseInt(el)-1);

}

//pull out all the letters from a notation element into weft systems
const parseWeftSystem = (val: string) : Array<number> => {
  let matches = val.match(/[a-zA-Z]+/g);
  if(matches == null || matches.length == 0){
    console.error("in Layer Notation, no weft system")
    return [];
  }
  return matches.map(match => match.charCodeAt(0) - 97);

}
  

export const assignsystems: Operation = {name, old_names, params, inlets, perform, generateName};

