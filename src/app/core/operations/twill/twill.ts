import { initDraftFromDrawdown } from "adacad-drafting-lib/draft";
import { BoolParam, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "twill";
const old_names = [];

//PARAMS
const warps_raised: NumParam =
{
  name: 'warps raised',
  type: 'number',
  min: 0,
  max: 100,
  value: 1,
  dx: ""
};


const warps_lowered: NumParam =
{
  name: 'warps lowered',
  type: 'number',
  min: 0,
  max: 100,
  value: 3,
  dx: ""
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

const facing: BoolParam =
{
  name: 'facing',
  type: 'boolean',
  falsestate: "A",
  truestate: "B",
  value: 0,
  dx: ''
}



const params = [warps_raised, warps_lowered, sz, facing];

//INLETS

const inlets = [];


const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const raised: number = getOpParamValById(0, param_vals);
  const lowered: number = getOpParamValById(1, param_vals);
  const sz: number = getOpParamValById(2, param_vals);
  const facing: number = getOpParamValById(3, param_vals);


  let first_row = new Sequence.OneD();
  first_row.pushMultiple(1, raised).pushMultiple(0, lowered);

  if (facing) first_row.invert();


  let pattern = new Sequence.TwoD();
  let shift_dir = (sz) ? -1 : 1;
  for (let i = 0; i < (raised + lowered); i++) {
    pattern.pushWeftSequence(first_row.shift(shift_dir).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const raised: number = getOpParamValById(0, param_vals);
  const lowered: number = getOpParamValById(1, param_vals);
  const sz: number = getOpParamValById(2, param_vals);
  const dir: string = (sz) ? "S" : "Z";
  return raised + "/" + lowered + dir + 'twill';
}


export const twill: Operation = { name, old_names, params, inlets, perform, generateName };



