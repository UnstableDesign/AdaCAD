import { getCellValue } from "../../model/cell";
import { Draft, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { generateMappingFromPattern, initDraftFromDrawdown, initDraftWithParams, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "analyzesystem";
const old_names = [];

//PARAMS

const pattern:StringParam =  
    {name: 'systems',
    type: 'string',
    value: 'a1',
    regex: /[\S]/i, //Accepts a letter followed by a number, a single letter or a single number
    error: 'invalid entry',
    dx: 'enter the letter or number associated with the weft/warp system to which this draft will be focused upon. For example, "a 1" will show only the cells associated with the combination of warp system 1 with weft system a. The entry "a b" will create a draft of only the cells assigned to a and b across all warp systems'
  }



const params = [pattern];

//INLETS
const systems: OperationInlet = {
  name: 'systems draft', 
  type: 'static',
  value: null,
  uses: "warp-and-weft-data",
  dx: 'the draft that describes the system ordering to use when analyzing the draft',
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
  const original_string_split = utilInstance.parseRegex(original_string, pattern.regex);

  if(op_inputs.length == 0) return Promise.resolve([]);

  const system_map = getAllDraftsAtInlet(op_inputs, 0);
  if(system_map.length == 0) return Promise.resolve([]); ;

  const draft = getAllDraftsAtInlet(op_inputs, 1);
  if(draft.length == 0) return Promise.resolve([]); ;


  const draft_with_systems = initDraftWithParams(
    {drawdown: draft[0].drawdown, 
    rowSystemMapping: system_map[0].rowSystemMapping, 
    rowShuttleMapping: system_map[0].rowShuttleMapping,
    colSystemMapping: system_map[0].colSystemMapping, 
    colShuttleMapping: system_map[0].colShuttleMapping
  })


  let systems = original_string_split.reduce((acc, val) => {
    return {
      wesy: acc.wesy.concat(parseWeftSystem(val)), 
      wasy: acc.wasy.concat(parseWarpSystem(val)),
    }
  }, {wesy: [], wasy: []});

  if(systems.wesy.length == 0){
    systems.wesy = utilInstance.filterToUniqueValues(system_map[0].colSystemMapping)
  }
  if(systems.wasy.length == 0){
    systems.wasy = utilInstance.filterToUniqueValues(system_map[0].rowSystemMapping)
  }

  let analyzed_draft = new Sequence.TwoD();
  let rowSysMap = [];
  let rowShutMap = [];
  let colSysMap = [];
  let colShutMap = [];
  for(let i = 0; i < wefts(draft_with_systems.drawdown); i++){
    const weftsys = draft_with_systems.rowSystemMapping[i];
    if(systems.wesy.find(el => el == weftsys) !== undefined){
      colSysMap = [];
      colShutMap = [];
      let row = new Sequence.OneD();
      rowSysMap.push(weftsys);
      rowShutMap.push(draft_with_systems.rowShuttleMapping[i]);
      for(let j = 0; j < warps(draft_with_systems.drawdown); j++){
        const warpsys = draft_with_systems.colSystemMapping[j];
        if(systems.wasy.find(el => el == warpsys) !== undefined){
          colSysMap.push(warpsys);
          colShutMap.push(draft_with_systems.colShuttleMapping[j]);
           row.push(getCellValue(draft_with_systems.drawdown[i][j])) 
        }
      }
      analyzed_draft.pushWeftSequence(row.val());
    }
  }



  let d: Draft = initDraftFromDrawdown(analyzed_draft.export());
  d.rowShuttleMapping = rowShutMap;
  d.rowSystemMapping = rowSysMap;
  d.colShuttleMapping = colShutMap;
  d.colSystemMapping = colSysMap;

  return Promise.resolve([d]);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "analyze systems("+name_list+")";
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
  

export const analyzesystem: Operation = {name, old_names, params, inlets, perform, generateName};

