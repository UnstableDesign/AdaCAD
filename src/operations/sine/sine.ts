import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "..";
import { NumParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";
import { defaults } from "../../utils";

const name = "sine";


const meta: OpMeta = {
  displayname: 'sine wave sample',
  desc: 'A sine wave is a mathematical function that produces values that repeats periodically over a given time window. When visualized, it looks like smooth curves traveling over and under a midpoint. In AdaCAD, a sine way is determines the position of a single interlacement along the ends of a structure.',
  img: 'sine.png',
  categories: [structureOp],
  advanced: true
}


//PARAMS
const width: NumParam =
{
  name: 'ends',
  type: 'number',
  min: 1,
  max: 10000,
  value: 100,
  dx: "the total ends of the draft"
};


const amplitude: NumParam =
{
  name: 'amplitude',
  type: 'number',
  min: 1,
  max: 10000,
  value: 20,
  dx: "the total number of pics for the sin wave to move through"
}

const freq: NumParam =
{
  name: 'frequency',
  type: 'number',
  min: 1,
  max: 10000,
  value: 50,
  dx: "controls number of waves to include "
}





const params = [width, amplitude, freq];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>,) => {

  const width: number = <number>getOpParamValById(0, param_vals);
  const amp: number = <number>getOpParamValById(1, param_vals);
  const freq: number = <number>getOpParamValById(2, param_vals);


  const pattern = new Sequence.TwoD();
  for (let j = 0; j < width; j++) {
    const seq = new Sequence.OneD().pushMultiple(0, amp);
    const i = Math.floor((amp / 2) * Math.sin(j * freq) + (amp / 2));
    seq.set(i, 1);
    pattern.pushWarpSequence(seq.val())
  }

  const draft = initDraftFromDrawdown(pattern.export())
  return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>,): string => {
  return 'sine(' + flattenParamVals(param_vals) + ")";
}

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
  const width: number = <number>getOpParamValById(0, param_vals);
  const amp: number = <number>getOpParamValById(1, param_vals);
  return (width * amp <= defaults.max_area) ? true : false;
}

export const sine: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };



