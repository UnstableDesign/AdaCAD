import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "..";
import { NumParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";


const name = "waffle";

const meta: OpMeta = {
  displayname: 'waffle',
  desc: 'Waffle weave is a twill-based structure in which warp and weft floats of increasing and then decreasing lengths are bound by a border of tabby interlacements to create a grid of cells. There is typically an equal number of pics and ends in a single pattern unit. This operation generates waffle structures based on specifying the longest float and number of binding rows to surround each waffle.',
  img: 'waffle.png',
  categories: [structureOp]
}

//PARAMS
const max_float: NumParam =
{
  name: 'float length',
  type: 'number',
  min: 3,
  max: 100,
  value: 7,
  dx: "the length of the longest float in the waffle structure. This number must be odd. If an even number is entered, the draft will make the longest float one less than the entered value."
};

const bindings: NumParam =
{
  name: 'binding rows',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: ""
}

const packing_factor: NumParam =
{
  name: 'packing',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: "controls how much each waffle will overlap. A higher number will lead to a tighter packing of waffles, where a lower number will lead to more spacing between waffles"
}


const params = [max_float, bindings, packing_factor];

//INLETS

const inlets: Array<OperationInlet> = [];



const perform = (param_vals: Array<OpParamVal>) => {

  let float: number = <number>getOpParamValById(0, param_vals);
  const bindings: number = <number>getOpParamValById(1, param_vals);
  const packing_factor: number = <number>getOpParamValById(2, param_vals);

  //always make it an odd number 
  if (float % 2 == 0) float -= 1;

  let max_binding = 1 + (bindings) * 2;
  const size = float + max_binding * 2;
  const center_point = Math.floor(size / 2);

  const pattern = new Sequence.TwoD();

  for (let i = 0; i < center_point; i++) {
    const float_len = float - i * 2;
    const row = new Sequence.OneD();
    if (float_len >= 0) {

      const pad = Math.floor((size - float_len) / 2);

      //push the float
      row.pushMultiple(1, float_len);

      for (let p = 0; p < pad; p++) {
        if (p < max_binding) {
          const val = (p % 2 == 0) ? 0 : 1;
          row.unshift(val)
          row.push(val)
        } else {
          row.unshift(0)
          row.push(0)
        }
      }
    } else {
      max_binding -= 1;

      const pad = Math.floor((size - max_binding * 2) / 2);
      row.pushMultiple(0, pad);
      for (let b = 0; b < max_binding * 2; b++) {
        if (b == 0) row.push(0)
        if (b % 2 == 0) row.push(1)
        else row.push(0);
      }
      row.pushMultiple(0, pad);

    }



    pattern.pushWeftSequence(row.val());

    //if we're not in the center, push to both size
    if (i > 0) {
      pattern.unshiftWeftSequence(row.val());
    }

  }

  //now delete the rows that would for duplicates when tiling
  pattern.deleteWarp(0);
  pattern.deleteWarp(0);

  for (let p = 0; p < packing_factor; p++) {
    pattern.deleteWarp(pattern.warps() - 1);
    pattern.deleteWeft(pattern.wefts() - 1);
    if (p > 0) {
      pattern.deleteWeft(0);
      pattern.deleteWarp(0);

    }
  }


  const draft = initDraftFromDrawdown(pattern.export())
  return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'waffle(' + flattenParamVals(param_vals) + ')';
}


export const waffle: Operation = { name, meta, params, inlets, perform, generateName };



