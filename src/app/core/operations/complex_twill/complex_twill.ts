import { initDraftFromDrawdown } from "adacad-drafting-lib/draft";
import { BoolParam, Operation, OpInput, OpParamVal, StringParam } from "../../model/datatypes";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "complextwill";
const old_names = [];

//PARAMS
const string_input: StringParam =
{
  name: 'pattern',
  type: 'string',
  regex: /^(\d+\s)*\d+\s*$/i,
  value: '2 2 3 3',
  error: '',
  dx: 'the under over pattern of this twill'
};


const sz: BoolParam =
{
  name: 'S/Z',
  type: 'boolean',
  falsestate: 'S',
  truestate: 'Z',
  value: 0,
  dx: ''
}


const params = [string_input, sz];

//INLETS

const inlets = [];


const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_string: string = getOpParamValById(0, param_vals);
  const sz: number = getOpParamValById(1, param_vals);

  const input_array: Array<number> = input_string.split(' ').map(el => parseInt(el));

  let size: number = input_array.reduce((acc, val) => {
    return val + acc;
  }, 0);


  let first_row = new Sequence.OneD();
  let under = true;
  input_array.forEach(input => {
    first_row.pushMultiple(under, input);
    under = !under;
  })

  let pattern = new Sequence.TwoD();
  let shift_dir = (sz) ? -1 : 1;
  for (let i = 0; i < size; i++) {
    pattern.pushWeftSequence(first_row.shift(shift_dir).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  return 'complex twill';
}


export const complextwill: Operation = { name, old_names, params, inlets, perform, generateName };



