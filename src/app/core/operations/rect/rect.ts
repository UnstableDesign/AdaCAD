import { createCell } from "../../model/cell";
import { Draft, NumParam, Operation, OperationInlet, OpInput, Cell, OpParamVal } from "../../model/datatypes";
import { initDraft, initDraftWithParams } from "../../model/drafts";
import { getInputDraft, getOpParamValById, parseOpInputNames } from "../../model/operations";


const name = "rectangle";
const old_names = [];

//PARAMS
const ends:NumParam =  
    {name: 'ends',
    type: 'number',
    min: 1,
    max: 500,
    value: 10,
    dx: ""
    };

const pics: NumParam = 
    {name: 'pics',
    type: 'number',
    min: 1,
    max: 500,
    value: 10,
    dx: ""
    }

const params = [ends, pics];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'input draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft with which you would like to fill this rectangle',
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  let input_draft = getInputDraft(op_inputs);

  if(input_draft == null){
    input_draft = initDraftWithParams({drawdown: [[createCell(true)]]});
  }

  const d: Draft = initDraftWithParams(
      {warps: getOpParamValById(0, op_params), 
        wefts: getOpParamValById(1, op_params), 
        drawdown: input_draft.drawdown,
        rowShuttleMapping: input_draft.rowShuttleMapping,
        colShuttleMapping: input_draft.colShuttleMapping,
        rowSystemMapping: input_draft.rowSystemMapping,
        colSystemMapping: input_draft.colSystemMapping
    });

    return Promise.resolve([d]);
  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  return 'rect('+parseOpInputNames(op_inputs)+")";
}


export const rect: Operation = {name, old_names, params, inlets, perform, generateName};