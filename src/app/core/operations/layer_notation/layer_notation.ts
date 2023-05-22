import { createCell, getCellValue } from "../../model/cell";
import { Draft, OperationInlet, OpInput, OpParamVal, StringParam, NotationTypeParam, DynamicOperation, OperationParam } from "../../model/datatypes";
import {  initDraftWithParams, warps, wefts } from "../../model/drafts";
import { getOpParamValById, parseOpInputNames, reduceToStaticInputs } from "../../model/operations";
import { getSystemCharFromId } from "../../model/system";
import utilInstance from "../../model/util";


const name = "notation";
const old_names = [];
const dynamic_param_id = 0;
const dynamic_param_type = 'notation';

//PARAMS
const pattern:StringParam =  
    {name: 'pattern',
    type: 'string',
    value: '(a1)(b2)',
    regex: /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i, //this is the layer parsing regex
    error: 'invalid entry',
    dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
    }

const toggle:NotationTypeParam = 
   {name: 'assign layers',
    type: 'notation_toggle',
    falsestate: "drafts to systems",
    truestate: "drafts to layers",
    value: 1,
    dx: 'determines if the inlets should represent the different layers or different systems'
}


const params = [pattern, toggle];

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
      const original_string_split = utilInstance.parseRegex(original_string, /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i);


      if(op_inputs.length == 0) return Promise.resolve([]);

      //now just get all the drafts
      const all_drafts: Array<Draft> = op_inputs.reduce((acc, el) => {
        el.drafts.forEach(draft => {acc.push(draft)});
        return acc;
      }, []);

      const system_map = op_inputs.find(el => el.inlet_id === 0);
      if(system_map === undefined) return Promise.resolve([]); ;
     
      
      const draft_inlets = op_inputs.filter(el => el.inlet_id > 0).map(el => el.drafts[0]);

      let total_wefts: number = 0;
      const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
      total_wefts = utilInstance.lcm(all_wefts);

      let total_warps: number = 0;
      const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
      total_warps = utilInstance.lcm(all_warps);



      //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
      //get the total number of layers
      const system_draft_map = op_inputs
      .filter(el => el.inlet_id > 0)
      .map(el => {

        //find the correct layer by identifying this unit in the stack
        let layer_id = original_string_split.findIndex(sel => sel.includes(el.params[0]));
        if(layer_id == -1){
          console.error(el.params[0]+"not found in layer string")
          layer_id = el.inlet_id-1;
        } 

        return  {
          wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
          wasy: el.params[0].match(/\d+/g), //pull out all the nubmers into warp systems
          i: 0,
          j: 0,
          layer: layer_id, //map layer order to the inlet id, all inlets must be ordered the same as the input
          draft: el.drafts[0]
        }
      });

      
      system_draft_map.forEach(sdm => {
        if(sdm.wasy!== null) sdm.wasy = sdm.wasy.map(el => parseInt(el));
        else sdm.wasy = [-1];
        if(sdm.wesy === null) sdm.wesy = [''];
      })


      const d: Draft =initDraftWithParams({
        warps: total_warps*warps(system_map.drafts[0].drawdown), 
        wefts: total_wefts*wefts(system_map.drafts[0].drawdown),
        rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
        rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
        colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
        colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
      });

      for(let i = 0; i < wefts(d.drawdown); i++){
        let active_wesy = getSystemCharFromId(d.rowSystemMapping[i]);
        const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
        let increment_flag = false;

        for(let j = 0; j < warps(d.drawdown); j++){
          let active_wasy = d.colSystemMapping[j]+1;

          
          const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
          const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

          if(active_weft_entry === undefined || active_warp_entry === undefined){
            //no input draft is assigned to this system, set all as undefined
            d.drawdown[i][j] = createCell(false);

          }else if(entry === undefined){
            //this is unassigned or its an an alternating layer. 
            //find the term in the list assigned to this. 
            //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
            const wesy_layer = active_weft_entry.layer;
            const wasy_layer = active_warp_entry.layer;
            if(wasy_layer < wesy_layer) d.drawdown[i][j] = createCell(true);
            else if(wasy_layer > wesy_layer) d.drawdown[i][j] = createCell(false);
            else d.drawdown[i][j] = createCell(false);
          }  
          else{
            d.drawdown[i][j] =createCell(getCellValue(entry.draft.drawdown[entry.i][entry.j]));
            entry.j = (entry.j+1)%warps(entry.draft.drawdown);
            increment_flag = true;
          }

        }

        if(increment_flag){
          active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.draft.drawdown);
        } 


      }
      
      return  Promise.resolve([d]);

  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  return 'notation('+parseOpInputNames(op_inputs)+")";
}


const onParamChange = (param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) : Array<any> => {

    inlet_vals = reduceToStaticInputs(inlets, inlet_vals);

    const param_regex = (<StringParam> param_vals[0].param).regex;
    
    let string_to_parse = (changed_param_id == 0) ? param_val : getOpParamValById(0, param_vals);

    let toggle = getOpParamValById(1, param_vals);
    let matches = [];

    if(toggle == 0){

      const system_parsing_regex = /.*?(.*?[a-xA-Z]+[\d]+).*?/i;

      matches = utilInstance.parseRegex(string_to_parse, param_regex);

      matches = matches.map(el => el.slice(1, -1))

      matches = matches.reduce((acc, val) => {
        const sub_match = utilInstance.parseRegex(val, system_parsing_regex);
        return acc.concat(sub_match);
      }, []);

    
    }else{
      matches = utilInstance.parseRegex(string_to_parse,param_regex);
      matches = matches.map(el => el.slice(1, -1))
    }

    matches.forEach(el => {
      inlet_vals.push(el);
    })

    return inlet_vals;

}
  

export const notation: DynamicOperation = {name, old_names, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName,onParamChange};