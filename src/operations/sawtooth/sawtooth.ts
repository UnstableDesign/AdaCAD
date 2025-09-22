import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";



const name = "sawtooth";

const meta: OpMeta = {
  displayname: 'sawtooth',
  desc: 'Creates a sawtooth pattern (e.g. mountain/valley zigzag) of a user specified width with a user specified number of teeth in the sawtooth as described by the segments parameter',
  img: 'sawtooth.png',
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
  name: 'pics',
  type: 'number',
  min: 1,
  max: 10000,
  value: 20,
  dx: "the total number of pics for the saw path to move through"
}

const segments: NumParam =
{
  name: 'segments',
  type: 'number',
  min: 1,
  max: 10000,
  value: 1,
  dx: "the total number of segments, each segment represents one half of the saw tooth's path "
}





const params = [width, amplitude, segments];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const warpnum: number = <number>getOpParamValById(0, param_vals);
  const pics: number = <number>getOpParamValById(1, param_vals);
  const peaks: number = <number>getOpParamValById(2, param_vals);


  const run = (warpnum / peaks);
  const slope = pics / run;

  const pattern = new Sequence.TwoD();
  for (let j = 0; j < warpnum; j++) {
    const x = j % Math.floor(run * 2);
    const i = Math.floor(slope * x);
    const seq = new Sequence.OneD().pushMultiple(0, pics);

    if (i < pics) seq.set(i, 1);
    else seq.set((pics - 1) - (i - pics), 1);
    pattern.pushWarpSequence(seq.val())
  }

  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'sawtooth(' + flattenParamVals(param_vals) + ")";
}


export const sawtooth: Operation = { name, meta, params, inlets, perform, generateName };



