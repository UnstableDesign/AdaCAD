import { createCell } from "../../model/cell";
import { Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVals, Cell } from "../../model/datatypes";
import { initDraftWithParams } from "../../model/drafts";
import { parseOpInputNames } from "../../model/operations";


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


const  perform = (op_params: OpParamVals, op_inputs: Array<OpInput>) => {


    const draft = (op_inputs.length !== 0 && op_inputs[0].drafts.length > 0) ? op_inputs[0].drafts[0] : initDraftWithParams({drawdown: [[createCell(true)]]});

    const outputs: Array<Draft> = [];
    const d: Draft = initDraftWithParams(
      {warps: op_params.params[0], 
        wefts: op_params.params[1], 
        drawdown: draft.drawdown,
        rowShuttleMapping: draft.rowShuttleMapping,
        colShuttleMapping: draft.colShuttleMapping,
        rowSystemMapping: draft.rowSystemMapping,
        colSystemMapping: draft.colSystemMapping
        });

    outputs.push(d);

    return Promise.resolve(outputs);
  }   

const generateName = (param_vals: OpParamVals, op_inputs: Array<OpInput>) : string => {

  return 'rect('+parseOpInputNames(op_inputs)+")";
}


export const rect: Operation = {name, old_names, params, inlets, perform, generateName};