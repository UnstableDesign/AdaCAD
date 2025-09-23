import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { StringParam, BoolParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";

const name = "complex_twill";

const meta: OpMeta = {
  displayname: "complex twill",
  desc: "In this context, a complex twill is a straight twill with multiple ratios of interlacement in a single structure unit so that a 2 2 3 3 pattern describes a structure with two raised warp ends, two lowered ends, three raised ends, and three lowered ends. Each successive pic begins the same pattern of interlacement on an adjacent warp end, creating a diagonal pattern.",
  advanced: true,
  categories: [structureOp],
  img: 'complex_twill.png',
  old_names: ['complextwill']
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

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const input_string: string = <string>getOpParamValById(0, param_vals);
  const sz: number = <number>getOpParamValById(1, param_vals);

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
  const shift_dir = (sz) ? -1 : 1;
  for (let i = 0; i < size; i++) {
    pattern.pushWeftSequence(first_row.shift(shift_dir).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'complex twill(' + flattenParamVals(param_vals) + ")";
}


export const complex_twill: Operation = { name, meta, params, inlets, perform, generateName };



