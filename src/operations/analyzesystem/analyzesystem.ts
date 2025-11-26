import { SystemList, initDraftWithParams, wefts, warps, initDraftFromDrawdown } from "../../draft";
import { cellToSequenceVal } from "../../draft/cell";
import { Sequence } from "../../sequence/sequence";
import { parseRegex, filterToUniqueValues, makeValidSystemList } from "../../utils";
import { dissectOp } from "../categories";
import { getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../operations";
import { StringParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";

const name = "analyzesystem";

const meta: OpMeta = {
  displayname: "analyze system",
  img: "analyzesystem.png",
  desc: "Creates a draft from a subset of an input draft. Specifically, allows you to select a specific system or group of systems to isolate into a new draft.",
  categories: [dissectOp],
  advanced: true
}

//PARAMS
const pattern: StringParam =
{
  name: 'systems',
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


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {


  const original_string = <string>getOpParamValById(0, op_params);
  const original_string_split = parseRegex(original_string, pattern.regex);

  if (op_inputs.length == 0) return Promise.resolve([]);


  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  if (drafts.length == 0) return Promise.resolve([]);;



  const draft = drafts[0];
  const input_systems = original_string_split.reduce((acc: SystemList, val) => {
    return {
      valid: false,
      wesy: acc.wesy.concat(parseWeftSystem(val)),
      wasy: acc.wasy.concat(parseWarpSystem(val)),
    }
  }, { valid: false, wesy: [], wasy: [] });

  const draft_systems = {
    valid: false,
    wasy: <number[]>filterToUniqueValues(draft.colSystemMapping),
    wesy: <number[]>filterToUniqueValues(draft.rowSystemMapping)
  }


  const validated_systems = makeValidSystemList(input_systems, draft_systems);

  if (!validated_systems.valid) {
    const draft = initDraftWithParams({ warps: 1, wefts: 1 });
    return Promise.resolve([{ draft }]);
  }

  const analyzed_draft = new Sequence.TwoD();
  const rowSysMap = [];
  const rowShutMap = [];
  let colSysMap = [];
  let colShutMap = [];

  for (let i = 0; i < wefts(draft.drawdown); i++) {
    const weftsys = draft.rowSystemMapping[i];

    if (validated_systems.wesy.find(el => el == weftsys) !== undefined) {

      colSysMap = [];
      colShutMap = [];
      const row = new Sequence.OneD();

      for (let j = 0; j < warps(draft.drawdown); j++) {
        const warpsys = draft.colSystemMapping[j];
        if (validated_systems.wasy.find(el => el == warpsys) !== undefined) {
          colSysMap.push(warpsys);
          colShutMap.push(draft.colShuttleMapping[j]);
          row.push(cellToSequenceVal(draft.drawdown[i][j]))
        }
      }

      if (row.length() > 0) {
        rowSysMap.push(weftsys);
        rowShutMap.push(draft.rowShuttleMapping[i]);
      }



      analyzed_draft.pushWeftSequence(row.val());
    }
  }

  //if you put in a combo to the param that does not exist 


  const d = initDraftFromDrawdown(analyzed_draft.export());
  d.rowShuttleMapping = rowShutMap;
  d.rowSystemMapping = rowSysMap;
  d.colShuttleMapping = colShutMap;
  d.colSystemMapping = colSysMap;


  return Promise.resolve([{ draft: d }]);



};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const param_val = getOpParamValById(0, param_vals);
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  const name_list = parseDraftNames(drafts);
  return "analyze system(" + param_val + ", " + name_list + ")";
}




//pull out all the numbers from a notation element into warp systems
const parseWarpSystem = (val: string): Array<number> => {
  const matches = val.match(/\d+/g);
  if (matches == null || matches.length == 0) {
    console.error("in Analyze Systems, no warp system")
    return [];
  }
  return matches.map(el => parseInt(el) - 1);

}

//pull out all the letters from a notation element into weft systems
const parseWeftSystem = (val: string): Array<number> => {
  const matches = val.match(/[a-zA-Z]+/g);
  if (matches == null || matches.length == 0) {
    console.error("in Analyze System, no weft system")
    return [];
  }
  return matches.map(match => match.charCodeAt(0) - 97);

}



const sizeCheck = (): boolean => {
  return true;
}

export const analyzesystem: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };


