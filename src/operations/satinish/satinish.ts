import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { StringParam, NumParam, BoolParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";


const name = "satinish";


const meta: OpMeta = {
  displayname: 'satinish',
  desc: 'Generates a structure by shifting the first row (described by the input string), the number of shifts specified on each row. This operation interprets the  term "satin" loosely as a repeating pic that is shifted 1 or more positions on each successive pic. ',
  img: 'satinish.png',
  categories: [structureOp],
  advanced: true
}


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

const shift: NumParam =
{
  name: 'shift',
  type: 'number',
  min: 1,
  max: 5000,
  value: 2,
  dx: 'the move number on each row'
}

const sz: BoolParam =
{
  name: 'S/Z',
  type: 'boolean',
  falsestate: 'S',
  truestate: 'Z',
  value: 0,
  dx: ''
}



const params = [string_input, shift, sz];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const input_string: string = <string>getOpParamValById(0, param_vals);
  const shift: number = <number>getOpParamValById(1, param_vals);
  const sz: number = <number>getOpParamValById(2, param_vals);

  const input_array: Array<number> = input_string.split(' ').map(el => parseInt(el));

  const size: number = input_array.reduce((acc, val) => {
    return val + acc;
  }, 0);


  const first_row = new Sequence.OneD();
  let under = true;
  input_array.forEach(input => {
    first_row.pushMultiple(under, input);
    under = !under;
  })

  const pattern = new Sequence.TwoD();
  const shift_dir = (sz) ? -1 * shift : 1 * shift;
  for (let i = 0; i < size; i++) {
    pattern.pushWeftSequence(first_row.shift(shift_dir).val());
  }


  const draft = initDraftFromDrawdown(pattern.export())
  return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'satinish(' + flattenParamVals(param_vals) + ")";
}


export const satinish: Operation = { name, meta, params, inlets, perform, generateName };



