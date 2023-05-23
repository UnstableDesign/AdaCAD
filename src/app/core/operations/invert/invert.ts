import { first } from "rxjs/operators";
import { createCell, getCellValue } from "../../model/cell";
import { BoolParam, Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown, initDraftWithParams, setHeddle, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getInputDraft, getOpParamValById, parseOpInputNames, transferSystemsAndShuttles } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "invert";
const old_names = [];

//PARAMS


const params = [];

//INLETS

const input:OperationInlet = {
      name: 'draft', 
      type: 'static',
      value: null,
      uses: "draft",
      dx: 'the draft to invert',
      num_drafts: 1
    };

const inlets = [input];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
     const input_draft = getInputDraft(op_inputs);
     
     let pattern = new Sequence.TwoD();
     input_draft.drawdown.forEach(row => {
        const r = new Sequence.OneD().import(row).invert().val();
        pattern.pushWeftSequence(r);
     });

     let d: Draft = initDraftFromDrawdown(pattern.export());
     d = updateWeftSystemsAndShuttles(d, input_draft);
     d = updateWarpSystemsAndShuttles(d, input_draft);
   

    return Promise.resolve([d]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    return 'invert('+parseOpInputNames(op_inputs)+")";


}


export const invert: Operation = {name, old_names, params, inlets, perform, generateName};



