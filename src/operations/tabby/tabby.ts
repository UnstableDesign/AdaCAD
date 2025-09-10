import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, Operation } from "../types";

const name = "tabbyder";
const old_names = ['tabby'];

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
  value: 1,
  dx: ""
}

const base_pics: NumParam =
{
  name: 'base pics',
  type: 'number',
  min: 0,
  max: 100,
  value: 1,
  dx: 'the number of pics upon which the first tabby pic will be repeated'
};

const alt_pics: NumParam =
{
  name: 'alt pics',
  type: 'number',
  min: 0,
  max: 100,
  value: 1,
  dx: 'the number of pics upon which the repeat the alteranting pattern'
};

const params = [warps_raised, warps_lowered, base_pics, alt_pics];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const raised: number = <number>getOpParamValById(0, param_vals);
  const lowered: number = <number>getOpParamValById(1, param_vals);
  const rep: number = <number>getOpParamValById(2, param_vals);
  const alt_rep: number = <number>getOpParamValById(3, param_vals);


  const first_row = new Sequence.OneD();
  for (let j = 0; j < raised; j++) {
    first_row.push(1);
  }

  for (let j = 0; j < lowered; j++) {
    first_row.push(0);
  }


  const pattern = new Sequence.TwoD();
  for (let i = 0; i < rep; i++) {
    pattern.pushWeftSequence(first_row.val());
  }

  const inverted = first_row.invert().val();

  for (let i = 0; i < alt_rep; i++) {
    pattern.pushWeftSequence(inverted);
  }

  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'tabby(' + flattenParamVals(param_vals) + ')';
}


export const tabby_der: Operation = { name, old_names, params, inlets, perform, generateName };



