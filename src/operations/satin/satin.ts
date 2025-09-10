import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, Operation } from "../types";


const name = "satin";
const old_names: Array<string> = [];


//PARAMS
const repeat: NumParam =
{
  name: 'repeat',
  type: 'number',
  min: 5,
  max: 100,
  value: 5,
  dx: 'the width and height of the pattern'
}

const shift: NumParam =
{
  name: 'shift',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'the move number on each row'
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



const params = [repeat, shift, facing];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const repeat: number = <number>getOpParamValById(0, param_vals);
  const shift: number = <number>getOpParamValById(1, param_vals);
  const facing: number = <number>getOpParamValById(2, param_vals);


  const first_row = new Sequence.OneD();
  first_row.push(1);

  for (let j = 0; j < repeat - 1; j++) {
    first_row.push(0);
  }

  if (facing) first_row.invert();


  const pattern = new Sequence.TwoD();
  for (let i = 0; i < repeat; i++) {
    pattern.pushWeftSequence(first_row.shift(shift).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'satin(' + flattenParamVals(param_vals) + ")";
}


export const satin: Operation = { name, old_names, params, inlets, perform, generateName };



