import { getCellValue } from "../../model/cell";
import { Draft, Drawdown, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
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


  const draft_inlet: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: "the draft that will be assigned to a given system",
    num_drafts: 1
  }


  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


  const original_string = getOpParamValById(0, op_params);
  const original_string_split = utilInstance.parseRegex(original_string, pattern.regex);

  if(op_inputs.length == 0) return Promise.resolve([]);


  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  if(drafts.length == 0) return Promise.resolve([]); ;

  const draft = drafts[0];

  let input_systems = original_string_split.reduce((acc, val) => {
    return {
      wesy: acc.wesy.concat(parseWeftSystem(val)), 
      wasy: acc.wasy.concat(parseWarpSystem(val)),
    }
  }, {wesy: [], wasy: []});

  let draft_systems = {
    wasy: utilInstance.filterToUniqueValues(draft.colSystemMapping),
    wesy: utilInstance.filterToUniqueValues(draft.rowSystemMapping)
  }


  let validated_systems = utilInstance.makeValidSystemList(input_systems, draft_systems);

  if(!validated_systems.valid){
    return Promise.resolve([initDraftWithParams({warps: 1, wefts: 1})]);
  }

  let analyzed_draft = new Sequence.TwoD();
  let rowSysMap = [];
  let rowShutMap = [];
  let colSysMap = [];
  let colShutMap = [];

  for(let i = 0; i < wefts(draft.drawdown); i++){
    const weftsys = draft.rowSystemMapping[i];

    if(validated_systems.wesy.find(el => el == weftsys) !== undefined){
     
      colSysMap = [];
      colShutMap = [];
      let row = new Sequence.OneD();
     
      for(let j = 0; j < warps(draft.drawdown); j++){
        const warpsys = draft.colSystemMapping[j];
        if(validated_systems.wasy.find(el => el == warpsys) !== undefined){
          colSysMap.push(warpsys);
          colShutMap.push(draft.colShuttleMapping[j]);
           row.push(getCellValue(draft.drawdown[i][j])) 
        }
      }

      if(row.length() > 0){
      rowSysMap.push(weftsys);
      rowShutMap.push(draft.rowShuttleMapping[i]);
      }
    


      analyzed_draft.pushWeftSequence(row.val());
    }
  }

  //if you put in a combo to the param that does not exist 


    let d = initDraftFromDrawdown(analyzed_draft.export());
    d.rowShuttleMapping = rowShutMap;
    d.rowSystemMapping = rowSysMap;
    d.colShuttleMapping = colShutMap;
    d.colSystemMapping = colSysMap;

 
  return Promise.resolve([d]);



};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    let param_val = getOpParamValById(0, param_vals);
    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "analyze system("+param_val+", "+name_list+")";
}




//pull out all the numbers from a notation element into warp systems
const parseWarpSystem = (val: string) : Array<number> => {
  let matches = val.match(/\d+/g);
  if(matches == null || matches.length == 0){
    console.error("in Analyze Systems, no warp system")
    return [];
  }
  return  matches.map(el => parseInt(el)-1);

}

//pull out all the letters from a notation element into weft systems
const parseWeftSystem = (val: string) : Array<number> => {
  let matches = val.match(/[a-zA-Z]+/g);
  if(matches == null || matches.length == 0){
    console.error("in Analyze System, no weft system")
    return [];
  }
  return matches.map(match => match.charCodeAt(0) - 97);

}
  

export const analyzesystem: Operation = {name, old_names, params, inlets, perform, generateName};

function initDraftFromParams(arg0: { wefts: number; warps: number; }): Draft {
  throw new Error("Function not implemented.");
}

