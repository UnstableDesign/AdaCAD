import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";

const name = "shaded_satin";

const meta: OpMeta = {
  displayname: 'shaded satin',
  desc: 'Satin is a family of weave structures that create cloth with weft floats on one face of the fabric and warp floats on the other. The succeeding interlacements of warp and weft threads in each row occur on non-adjacent warp threads, creating a smooth surface of floating threads on each face. The number of ends between succeeding warp interlacements is consistent in each row (i.e. a 2/8 satin will have one raised warp end followed by a weft float over 8 warp ends in each row). Shaded satins typically use more than just one raised warp on each pic to control the visibility of the warp or weft colors proportionally.',
  img: 'shaded_satin.png',
  categories: [structureOp],
  advanced: true
}



//PARAMS
const warps_raised: NumParam = {
  name: 'warps raised',
  type: 'number',
  min: 0,
  max: 100,
  value: 2,
  dx: 'the number of warps to raise on the first pic'
}

const warps_lowered: NumParam =
{
  name: 'warps lowered',
  type: 'number',
  min: 0,
  max: 100,
  value: 5,
  dx: "the number of warps to keep lowered on the first pic"
}

const shift: NumParam = {
  name: 'shift',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'amount to offset the interlacements on each row'
}

const facing: BoolParam =
{
  name: 'facing',
  type: 'boolean',
  falsestate: "weft facing",
  truestate: "warp facing",
  value: 0,
  dx: ''
}



const params = [warps_raised, warps_lowered, shift, facing];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  const raised: number = <number>getOpParamValById(0, param_vals);
  const lowered: number = <number>getOpParamValById(1, param_vals);
  const shift: number = <number>getOpParamValById(2, param_vals);
  const facing: number = <number>getOpParamValById(3, param_vals);


  const first_row = new Sequence.OneD();
  first_row.pushMultiple(1, raised).pushMultiple(0, lowered);


  if (facing) first_row.invert();


  const pattern = new Sequence.TwoD();
  for (let i = 0; i < raised + lowered; i++) {
    pattern.pushWeftSequence(first_row.shift(shift).val());
  }


  return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'shaded satin(' + flattenParamVals(param_vals) + ")";
}


export const shaded_satin: Operation = { name, meta, params, inlets, perform, generateName };



