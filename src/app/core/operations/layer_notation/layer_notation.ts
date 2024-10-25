import { Draft, OperationInlet, OpInput, OpParamVal, StringParam, DynamicOperation } from "../../model/datatypes";
import { generateMappingFromPattern, initDraftFromDrawdown, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getAllDraftsAtInletByLabel, getOpParamValById, reduceToStaticInputs } from "../../model/operations";
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
    regex: /\(.*?\)|[\S]/i, //this is the layer parsing regex
    error: 'invalid entry',
    dx: 'the string describes which warps and wefts will be associated with a given layer. Layers are marked with (), so (a1)(b1) places warp system 1 and weft system a on the top layer, and b1 on the bottom. You an then assign drafts to these layers independently. A letter or number between the layers, such as (a1)c(b2) will be interpreted a float between the layers.'
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
      
      const original_string_split = utilInstance.parseRegex(original_string,pattern.regex);
    
      if(original_string_split == null || original_string_split.length == 0) return Promise.resolve([]);

      const system_map = getAllDraftsAtInlet(op_inputs, 0);
      if(op_inputs.length == 0) return Promise.resolve([]);


      if(system_map.length == 0) return Promise.resolve([]); ;
     

      let weft_system_map = new Sequence.OneD(system_map[0].rowSystemMapping);
      let warp_system_map = new Sequence.OneD(system_map[0].colSystemMapping);
      let weft_shuttle_map = new Sequence.OneD(system_map[0].rowShuttleMapping);
      let warp_shuttle_map = new Sequence.OneD(system_map[0].colShuttleMapping);

      //make sure the system draft map has a representation for every layer, even if the draft at that layer is null.
      const layer_draft_map = original_string_split.map((unit, ndx) => {
  
        let drafts = getAllDraftsAtInletByLabel(op_inputs, unit);

        return {
          wesy: parseWeftSystem(unit), 
          wasy: parseWarpSystem(unit),
          is_layer: unit.includes("("),
          draft: (drafts == null || drafts.length == 0) ? null : drafts[0]
        }
      });

      //setup the environment for the output draft
      let composite = new Sequence.TwoD().setBlank(2);
    
      let ends = utilInstance.lcm(
        layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => warps(ldm.draft.drawdown))) * warps(system_map[0].drawdown);
      
      let pics = utilInstance.lcm(
        layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => wefts(ldm.draft.drawdown))) * wefts(system_map[0].drawdown);
  
      //assign drafts to their specified systems. 
      let weft_sys_above = [];
      let warp_sys_above = [];

      layer_draft_map.forEach((sdm, ndx) => {
        let seq = null;

        if(sdm.is_layer && sdm.draft !== null){
          seq = new Sequence.TwoD().import(sdm.draft.drawdown);
          seq.mapToSystems(sdm.wesy, sdm.wasy, weft_system_map, warp_system_map, ends, pics);
          composite.overlay(seq, false);
        }

        composite.placeInLayerStack(sdm.wasy, warp_sys_above, sdm.wesy, weft_sys_above, weft_system_map, warp_system_map)
        weft_sys_above = weft_sys_above.concat(sdm.wesy);
        warp_sys_above = warp_sys_above.concat(sdm.wasy);

       });



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

    const param_regex = pattern.regex;
    
    let matches = [];

    matches = utilInstance.parseRegex(param_val,param_regex);

    //only create inlets for layer groups (not floating warps, wefts)
    matches.forEach(el => {
      if(el.includes('(')) inlet_vals.push(el);
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