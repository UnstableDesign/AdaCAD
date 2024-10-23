import { Draft, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { generateMappingFromPattern, initDraftFromDrawdown, initDraftWithParams, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "assign systems";
const old_names = [];

//PARAMS

const pattern:StringParam =  
    {name: 'assign to system',
    type: 'string',
    value: 'a1',
    regex: /([a-zA-Z][\d]+)|[a-zA-Z]|[\d]+/i, //Accepts a letter followed by a number, a single letter or a single number
    error: 'invalid entry',
    dx: 'enter a letter, number, or a combination of a letter followed by a number. If a letter is entered, the structure will be mapped onto the entire weft system associated with that letter. In a number is entered, the structure will be placed on the entire warp system. If a letter is followed by a number, it will place only on the cells that are associated with that warp and weft system'
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


  //since there are no layers, this should be just one. 
  let layer_draft_map = original_string_split.map((unit, ndx) => {
    return {
      wesy: parseWeftSystem(unit), 
      wasy: parseWarpSystem(unit),
      layer: 1, 
      draft:  draft[0]
    }
  });
  //filter out any error values created by white space
  layer_draft_map = layer_draft_map.filter(el => !(el.wesy.length == 0 && el.wasy.length == 0));

  let composite = new Sequence.TwoD().setBlank(2);
  let ends = utilInstance.lcm(layer_draft_map.map(ldm => warps(ldm.draft.drawdown))) * warps(system_map[0].drawdown);
  let pics = utilInstance.lcm(layer_draft_map.map(ldm => wefts(ldm.draft.drawdown))) * wefts(system_map[0].drawdown);


  //assign drafts to their specified systems. 
  layer_draft_map.forEach((sdm, ndx) => {
    let seq;
    if(sdm.wasy.length == 0){
      seq = new Sequence.TwoD().import(draft[0].drawdown)
      seq.mapToWeftSystems(sdm.wesy, weft_system_map, warp_system_map, ends, pics);

    }else if(sdm.wesy.length == 0){
      seq = new Sequence.TwoD().import(draft[0].drawdown)
      seq.mapToWarpSystems(sdm.wasy, weft_system_map, warp_system_map, ends, pics);
    }else{
      seq = new Sequence.TwoD().import(sdm.draft.drawdown);
      seq.mapToSystems(sdm.wesy, sdm.wasy, weft_system_map, warp_system_map, ends, pics);
    }
    composite.overlay(seq, false);
   });


   let d: Draft = initDraftFromDrawdown(composite.export());
   d.colSystemMapping =  generateMappingFromPattern(d.drawdown, warp_system_map.val(),'col');
   d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, weft_system_map.val(),'row');
   d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, warp_shuttle_map.val(),'col');
   d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, weft_shuttle_map.val(),'row');

  
  

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

