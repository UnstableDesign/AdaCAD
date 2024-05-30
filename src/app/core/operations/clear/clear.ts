import { createCell } from "../../model/cell";
import { Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftWithParams, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, parseDraftNames } from "../../model/operations";


const name = "clear";
const old_names = [];

//PARAMS



const params = [];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'input draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to clear',
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  console.log("INPUT DRAFT IS ", input_draft)
  if(input_draft == null) return Promise.resolve([]);

  let d = initDraftWithParams({
    wefts: wefts(input_draft.drawdown),
    warps: warps(input_draft.drawdown),
    drawdown: [[createCell(false)]]
  });
  
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'clear('+parseDraftNames(drafts)+")";
}


export const clear: Operation = {name, old_names, params, inlets, perform, generateName};