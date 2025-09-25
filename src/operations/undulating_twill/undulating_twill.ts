import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById } from "../../operations";
import { StringParam, BoolParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { parseRegex } from "../../utils";
import { structureOp } from "../categories";


const name = "undulating_twill";

const meta: OpMeta = {
  displayname: 'undulating twill',
  desc: 'Twill is a family of weave structures in which weft picks pass over or under one or more warp threads in a repeating pattern. In this context, and undulating twill means tha the structure can shift by a non-repeating series of values, instead of by the same value on each pic (as is typically the case in twills)',
  img: 'undulatingtwill.png',
  categories: [structureOp],
  advanced: true,
  old_names: ['undulatingtwill']
}


//PARAMS
const string_input: StringParam =
{
  name: 'first pic pattern',
  type: 'string',
  regex: /\d+|\D+/i,
  value: '1 3 1 3',
  error: '',
  dx: 'the under over pattern of this twill'
};

const shift_pattern: StringParam =
{
  name: 'shift pattern',
  type: 'string',
  regex: /\d+|\D+/i,
  value: '1 1 1 2 2 3',
  error: '',
  dx: 'shifts the starting row by the amount specified on each subsequent pic to create undulating patterns'
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



const params = [string_input, shift_pattern, sz];

//INLETS

const inlets: OperationInlet[] = [];


const perform = (param_vals: Array<OpParamVal>) => {

  const input_string: string = <string>getOpParamValById(0, param_vals);
  const undulating_string: string = <string>getOpParamValById(1, param_vals);
  const sz: number = <number>getOpParamValById(2, param_vals);



  let regex_matches = parseRegex(input_string, shift_pattern.regex)
  const input_array = regex_matches.filter(el => el !== " ").map(el => parseInt(el))

  regex_matches = parseRegex(undulating_string, shift_pattern.regex)
  const undulating_array = regex_matches.filter(el => el !== " ").map(el => parseInt(el))




  const first_row = new Sequence.OneD();
  let under = true;
  input_array.forEach(input => {
    first_row.pushMultiple(under, input);
    under = !under;
  })

  const pattern = new Sequence.TwoD();

  undulating_array.forEach(shiftval => {
    const shift_dir = (sz) ? -1 * shiftval : 1 * shiftval;
    pattern.pushWeftSequence(new Sequence.OneD(first_row.val()).shift(shift_dir).val());
  })

  const draft = initDraftFromDrawdown(pattern.export())
  return Promise.resolve([{ draft }]);

}


const generateName = (): string => {
  return 'shifty';
}


export const undulating_twill: Operation = { name, meta, params, inlets, perform, generateName };



