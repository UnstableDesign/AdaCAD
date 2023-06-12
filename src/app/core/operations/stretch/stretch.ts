import { getCellValue } from "../../model/cell";
import { Drawdown, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "stretch";
const old_names = [];

//PARAMS
const warp_repeats:NumParam =  
{name: 'warp-repeats',
type: 'number',
min: 1,
max: 100,
value: 2,
dx: 'number of times to repeat each warp end'
};

const weft_repeats: NumParam = {name: 'weft-repeats',
type: 'number',
min: 1,
max: 100,
value: 2,
dx: 'number of times to repeat each weft pic'
}


const params = [warp_repeats, weft_repeats];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to stretch',
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  let input_draft = getInputDraft(op_inputs);
   if(input_draft == null) return Promise.resolve([]);


  let warp_rep = getOpParamValById(0, op_params);
  let weft_rep = getOpParamValById(1, op_params);

  let pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    let seq = new Sequence.OneD();
    row.forEach(cell => {
        seq.pushMultiple(getCellValue(cell), warp_rep);
    });

    for(let r = 0; r < weft_rep; r++){
        pattern.pushWeftSequence(seq.val());
    }

  })


  let d = initDraftFromDrawdown(pattern.export());
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'stretch('+parseDraftNames(drafts)+")";
}


export const stretch: Operation = {name, old_names, params, inlets, perform, generateName};