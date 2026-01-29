import { BoolParam, Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getDraftName, initDraftFromDrawdown, updateWarpSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "deinterlace";
const old_names = [];

//PARAMS

const split_by:NumParam =  
    {name: 'factor',
    type: 'number',
    min: 2,
    max: 500,
    value: 2,
    dx: "this number determines how many times the input draft will be divided"
    };



const params = [split_by];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'drafts', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to split apart',
    num_drafts: 1
  }


  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


  let input_draft = getInputDraft(op_inputs);
  let factor = getOpParamValById(0, op_params);

  if(input_draft == null) return Promise.resolve([]);

  let patterns: Array<Sequence.TwoD> =[];
  let drafts: Array<Draft> =[];
  let row_shuttle: Array<Array<number>> =[];
  let row_system: Array<Array<number>> =[];

  for(let i = 0; i < factor; i++){
    patterns.push(new Sequence.TwoD());
    row_shuttle.push([]);
    row_system.push([]);
  }


  for(let i = 0; i < wefts(input_draft.drawdown); i++){

    let selected_draft_id = i % factor;
    let row = new Sequence.OneD([]).import(input_draft.drawdown[i]);
    patterns[selected_draft_id].pushWeftSequence(row.val());
    row_shuttle[selected_draft_id].push(input_draft.rowShuttleMapping[i])
    row_system[selected_draft_id].push(input_draft.rowSystemMapping[i])
  }

  for(let i = 0; i < factor; i++){

    let d = initDraftFromDrawdown(patterns[i].export());
    d.rowShuttleMapping = row_shuttle[i].slice();
    d.rowSystemMapping = row_system[i].slice();
    d = updateWarpSystemsAndShuttles(d, input_draft);
    drafts.push(d);
  }



  return Promise.resolve(drafts);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    let input_draft = getInputDraft(op_inputs);
    return "deinterlaced("+getDraftName(input_draft)+")";
}


export const deinterlace: Operation = {name, old_names, params, inlets, perform, generateName};