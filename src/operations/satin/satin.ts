import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, BoolParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";


const name = "satin";

const meta: OpMeta = {
  displayname: 'satin',
  desc: 'Satin is a family of weave structures that create cloth with weft floats on one face of the fabric and warp floats on the other. The succeeding interlacements of warp and weft threads in each row occur on non-adjacent warp threads, creating a smooth surface of floating threads on each face. The number of ends between succeeding warp interlacements is consistent in each row (i.e. a 1/8 satin will have one raised warp end followed by a weft float over 8 warp ends in each row).',
  img: 'satin.png',
  categories: [structureOp],
}



//PARAMS
const repeat: NumParam =
{
  name: 'repeat',
  type: 'number',
  min: 5,
  max: 5000,
  value: 5,
  dx: 'the width and height of the pattern'
}

const shift: NumParam =
{
  name: 'shift',
  type: 'number',
  min: 1,
  max: 5000,
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

  const draft = initDraftFromDrawdown(pattern.export())
  return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'satin(' + flattenParamVals(param_vals) + ")";
}


export const satin: Operation = { name, meta, params, inlets, perform, generateName };



