import { BoolParam, NumParam, Operation, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";


const name = "undulatingtwill";
const old_names = [];

//PARAMS
const string_input:StringParam =  
    {name: 'first pic pattern',
    type: 'string',
    regex: /(\d+)/,
    value: '1 3 1 3',
    error: '',
    dx: 'the under over pattern of this twill'
};

const shift_pattern:StringParam =  
    {name: 'shift pattern',
    type: 'string',
    regex: /(\d+)/,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'shifts the starting row by the amount specified on each subsequent pic to create undulating patterns'
};
const sz: BoolParam = 
        {name: 'S/Z',
        type: 'boolean',
        falsestate: 'S',
        truestate: 'Z',
        value: 0,
        dx: ''
        }



const params = [string_input, shift_pattern, sz];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const input_string: string = getOpParamValById(0, param_vals);
      const undulating_string: string = getOpParamValById(1, param_vals);
      const sz: number = getOpParamValById(2, param_vals);



      let regex_matches= utilInstance.parseRegex(input_string, shift_pattern.regex)
      let input_array = regex_matches.map(el => parseInt(el))

       regex_matches= utilInstance.parseRegex(undulating_string, shift_pattern.regex)
      let undulating_array = regex_matches.map(el => parseInt(el))




      let first_row = new Sequence.OneD();
      let under = true;
      input_array.forEach(input => {
        first_row.pushMultiple(under, input);
        under = !under;
      })

      let pattern = new Sequence.TwoD();

      undulating_array.forEach(shiftval => {
        let shift_dir = (sz) ? -1*shiftval : 1*shiftval;
        pattern.pushWeftSequence(new Sequence.OneD(first_row.val()).shift(shift_dir).val());
      })

      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'shifty';
}


export const undulatingtwill: Operation = {name, old_names, params, inlets, perform, generateName};



