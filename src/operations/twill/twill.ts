import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById } from "../../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, Operation } from "../types";

const name = "twill";
const old_names: Array<string> = [];


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

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const raised: number = <number>getOpParamValById(0, param_vals);
  const lowered: number = <number>getOpParamValById(1, param_vals);
  const sz: number = <number>getOpParamValById(2, param_vals);
  const facing: number = <number>getOpParamValById(3, param_vals);


  const first_row = new Sequence.OneD();
  first_row.pushMultiple(1, raised).pushMultiple(0, lowered);

  if (facing) first_row.invert();


  const pattern = new Sequence.TwoD();
  const shift_dir = (sz) ? -1 : 1;
  for (let i = 0; i < (raised + lowered); i++) {
    pattern.pushWeftSequence(first_row.shift(shift_dir).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  const raised: number = <number>getOpParamValById(0, param_vals);
  const lowered: number = <number>getOpParamValById(1, param_vals);
  const sz: number = <number>getOpParamValById(2, param_vals);
  const dir: string = (sz) ? "S" : "Z";
  return 'twill(' + raised + "," + lowered + "," + dir + ')';
}


export const twill: Operation = { name, old_names, params, inlets, perform, generateName };



