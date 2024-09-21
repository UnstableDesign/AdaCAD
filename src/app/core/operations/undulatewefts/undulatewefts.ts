import { BoolParam, Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "undulatewefts";
const old_names = [];

//PARAMS
const shift_pattern:StringParam =  
    {name: 'undulation pattern',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'shifts each pic of the input draft according to the number sequence specified.'
};




const params = [shift_pattern];

//INLETS

const draft_input:OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to undulate',
    num_drafts: 1
}

  const inlets = [draft_input];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


      const undulating_string: string = getOpParamValById(0, param_vals);
 
      const drafts: Array<Draft> = getAllDraftsAtInlet(op_inputs, 0);

      if(drafts.length == 0) return Promise.resolve([]);

      let regex_matches= utilInstance.parseRegex(undulating_string, shift_pattern.regex)


      let undulating_array = regex_matches
      .filter(el => el !== ' ')
      .map(el => parseInt(el))


      let pattern = new Sequence.TwoD();

      let max_wefts = 0;
      let max_warps = 0;


      max_wefts = wefts(drafts[0].drawdown);
      max_warps = warps(drafts[0].drawdown)
    

      for(let i = 0; i < max_wefts; i++){

        let und_val = undulating_array[i%undulating_array.length];

   
        pattern.pushWeftSequence(
            new Sequence.OneD()
        .import(drafts[0].drawdown[i%wefts(drafts[0].drawdown)])
        .resize(max_warps)
        .shift(und_val)
        .val());

      }
  
      let d = initDraftFromDrawdown(pattern.export());
      d = updateWarpSystemsAndShuttles(d, drafts[0]);
      d = updateWeftSystemsAndShuttles(d, drafts[0]);

      return Promise.resolve([d]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'undulate wefts';
}


export const undulatewefts: Operation = {name, old_names, params, inlets, perform, generateName};



