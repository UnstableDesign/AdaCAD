import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { copyDraft, getDraftName, initDraftFromDrawdown, initDraftWithParams } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById } from "../../model/operations";


const name = "selector";
const old_names = [];


//PARAMS
const selection:NumParam =  
    {name: 'selected input',
    type: 'number',
    min: 1,
    max: 10000,
    value: 1,
    dx: "which of the active inputs is selected at this time"
};



const params = [selection];




const draft_inlet: OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'a collection of drafts you can switch between',
    num_drafts: -1
  }

const inlets = [draft_inlet];

const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const selection: number = getOpParamValById(0, param_vals);
      const inputs = getAllDraftsAtInlet(op_inputs, 0);


      if((selection-1) < inputs.length){
        let copy = copyDraft(inputs[selection-1]);
        return Promise.resolve([copy])
      }else{
        let draft = initDraftWithParams({wefts: 1, warps:1})
        return Promise.resolve([draft]);
      }
  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  const selection: number = getOpParamValById(0, param_vals);

    if((selection-1) < op_inputs.length){
      let name = getDraftName(op_inputs[selection-1].drafts[0])
      return 'selected:'+name;
    }else{
      return 'selected: none';
    }
}


export const selector: Operation = {name, old_names, params, inlets, perform, generateName};



