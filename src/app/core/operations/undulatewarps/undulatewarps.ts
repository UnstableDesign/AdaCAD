import { BoolParam, Draft, Operation, OperationInlet, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "undulatewarps";
const old_names = [];

//PARAMS
const shift_pattern:StringParam =  
    {name: 'undulation pattern',
    type: 'string',
    regex: /(\d+)/,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'shifts each end of the input draft according to the number sequence specified.'
};
const force_fit: BoolParam = 
        {name: 'fit to input',
        type: 'boolean',
        falsestate: 'do not force the fit',
        truestate: 'force the draft to match the input size',
        value: 0,
        dx: 'controls if the output draft wefts should match the number of inputs to the undulation pattern or if the undulation pattern should repeat over the draft wefts'
        }



const params = [shift_pattern, force_fit];

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
 
      const forcefit: number = getOpParamValById(1, param_vals);

      const drafts: Array<Draft> = getAllDraftsAtInlet(op_inputs, 0);

      if(drafts.length == 0) return Promise.resolve([]);

      let regex_matches= utilInstance.parseRegex(undulating_string, shift_pattern.regex)


      let undulating_array = regex_matches.map(el => parseInt(el))

      let pattern = new Sequence.TwoD();

      let max_wefts = 0;
      let max_warps = 0;


      if(forcefit){
        max_warps = undulating_array.length;
        max_wefts = undulating_array.reduce((acc, val)=> {
            if(Math.abs(val) > acc) return Math.abs(val);
            return acc;
        }, -1);
      }else{
        max_wefts = wefts(drafts[0].drawdown);
        max_warps = warps(drafts[0].drawdown)
      }

      for(let j = 0; j < max_warps; j++){

        let und_val = undulating_array[j%undulating_array.length];

   
        pattern.pushWarpSequence(
            new Sequence.OneD()
        .import(getCol(drafts[0].drawdown, j%warps(drafts[0].drawdown)))
        .resize(max_wefts)
        .shift(und_val)
        .val());

      }
  
      let d = initDraftFromDrawdown(pattern.export());
      d = updateWarpSystemsAndShuttles(d, drafts[0]);
      d = updateWeftSystemsAndShuttles(d, drafts[0]);

      return Promise.resolve([d]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'undulate warps';
}


export const undulatewarps: Operation = {name, old_names, params, inlets, perform, generateName};



