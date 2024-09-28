import { createCell, getCellValue } from "../../model/cell";
import { Draft, OperationInlet, OpInput, OpParamVal, StringParam, NotationTypeParam, DynamicOperation, OperationParam, BoolParam } from "../../model/datatypes";
import {  generateMappingFromPattern, initDraftFromDrawdown, initDraftWithParams, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames, reduceToStaticInputs } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "notation";
const old_names = ["assignlayers"];
const dynamic_param_id = [0];
const dynamic_param_type = 'notation';

//PARAMS
const pattern:StringParam =  
    {name: 'pattern',
    type: 'string',
    value: '(a1)(b2)',
    regex: /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i, //this is the layer parsing regex
    error: 'invalid entry',
    dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in parenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). If you enter a letter, without an number such as (a1)(b)(c2), weft system be will be constructed as a float between layers 1 and 3'
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

  const inlets = [systems];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const original_string = getOpParamValById(0, op_params);
      const original_string_split = utilInstance.parseRegex(original_string,  /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i);
    
      if(original_string_split == null || original_string_split.length == 0) return Promise.resolve([]);

      const system_map = getAllDraftsAtInlet(op_inputs, 0);
      if(op_inputs.length == 0) return Promise.resolve([]);


      if(system_map.length == 0) return Promise.resolve([]); ;
     

      let weft_system_map = new Sequence.OneD(system_map[0].rowSystemMapping);
      let warp_system_map = new Sequence.OneD(system_map[0].colSystemMapping);
      let weft_shuttle_map = new Sequence.OneD(system_map[0].rowShuttleMapping);
      let warp_shuttle_map = new Sequence.OneD(system_map[0].colShuttleMapping);

      //make sure the system draft map has a representation for every layer, even if the draft at that layer is null.

      let layer_num = 0;

      const layer_draft_map = original_string_split.map((unit, ndx) => {
  
        let drafts = getAllDraftsAtInlet(op_inputs, ndx+1);
        if(parseWarpSystem(unit).length != 0) layer_num++;

        return {
          wesy: parseWeftSystem(unit), 
          wasy: parseWarpSystem(unit),
          layer: layer_num, //map layer order to the inlet id, all inlets must be ordered the same as the input
          draft: (drafts.length == 0) ? initDraftWithParams({wefts: 1, warps: 1, drawdown:[[createCell(false)]]}) : drafts[0]
        }
      });


      let composite = new Sequence.TwoD().setBlank(2);

      //assign drafts to their specified systems. 
      layer_draft_map.forEach((sdm, ndx) => {
        let seq;

        if(sdm.wasy.length == 0){
          let oneD = new Sequence.OneD().pushMultiple(1, sdm.layer).pushMultiple(0, warp_system_map.length() - sdm.layer);
          seq = new Sequence.TwoD().pushWeftSequence(oneD.val());
          seq.mapToWeftSystems(sdm.wesy, weft_system_map, warp_system_map);

        }else{

          seq = new Sequence.TwoD().import(sdm.draft.drawdown);
          seq.mapToSystems(sdm.wesy, sdm.wasy, weft_system_map, warp_system_map);
        }
        composite.overlay(seq, false);
       });


       //assign reamining cells based on layer order
        let system_layer_map = [];
        layer_draft_map.forEach(el => {
          el.wasy.forEach(wasy => {
            system_layer_map.push({ws: wasy, layer:el.layer})
          })
        });
        composite.layerSystems(system_layer_map, warp_system_map);
        
 


       let d: Draft = initDraftFromDrawdown(composite.export());
       d.colSystemMapping =  generateMappingFromPattern(d.drawdown, warp_system_map.val(),'col');
       d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, weft_system_map.val(),'row');
       d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, warp_shuttle_map.val(),'col');
       d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, weft_shuttle_map.val(),'row');

      
      
      return  Promise.resolve([d]);

  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  return ''+param_vals[0]+"";
}


const onParamChange = (param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) : Array<any> => {

    inlet_vals = reduceToStaticInputs(inlets, inlet_vals);

    const param_regex = (<StringParam> param_vals[0].param).regex;
    
    let matches = [];

    matches = utilInstance.parseRegex(param_val,param_regex);
    matches = matches.map(el => el.slice(1, -1))

    matches.forEach(el => {
      inlet_vals.push(el);
    })

    return inlet_vals;

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
  

export const notation: DynamicOperation = {name, old_names, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName,onParamChange};